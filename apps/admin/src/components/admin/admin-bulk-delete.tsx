"use client";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function useOrderSelection(query: string) {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => setSelected([]), [query]);
  return { selected, setSelected };
}
export function SelectionCheckbox({
  checked,
  mixed = false,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  mixed?: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-11 min-w-11 items-center justify-center">
      <input
        type="checkbox"
        className="size-4 accent-blue-600"
        checked={checked}
        disabled={disabled}
        ref={(node) => {
          if (node) node.indeterminate = mixed;
        }}
        aria-label={label}
        onChange={onChange}
      />
    </label>
  );
}
export function OrderBulkDelete({
  selected,
  clear,
}: {
  selected: string[];
  clear: () => void;
}) {
  const t = useTranslations("OrderAdmin"),
    a = useTranslations("AdminExperience");
  const [open, setOpen] = useState(false);
  const cache = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ deletedCount: number }>("/admin/orders/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selected }),
      }),
    onSuccess: async () => {
      setOpen(false);
      clear();
      await cache.invalidateQueries();
    },
  });
  return (
    <>
      {mutation.isSuccess && (
        <p role="status" className="bg-green-50 p-3 text-sm">
          {t("deletedCount", { count: mutation.data.deletedCount })}
        </p>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-blue-50 p-3">
          <span className="flex-1 text-sm" aria-live="polite">
            {t("selectedCount", { count: selected.length })}
          </span>
          <button className="min-h-11 border bg-white px-4 text-sm" onClick={clear}>
            {t("clearSelection")}
          </button>
          <button
            className="min-h-11 bg-red-700 px-4 text-sm text-white"
            onClick={() => {
              mutation.reset();
              setOpen(true);
            }}
          >
            {t("deleteSelected")}
          </button>
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!mutation.isPending) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogTitle>{t("deleteTitle", { count: selected.length })}</DialogTitle>
          <DialogDescription>{t("deleteDescription")}</DialogDescription>
          {mutation.isError && (
            <p role="alert" className="text-sm text-red-700">
              {mutation.error.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              className="min-h-11 border px-4"
              disabled={mutation.isPending}
              onClick={() => setOpen(false)}
            >
              {a("cancel")}
            </button>
            <button
              className="min-h-11 bg-red-700 px-4 text-white disabled:opacity-50"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {t(mutation.isPending ? "deleting" : "deleteSelected")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
