"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Film,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useAdminAccess } from "@/hooks/use-admin";
import { apiFetch, apiUploadProgress } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  SegmentedControl,
  Textarea,
  Toggle,
} from "./polaris";
import { AdminQueryState } from "./admin-ui";

type Bi = { en: string; ar: string };
interface Slide {
  id: string;
  tab: Bi;
  kicker: Bi;
  line1: Bi;
  line2: Bi;
  body: Bi;
  ctaLabel: Bi;
  ctaHref: string;
  moreLabel: Bi;
  moreHref: string;
  videoUrl: string;
  posterUrl: string;
  order: number;
  status: "active" | "inactive";
}
type Draft = Omit<Slide, "id" | "order">;

const empty = (): Draft => ({
  tab: { en: "", ar: "" },
  kicker: { en: "", ar: "" },
  line1: { en: "", ar: "" },
  line2: { en: "", ar: "" },
  body: { en: "", ar: "" },
  ctaLabel: { en: "Shop the collection", ar: "تسوّق المجموعة" },
  ctaHref: "/shop",
  moreLabel: { en: "Our technology", ar: "تقنيتنا" },
  moreHref: "/technology",
  videoUrl: "",
  posterUrl: "",
  status: "active",
});
const KEY = ["admin", "hero-slides"];
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/* ------------------------------------------------------------------ */
export function AdminHero() {
  const qc = useQueryClient();
  const access = useAdminAccess();
  const manage = !!access.data?.permissions.length;
  const list = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<Slide[]>("/admin/hero/slides"),
  });
  const [editing, setEditing] = useState<Slide | "new" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const refresh = () => qc.invalidateQueries({ queryKey: KEY });

  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<Slide[]>("/admin/hero/slides/order", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: (data) => qc.setQueryData(KEY, data),
    onError: () => setMessage({ kind: "error", text: "Could not reorder the slides." }),
  });
  const toggle = useMutation({
    mutationFn: (s: Slide) => {
      const { id: _id, order: _o, ...rest } = s;
      return apiFetch(`/admin/hero/slides/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...rest,
          status: s.status === "active" ? "inactive" : "active",
        }),
      });
    },
    onSuccess: refresh,
    onError: () =>
      setMessage({ kind: "error", text: "Could not change the slide status." }),
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/hero/slides/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setConfirmDelete(null);
      setMessage({ kind: "ok", text: "Slide deleted." });
      return refresh();
    },
    onError: () => setMessage({ kind: "error", text: "Could not delete the slide." }),
  });

  const slides = list.data ?? [];
  const move = (i: number, d: -1 | 1) => {
    const ids = slides.map((s) => s.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    reorder.mutate(ids);
  };
  const live = slides.filter((s) => s.status === "active" && s.videoUrl).length;

  return (
    <div className="mx-auto max-w-[1100px] space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="pl-page-title">Home hero</h1>
          <p className="pl-help !mt-0">
            The videos and text of the home page banner. Slides play in this order; only
            active slides with a video are shown.
          </p>
        </div>
        {manage && (
          <Button variant="primary" onClick={() => setEditing("new")}>
            <Plus /> Add slide
          </Button>
        )}
      </header>

      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className="pl-card flex items-start justify-between gap-3 !p-3"
          style={{
            color: message.kind === "error" ? "var(--pl-critical)" : "var(--pl-success)",
          }}
        >
          <span>{message.text}</span>
          <button
            type="button"
            aria-label="Dismiss"
            className="pl-icon-btn"
            onClick={() => setMessage(null)}
          >
            <X />
          </button>
        </div>
      )}

      <AdminQueryState query={list}>
        {slides.length === 0 ? (
          <Card>
            <div className="px-6 py-10 text-center">
              <Film
                className="mx-auto size-8"
                style={{ color: "var(--pl-placeholder)" }}
                aria-hidden
              />
              <p className="mt-2 text-[13px] font-semibold">No custom slides yet</p>
              <p className="pl-help">
                The website is showing its built-in reel. Add a slide to take over the
                banner.
              </p>
              {manage && (
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => setEditing("new")}
                >
                  <Plus /> Add the first slide
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            <p className="pl-help !mt-0">
              {live} of {slides.length} slide{slides.length === 1 ? "" : "s"} live on the
              website.
            </p>
            <ol className="space-y-3">
              {slides.map((s, i) => (
                <li key={s.id} className="pl-card flex flex-wrap items-center gap-4 !p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--pl-bg)] text-[13px] font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <div className="relative aspect-video w-44 shrink-0 overflow-hidden rounded-lg bg-black">
                    {s.videoUrl ? (
                      <video
                        src={s.videoUrl}
                        poster={s.posterUrl || undefined}
                        muted
                        playsInline
                        preload="metadata"
                        className="size-full object-cover"
                        onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-xs text-white/70">
                        No video
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate text-[13px] font-semibold">
                      {[s.line1.en, s.line2.en].filter(Boolean).join(" ") ||
                        "Untitled slide"}
                    </p>
                    <p className="pl-help !mt-0 truncate">{s.kicker.en || s.tab.en}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={s.status === "active" ? "success" : "neutral"}>
                        {s.status === "active" ? "Active" : "Hidden"}
                      </Badge>
                      {!s.videoUrl && <Badge tone="warning">Needs a video</Badge>}
                    </p>
                  </div>
                  {manage && (
                    <div className="ms-auto flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        className="pl-icon-btn"
                        aria-label="Move up"
                        disabled={i === 0 || reorder.isPending}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp />
                      </button>
                      <button
                        type="button"
                        className="pl-icon-btn"
                        aria-label="Move down"
                        disabled={i === slides.length - 1 || reorder.isPending}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown />
                      </button>
                      <Toggle
                        aria-label={s.status === "active" ? "Hide slide" : "Show slide"}
                        checked={s.status === "active"}
                        disabled={toggle.isPending}
                        onChange={() => toggle.mutate(s)}
                      />
                      <Button small onClick={() => setEditing(s)}>
                        <Pencil /> Edit
                      </Button>
                      {confirmDelete === s.id ? (
                        <span
                          role="alertdialog"
                          aria-label="Confirm delete"
                          className="flex items-center gap-1"
                        >
                          <Button
                            small
                            variant="destructive"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(s.id)}
                          >
                            Delete
                          </Button>
                          <Button
                            small
                            variant="plain"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Keep
                          </Button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="pl-icon-btn"
                          aria-label="Delete slide"
                          onClick={() => setConfirmDelete(s.id)}
                        >
                          <Trash2 />
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </AdminQueryState>

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent side="right" className="admin-shell w-full gap-0 p-0 sm:max-w-2xl">
          {editing && (
            <SlideForm
              key={editing === "new" ? "new" : editing.id}
              slide={editing === "new" ? null : editing}
              onCancel={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null);
                setMessage({
                  kind: "ok",
                  text: "Slide saved. The website updates within a minute.",
                });
                await refresh();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Upload({
  kind,
  value,
  onChange,
  accept,
  hint,
}: {
  kind: "video" | "poster";
  value: string;
  onChange: (url: string) => void;
  accept: string;
  hint: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const limit = kind === "video" ? 80 : 10;

  const send = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (file.size > limit * 1024 * 1024)
      return setError(`${file.name} is ${mb(file.size)}. The limit is ${limit} MB.`);
    setPct(0);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiUploadProgress<{ url: string }>(
        `/admin/hero/media?kind=${kind}`,
        form,
        setPct,
      );
      onChange(res.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setPct(null);
    }
  };

  return (
    <div className="space-y-2">
      {value && kind === "video" && (
        <video
          src={value}
          controls
          muted
          playsInline
          preload="metadata"
          className="aspect-video w-full rounded-lg bg-black"
        />
      )}
      {value && kind === "poster" && (
        <img
          src={value}
          alt="Poster preview"
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void send(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center ${drag ? "border-[var(--pl-text)] bg-[var(--pl-bg)]" : "border-[var(--pl-border)]"}`}
      >
        {kind === "video" ? (
          <UploadCloud
            className="size-6"
            style={{ color: "var(--pl-placeholder)" }}
            aria-hidden
          />
        ) : (
          <ImagePlus
            className="size-6"
            style={{ color: "var(--pl-placeholder)" }}
            aria-hidden
          />
        )}
        {pct !== null ? (
          <div className="w-full max-w-xs" aria-busy>
            <p className="text-[13px]">Uploading… {pct}%</p>
            <span
              className="mt-2 block h-1.5 overflow-hidden rounded-full bg-black/10"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="block h-full bg-[var(--pl-text)] transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </span>
          </div>
        ) : (
          <>
            <p className="text-[13px]">
              Drag a file here or{" "}
              <button
                type="button"
                className="pl-link font-semibold"
                onClick={() => input.current?.click()}
              >
                {value ? "replace it" : "browse files"}
              </button>
            </p>
            <p className="pl-help !mt-0">{hint}</p>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void send(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {value && pct === null && (
        <button
          type="button"
          className="pl-link text-[13px]"
          onClick={() => onChange("")}
        >
          Remove {kind === "video" ? "video" : "poster"}
        </button>
      )}
      {error && (
        <p role="alert" className="text-[13px]" style={{ color: "var(--pl-critical)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function SlideForm({
  slide,
  onCancel,
  onSaved,
}: {
  slide: Slide | null;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [v, setV] = useState<Draft>(() => {
    if (!slide) return empty();
    const { id: _id, order: _o, ...rest } = slide;
    return rest;
  });
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [tried, setTried] = useState(false);
  const bi = (
    key: "tab" | "kicker" | "line1" | "line2" | "body" | "ctaLabel" | "moreLabel",
    l: "en" | "ar",
    value: string,
  ) => setV((s) => ({ ...s, [key]: { ...s[key], [l]: value } }));

  const errors: Record<string, string> = {};
  if (!v.videoUrl) errors.video = "Upload a video for this slide.";
  (["line1", "line2", "ctaLabel"] as const).forEach((k) => {
    if (!v[k].en.trim() || !v[k].ar.trim())
      errors[k] = "Fill this in English and Arabic.";
  });
  if (!v.tab.en.trim() || !v.tab.ar.trim())
    errors.tab = "Fill this in English and Arabic.";
  const okHref = (h: string) =>
    (h.startsWith("/") && !h.startsWith("//")) || /^https:\/\//i.test(h);
  if (!okHref(v.ctaHref)) errors.ctaHref = "Use a site path like /shop or an https link.";
  if (v.moreLabel.en.trim() && !okHref(v.moreHref))
    errors.moreHref = "Use a site path like /shop or an https link.";

  const save = useMutation({
    mutationFn: () =>
      apiFetch(slide ? `/admin/hero/slides/${slide.id}` : "/admin/hero/slides", {
        method: slide ? "PATCH" : "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: () => onSaved(),
  });
  const err = (k: string) => (tried ? errors[k] : undefined);
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <form
      className="flex h-full min-h-0 flex-col"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (Object.keys(errors).length === 0) save.mutate();
      }}
    >
      <SheetHeader className="border-b border-[var(--pl-border-subtle)] px-6 py-4 text-start">
        <SheetTitle className="text-[15px] font-semibold">
          {slide ? "Edit slide" : "Add a slide"}
        </SheetTitle>
        <SheetDescription className="text-[13px]">
          One chapter of the home banner: a video, a headline and a button.
        </SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--pl-bg)] p-4 sm:p-6">
        {tried && Object.keys(errors).length > 0 && (
          <p
            role="alert"
            className="rounded-lg border p-3 text-[13px]"
            style={{ borderColor: "var(--pl-critical)", color: "var(--pl-critical)" }}
          >
            Fix {Object.keys(errors).length} field
            {Object.keys(errors).length === 1 ? "" : "s"} below to save.
          </p>
        )}

        <Card title="Video">
          <Upload
            kind="video"
            value={v.videoUrl}
            onChange={(url) => setV((s) => ({ ...s, videoUrl: url }))}
            accept="video/mp4,video/webm"
            hint="MP4 or WebM · up to 80 MB · landscape 16:9, no sound needed · 5–15 seconds works best"
          />
          {err("video") && (
            <p
              role="alert"
              className="mt-2 text-[13px]"
              style={{ color: "var(--pl-critical)" }}
            >
              {err("video")}
            </p>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-[13px] font-semibold">
              Poster image (optional)
            </summary>
            <div className="mt-3">
              <Upload
                kind="poster"
                value={v.posterUrl}
                onChange={(url) => setV((s) => ({ ...s, posterUrl: url }))}
                accept="image/jpeg,image/png,image/webp"
                hint="Shown while the video loads · JPEG, PNG or WebP · up to 10 MB"
              />
            </div>
          </details>
        </Card>

        <Card
          title="Text"
          action={
            <SegmentedControl
              ariaLabel="Language"
              value={lang}
              onChange={setLang}
              options={[
                { value: "en", label: "English" },
                { value: "ar", label: "العربية" },
              ]}
            />
          }
        >
          <div className="grid gap-4">
            <Field
              label="Chapter name (progress bar)"
              htmlFor="h-tab"
              error={err("tab")}
              help="One or two words, e.g. Measure."
            >
              <Input
                id="h-tab"
                dir={dir}
                value={v.tab[lang]}
                onChange={(e) => bi("tab", lang, e.target.value)}
                maxLength={30}
              />
            </Field>
            <Field label="Small label above the headline" htmlFor="h-kick">
              <Input
                id="h-kick"
                dir={dir}
                value={v.kicker[lang]}
                onChange={(e) => bi("kicker", lang, e.target.value)}
                maxLength={80}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Headline — line 1" htmlFor="h-l1" error={err("line1")}>
                <Input
                  id="h-l1"
                  dir={dir}
                  value={v.line1[lang]}
                  onChange={(e) => bi("line1", lang, e.target.value)}
                  maxLength={60}
                />
              </Field>
              <Field
                label="Headline — line 2 (accent colour)"
                htmlFor="h-l2"
                error={err("line2")}
              >
                <Input
                  id="h-l2"
                  dir={dir}
                  value={v.line2[lang]}
                  onChange={(e) => bi("line2", lang, e.target.value)}
                  maxLength={60}
                />
              </Field>
            </div>
            <Field label="Description" htmlFor="h-body" help="One short sentence.">
              <Textarea
                id="h-body"
                rows={2}
                dir={dir}
                value={v.body[lang]}
                onChange={(e) => bi("body", lang, e.target.value)}
                maxLength={200}
              />
            </Field>
          </div>
        </Card>

        <Card title="Buttons">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={`Main button text (${lang === "en" ? "English" : "Arabic"})`}
              htmlFor="h-cta"
              error={err("ctaLabel")}
            >
              <Input
                id="h-cta"
                dir={dir}
                value={v.ctaLabel[lang]}
                onChange={(e) => bi("ctaLabel", lang, e.target.value)}
                maxLength={40}
              />
            </Field>
            <Field
              label="Main button link"
              htmlFor="h-ctah"
              error={err("ctaHref")}
              help="e.g. /shop, /booking, /technology"
            >
              <Input
                id="h-ctah"
                dir="ltr"
                value={v.ctaHref}
                onChange={(e) => setV((s) => ({ ...s, ctaHref: e.target.value }))}
              />
            </Field>
            <Field
              label={`Secondary link text (${lang === "en" ? "English" : "Arabic"})`}
              htmlFor="h-more"
            >
              <Input
                id="h-more"
                dir={dir}
                value={v.moreLabel[lang]}
                onChange={(e) => bi("moreLabel", lang, e.target.value)}
                maxLength={40}
              />
            </Field>
            <Field label="Secondary link" htmlFor="h-moreh" error={err("moreHref")}>
              <Input
                id="h-moreh"
                dir="ltr"
                value={v.moreHref}
                onChange={(e) => setV((s) => ({ ...s, moreHref: e.target.value }))}
              />
            </Field>
          </div>
        </Card>

        <Card title="Visibility">
          <Toggle
            label={
              v.status === "active"
                ? "Active — shown on the website"
                : "Hidden — saved but not shown"
            }
            checked={v.status === "active"}
            onChange={(e) =>
              setV((s) => ({ ...s, status: e.target.checked ? "active" : "inactive" }))
            }
          />
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--pl-border-subtle)] bg-white px-6 py-3">
        <p
          role="status"
          className="min-w-0 truncate text-[13px]"
          style={{ color: "var(--pl-critical)" }}
        >
          {save.isError
            ? save.error instanceof Error
              ? save.error.message
              : "Could not save the slide."
            : ""}
        </p>
        <div className="flex shrink-0 gap-2">
          <Button onClick={onCancel} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : slide ? "Save changes" : "Add slide"}
          </Button>
        </div>
      </div>
    </form>
  );
}
