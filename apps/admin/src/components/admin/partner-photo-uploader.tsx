"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { apiUploadProgress } from "@/lib/api";

interface Uploaded {
  url: string;
  cardUrl: string;
}
const MAX = 10;
const ACCEPT = "image/jpeg,image/png,image/webp";

const thumb = (url: string) => url.replace(/\/main$/, "/card");

/** Photo gallery editor: drag & drop or browse; the first photo is the cover. Stores local URLs. */
export function PartnerPhotoUploader({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; pct: number }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const current = useRef(value);
  current.current = value;

  const upload = async (files: File[]) => {
    const room = MAX - current.current.length;
    const accepted = files
      .filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type))
      .slice(0, Math.max(room, 0));
    const problems: string[] = [];
    files
      .filter((f) => !/^image\/(jpeg|png|webp)$/.test(f.type))
      .forEach((f) => problems.push(`${f.name}: use JPEG, PNG or WebP.`));
    if (files.length > accepted.length + problems.length)
      problems.push(`Up to ${MAX} photos per partner.`);
    setErrors(problems);
    for (const file of accepted) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors((e) => [...e, `${file.name}: larger than 10 MB.`]);
        continue;
      }
      setUploading((u) => [...u, { name: file.name, pct: 0 }]);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await apiUploadProgress<Uploaded>(
          "/admin/partners/media",
          form,
          (pct) =>
            setUploading((u) => u.map((x) => (x.name === file.name ? { ...x, pct } : x))),
        );
        onChange([...current.current, res.url]);
      } catch (e) {
        setErrors((list) => [
          ...list,
          `${file.name}: ${e instanceof Error ? e.message : "upload failed."}`,
        ]);
      } finally {
        setUploading((u) => u.filter((x) => x.name !== file.name));
      }
    }
  };

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {!disabled && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void upload(Array.from(e.dataTransfer.files));
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${drag ? "border-[var(--pl-text)] bg-[var(--pl-bg)]" : "border-[var(--pl-border)]"}`}
        >
          <UploadCloud
            className="size-6"
            style={{ color: "var(--pl-placeholder)" }}
            aria-hidden
          />
          <p className="text-[13px]">
            Drag photos here or{" "}
            <button
              type="button"
              className="pl-link font-semibold"
              onClick={() => input.current?.click()}
              disabled={value.length >= MAX}
            >
              browse files
            </button>
          </p>
          <p className="pl-help !mt-0">
            JPEG, PNG or WebP · up to 10 MB each · {value.length}/{MAX} photos
          </p>
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void upload(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      )}

      {errors.length > 0 && (
        <ul
          role="alert"
          className="space-y-1 text-[13px]"
          style={{ color: "var(--pl-critical)" }}
        >
          {errors.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}

      {(value.length > 0 || uploading.length > 0) && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, i) => (
            <li
              key={url}
              className="group relative overflow-hidden rounded-lg border border-[var(--pl-border)] bg-[var(--pl-bg)]"
            >
              <img
                src={thumb(url)}
                alt={`Partner photo ${i + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <Star className="size-3" aria-hidden /> Cover
                </span>
              )}
              {!disabled && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 text-white">
                  <span className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Move earlier"
                      className="grid size-8 place-items-center rounded-md bg-white/20 hover:bg-white/35 disabled:opacity-30"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowLeft className="size-4 rtl:rotate-180" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move later"
                      className="grid size-8 place-items-center rounded-md bg-white/20 hover:bg-white/35 disabled:opacity-30"
                      disabled={i === value.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowRight className="size-4 rtl:rotate-180" />
                    </button>
                  </span>
                  <button
                    type="button"
                    aria-label="Remove photo"
                    className="grid size-8 place-items-center rounded-md bg-white/20 hover:bg-red-600"
                    onClick={() => onChange(value.filter((u) => u !== url))}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
          {uploading.map((u) => (
            <li
              key={u.name}
              className="grid aspect-[4/3] place-items-center rounded-lg border border-[var(--pl-border)] bg-[var(--pl-bg)] p-3 text-center"
              aria-busy
            >
              <span className="w-full">
                <ImagePlus
                  className="mx-auto size-5"
                  style={{ color: "var(--pl-placeholder)" }}
                  aria-hidden
                />
                <span className="mt-2 block truncate text-xs">{u.name}</span>
                <span
                  className="mt-2 block h-1.5 overflow-hidden rounded-full bg-black/10"
                  role="progressbar"
                  aria-valuenow={u.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span
                    className="block h-full bg-[var(--pl-text)] transition-[width]"
                    style={{ width: `${u.pct}%` }}
                  />
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
