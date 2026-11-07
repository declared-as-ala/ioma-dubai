import type { AuthResult } from "@ioma/types";
import { useAuthStore } from "@/stores/auth-store";

// Thin fetch wrapper — every API read/write goes through this (used from
// TanStack Query hooks), never an ad hoc `fetch` inside a component, per
// CLAUDE.md. Empty NEXT_PUBLIC_API_URL means "same origin" (production,
// behind the reverse proxy — see DEPLOYMENT.md); dev sets it to the API's
// own port directly.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function apiUploadProgress<T>(
  path: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<T> {
  const send = (token: string | null) =>
    new Promise<{ status: number; body: T & { message?: string } }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/api${path}`);
      xhr.timeout = 120000;
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onerror = xhr.ontimeout = () =>
        reject(new ApiError(503, "Upload unavailable. Please retry."));
      xhr.onload = () => {
        try {
          resolve({ status: xhr.status, body: JSON.parse(xhr.responseText) });
        } catch {
          reject(new ApiError(xhr.status, "Upload failed."));
        }
      };
      xhr.send(formData);
    });
  let result = await send(useAuthStore.getState().accessToken);
  if (result.status === 401) {
    const token = await refreshAccessToken();
    if (token) result = await send(token);
  }
  if (result.status < 200 || result.status >= 300)
    throw new ApiError(result.status, result.body.message ?? "Upload failed.");
  return result.body;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errorCode?: string,
    public fields?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function rawFetch(path: string, options: RequestInit, accessToken: string | null) {
  return fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
}

// A single in-flight refresh is shared across concurrent 401s so a page
// that fires several authenticated requests at once doesn't each try to
// rotate the refresh token independently — the API's refresh-token reuse
// detection (see PROGRESS.md Sprint 1) would treat the second rotation of
// an already-rotated token as a stolen-token replay and revoke the whole
// session.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, clearSession, setSession } = useAuthStore.getState();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await rawFetch(
          "/auth/refresh",
          { method: "POST", body: JSON.stringify({ refreshToken }) },
          null,
        );
        if (!response.ok) {
          clearSession();
          return null;
        }
        const result: AuthResult = await response.json();
        setSession(result);
        return result.accessToken;
      } catch {
        clearSession();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export async function apiFetch<TResponse>(
  path: string,
  options?: RequestInit,
): Promise<TResponse> {
  const isRefreshCall = path === "/auth/refresh";
  const accessToken = useAuthStore.getState().accessToken;

  let response = await rawFetch(path, options ?? {}, accessToken);

  if (response.status === 401 && !isRefreshCall && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await rawFetch(path, options ?? {}, newToken);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const rawMsg = body?.message;
    const msg =
      typeof rawMsg === "string"
        ? rawMsg
        : (rawMsg?.message ?? "An unexpected error occurred.");
    const fields =
      body?.fields ?? (typeof rawMsg === "object" ? rawMsg?.fields : undefined);
    const formattedMsg = fields?.length
      ? `${msg} (${fields.map((f: { field: string; message: string }) => `${f.field}: ${f.message}`).join(", ")})`
      : msg;
    throw new ApiError(response.status, formattedMsg, body?.errorCode, fields);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  const text = await response.text();
  if (!text) return undefined as TResponse;
  return JSON.parse(text) as Promise<TResponse>;
}

// FormData upload — never set a JSON Content-Type header here, the browser
// must set its own `multipart/form-data; boundary=...` value. Shares the
// same access-token/401-refresh handling as apiFetch above.
export async function apiUpload<TResponse>(
  path: string,
  formData: FormData,
): Promise<TResponse> {
  const accessToken = useAuthStore.getState().accessToken;

  const send = (token: string | null) =>
    fetch(`${API_BASE_URL}/api${path}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

  let response = await send(accessToken);

  if (response.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await send(newToken);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      body?.message ?? "An unexpected error occurred.",
      body?.errorCode,
    );
  }

  const text = await response.text();
  if (!text) return undefined as TResponse;
  return JSON.parse(text) as Promise<TResponse>;
}
