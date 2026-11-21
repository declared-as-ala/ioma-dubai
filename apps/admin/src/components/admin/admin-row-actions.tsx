"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import type { AdminResource } from "@ioma/config";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AdminForm } from "./admin-form";

type Row = Record<string, any>;

/** The record's display name, whichever way the resource stores it. */
export function rowTitle(row: Row): string {
  const pick = (v: unknown): string =>
    typeof v === "string"
      ? v
      : v && typeof v === "object"
        ? String((v as Row).en || (v as Row).fr || (v as Row).ar || "")
        : "";
  return pick(row.title) || pick(row.name) || String(row._id);
}

const optionsOf = (resource: AdminResource, key: string): string[] =>
  ((resource.fields.find((f) => f.key === key) as { options?: string[] } | undefined)
    ?.options ?? []) as string[];

/**
 * Per-row management menu for the generic management lists (videos, gallery, benefits, documents,
 * services...). Only actions that make sense for the record are offered. Nothing is hard-deleted:
 * archiving takes the record off the professional portal and keeps it (and its history) in the database.
 */
export function RowActions({
  resource,
  resourceKey,
  row,
  manage,
}: {
  resource: AdminResource;
  resourceKey: string;
  row: Row;
  manage: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"archive" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const box = useRef<HTMLSpanElement>(null);
  const id = String(row._id);
  const name = rowTitle(row);
  const statuses = optionsOf(resource, "status");
  const status = String(row.status ?? "");

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const setStatus = useMutation({
    mutationFn: (value: string) =>
      apiFetch(`/admin/resources/${resourceKey}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      }),
    onSuccess: async (_d, value) => {
      await qc.invalidateQueries({ queryKey: ["admin"] });
      setConfirm(null);
      setMessage({ ok: true, text: `“${name}” is now ${value}.` });
    },
    onError: () => {
      setConfirm(null);
      setMessage({ ok: false, text: "Could not update. Nothing was changed." });
    },
  });

  const items: { key: string; label: string; icon: React.ReactNode; run: () => void }[] =
    [];
  if (manage && resource.fields.length)
    items.push({
      key: "edit",
      label: "Edit",
      icon: <Pencil className="size-4" aria-hidden />,
      run: () => setEditing(true),
    });
  if (manage && statuses.includes("published")) {
    if (status === "published")
      items.push({
        key: "unpublish",
        label: "Unpublish",
        icon: <EyeOff className="size-4" aria-hidden />,
        run: () => setStatus.mutate("draft"),
      });
    else if (status !== "archived")
      items.push({
        key: "publish",
        label: "Publish",
        icon: <Eye className="size-4" aria-hidden />,
        run: () => setStatus.mutate("published"),
      });
  }
  if (manage && statuses.includes("active") && statuses.includes("inactive")) {
    items.push({
      key: "toggle",
      label: status === "active" ? "Deactivate" : "Activate",
      icon:
        status === "active" ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        ),
      run: () => setStatus.mutate(status === "active" ? "inactive" : "active"),
    });
  }
  if (manage && statuses.includes("archived")) {
    if (status === "archived")
      items.push({
        key: "restore",
        label: "Restore",
        icon: <RotateCcw className="size-4" aria-hidden />,
        run: () => setStatus.mutate(statuses.includes("draft") ? "draft" : "active"),
      });
    else
      items.push({
        key: "archive",
        label: "Archive",
        icon: <Archive className="size-4" aria-hidden />,
        run: () => setConfirm("archive"),
      });
  }

  return (
    <span ref={box} className="relative inline-flex items-center gap-1">
      <Link
        href={`/admin/${resourceKey}/${id}`}
        className="pl-btn pl-btn--plain pl-btn--link pl-btn--sm"
      >
        View
      </Link>
      {items.length > 0 && (
        <>
          <button
            type="button"
            className="pl-btn pl-btn--plain pl-btn--sm"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Actions for ${name}`}
            onClick={() => setOpen((o) => !o)}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
          {open && (
            <ul
              role="menu"
              className="absolute end-0 top-full z-30 mt-1 min-w-44 rounded-lg border bg-white py-1 text-start shadow-lg"
              style={{ borderColor: "var(--pl-border-subtle, #e0e0e0)" }}
            >
              {items.map((item) => (
                <li key={item.key} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-100"
                    disabled={setStatus.isPending}
                    onClick={() => {
                      setOpen(false);
                      item.run();
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
              <li role="none">
                <Link
                  role="menuitem"
                  href={`/admin/${resourceKey}/${id}`}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-neutral-100"
                >
                  <ExternalLink className="size-4" aria-hidden /> View details &amp;
                  history
                </Link>
              </li>
            </ul>
          )}
        </>
      )}
      {message && (
        <span role="status" className="sr-only">
          {message.text}
        </span>
      )}

      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader>
            <SheetTitle>Edit · {name}</SheetTitle>
            <SheetDescription>
              Changes are saved to the database and appear on the portal straight away if
              the record is published.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {editing && (
              <AdminForm
                resource={resource}
                record={row}
                onSaved={async () => {
                  await qc.invalidateQueries({ queryKey: ["admin"] });
                  setEditing(false);
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirm === "archive"} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogTitle>Archive “{name}”?</DialogTitle>
          <DialogDescription>
            It will disappear from the professional portal straight away. It is not
            deleted: you can restore it at any time from the Archived tab.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="pl-btn" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="pl-btn pl-btn--primary"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("archived")}
            >
              Archive
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </span>
  );
}
