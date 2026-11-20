"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload, Video } from "lucide-react";
import { apiUploadProgress } from "@/lib/api";

const IMAGE_MAX = 15 * 1024 * 1024;
const VIDEO_MAX = 200 * 1024 * 1024;

interface UploadResult {
  kind: "image" | "video";
  url: string;
}

/**
 * Upload-backed field for images and videos: drag and drop or browse, upload progress, preview,
 * replace and remove. The stored value is a plain URL, so a hosted file (e.g. an external video)
 * can still be pasted. Type and size are checked here and again by the server.
 */
export function MediaField({
  kind,
  value,
  onChange,
  disabled,
  title,
  required,
}: {
  kind: "image" | "video";
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  title: string;
  required?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const accept =
    kind === "image"
      ? "image/jpeg,image/png,image/webp,image/avif"
      : "video/mp4,video/webm";
  const max = kind === "image" ? IMAGE_MAX : VIDEO_MAX;

  async function upload(file: File) {
    setError(null);
    const okType =
      kind === "image"
        ? /^image\/(jpeg|png|webp|avif)$/.test(file.type)
        : /^video\/(mp4|webm)$/.test(file.type);
    if (!okType) {
      setError(
        kind === "image"
          ? "Use a JPG, PNG, WebP or AVIF image."
          : "Use an MP4 or WebM video.",
      );
      return;
    }
    if (file.size > max) {
      setError(`The file is too large (max ${Math.round(max / 1024 / 1024)} MB).`);
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setProgress(0);
    try {
      const res = await apiUploadProgress<UploadResult>(
        "/admin/pro-media",
        form,
        setProgress,
      );
      onChange(res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please retry.");
    } finally {
      setProgress(null);
    }
  }

  const Icon = kind === "image" ? ImagePlus : Video;
  return (
    <div className="grid min-w-0 gap-1 text-xs md:col-span-2">
      <span className="font-semibold">
        {title}
        {required ? " *" : ""}
      </span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !disabled) void upload(f);
        }}
        className={`rounded-lg border border-dashed p-3 ${over ? "border-foreground bg-muted/50" : "border-border"}`}
      >
        {value ? (
          <div className="mb-3 overflow-hidden rounded-md bg-muted/40">
            {kind === "image" ? (
              <img src={value} alt="" className="max-h-48 w-auto object-contain" />
            ) : (
              <video
                src={value}
                controls
                preload="metadata"
                className="max-h-56 w-full"
              />
            )}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled || progress !== null}
            onClick={() => input.current?.click()}
            className="pl-btn pl-btn--sm"
          >
            {value ? <Upload className="size-4" /> : <Icon className="size-4" />}
            {value ? "Replace" : kind === "image" ? "Upload image" : "Upload video"}
          </button>
          {value && !disabled && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="pl-btn pl-btn--sm"
              aria-label={`Remove ${kind}`}
            >
              <Trash2 className="size-4" /> Remove
            </button>
          )}
          <span className="pl-help !mt-0">
            or drop a file here ·{" "}
            {kind === "image" ? "JPG, PNG, WebP, AVIF" : "MP4, WebM"} · up to{" "}
            {Math.round(max / 1024 / 1024)} MB
          </span>
          <input
            ref={input}
            type="file"
            accept={accept}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }}
          />
        </div>
        {progress !== null && (
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-1.5 overflow-hidden rounded bg-muted"
          >
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <input
          disabled={disabled}
          className="pl-input mt-3"
          placeholder={
            kind === "image" ? "…or paste an image URL" : "…or paste a video URL"
          }
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {error && (
          <p role="alert" className="mt-2" style={{ color: "var(--pl-critical)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
