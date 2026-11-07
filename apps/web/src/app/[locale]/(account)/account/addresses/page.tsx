"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { EMIRATES, type Locale } from "@ioma/config";
import type { Address } from "@ioma/types";
import { addressSchema, type AddressInput } from "@ioma/validation";
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useUpdateAddressMutation,
} from "@/hooks/use-account";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_ADDRESS: AddressInput = {
  type: "shipping",
  label: "",
  fullName: "",
  phone: "",
  line1: "",
  line2: undefined,
  emirate: "DXB",
  city: "",
  isDefault: false,
};

function toInput(address: Address): AddressInput {
  return {
    type: address.type,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? undefined,
    emirate: address.emirate,
    city: address.city,
    isDefault: address.isDefault,
  };
}

export default function AddressesPage() {
  const t = useTranslations("Account");
  const locale = useLocale() as Locale;
  const addresses = useAddressesQuery();
  const createAddress = useCreateAddressMutation();
  const updateAddress = useUpdateAddressMutation();
  const deleteAddress = useDeleteAddressMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Address | null>(null);
  const form = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY_ADDRESS,
  });
  const saving = createAddress.isPending || updateAddress.isPending;

  function startAdd() {
    setEditingId(null);
    form.reset(EMPTY_ADDRESS);
    createAddress.reset();
    updateAddress.reset();
    setFormOpen(true);
  }

  function startEdit(address: Address) {
    setEditingId(address._id);
    form.reset(toInput(address));
    createAddress.reset();
    updateAddress.reset();
    setFormOpen(true);
  }

  function submit(input: AddressInput) {
    const mutation = editingId ? updateAddress : createAddress;
    mutation.mutate(
      { id: editingId ?? undefined, input },
      { onSuccess: () => setFormOpen(false) },
    );
  }

  return (
    <section aria-labelledby="addresses-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="addresses-title" className="font-display text-3xl font-light md:text-4xl">
          {t("addresses.title")}
        </h1>
        {!formOpen && <Button onClick={startAdd}>{t("addresses.addNew")}</Button>}
      </div>

      {formOpen && (
        <form
          className="mt-8 border border-border p-5 sm:p-8"
          noValidate
          onSubmit={form.handleSubmit(submit)}
        >
          <h2 className="font-display text-xl">
            {editingId ? t("addresses.editTitle") : t("addresses.addNew")}
          </h2>
          <FieldGroup className="mt-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address-type">{t("addresses.type")}</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="address-type"
                        className="min-h-11 w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shipping">
                          {t("addresses.shipping")}
                        </SelectItem>
                        <SelectItem value="billing">{t("addresses.billing")}</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />
              <Controller
                name="label"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address-label">
                      {t("addresses.label")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="address-label"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Controller
                name="fullName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address-full-name">
                      {t("addresses.fullName")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="address-full-name"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address-phone">
                      {t("addresses.phone")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="address-phone"
                      type="tel"
                      dir="ltr"
                      autoComplete="tel"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="line1"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="address-line-1">
                    {t("addresses.addressLine1")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="address-line-1"
                    autoComplete="address-line1"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                </Field>
              )}
            />
            <Controller
              name="line2"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="address-line-2">
                    {t("addresses.addressLine2")}
                  </FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id="address-line-2"
                    autoComplete="address-line2"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                </Field>
              )}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <Controller
                name="emirate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address-emirate">
                      {t("addresses.emirate")}
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="address-emirate"
                        className="min-h-11 w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMIRATES.map((emirate) => (
                          <SelectItem key={emirate.code} value={emirate.code}>
                            {emirate.name[locale]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />
              <Controller
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="address-city">{t("addresses.city")}</FieldLabel>
                    <Input
                      {...field}
                      id="address-city"
                      autoComplete="address-level2"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="isDefault"
              control={form.control}
              render={({ field }) => (
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(value) => field.onChange(Boolean(value))}
                  />
                  {t("addresses.setDefault")}
                </label>
              )}
            />
            {(createAddress.isError || updateAddress.isError) && (
              <p role="alert" className="text-sm text-destructive">
                {t("saveError")}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? t("addresses.saving") : t("addresses.save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setFormOpen(false)}
              >
                {t("addresses.cancel")}
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}

      {addresses.isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-busy="true">
          <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />
          <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />
        </div>
      ) : addresses.isError ? (
        <div
          className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center"
          role="alert"
        >
          <p className="text-sm text-destructive">{t("loadError")}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 uppercase tracking-wider text-xs"
            onClick={() => addresses.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      ) : addresses.data?.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-muted/10 p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <MapPin className="size-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-light text-foreground">
            {t("addresses.empty")}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
            Enregistrez vos adresses de livraison aux Émirats pour vos commandes privées
            et livraisons express IOMA Paris.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-6 rounded-full uppercase tracking-wider text-xs gap-2"
            onClick={startAdd}
          >
            <Plus className="size-3.5" />
            <span>{t("addresses.addNew")}</span>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {addresses.data?.map((address) => (
            <article
              key={address._id}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all duration-200 hover:border-foreground/40 hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <h2 className="font-display text-base font-medium text-foreground">
                      {address.label}
                    </h2>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {t(`addresses.${address.type}`)}
                    </p>
                  </div>
                  {address.isDefault && (
                    <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-background shadow-xs">
                      {t("addresses.defaultBadge")}
                    </span>
                  )}
                </div>

                <address className="mt-4 text-xs not-italic leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground block text-sm mb-1">
                    {address.fullName}
                  </span>
                  <span>{address.line1}</span>
                  {address.line2 && <span className="block">{address.line2}</span>}
                  <span className="block mt-1 font-medium text-foreground/80">
                    {address.city},{" "}
                    {EMIRATES.find((item) => item.code === address.emirate)?.name[locale]}
                  </span>
                  <span
                    className="block mt-1 text-[11px] text-muted-foreground/80"
                    dir="ltr"
                  >
                    {address.phone}
                  </span>
                </address>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs uppercase tracking-wider"
                  onClick={() => startEdit(address)}
                >
                  {t("addresses.edit")}
                </Button>
                {!address.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs uppercase tracking-wider"
                    disabled={updateAddress.isPending}
                    onClick={() =>
                      updateAddress.mutate({
                        id: address._id,
                        input: { ...toInput(address), isDefault: true },
                      })
                    }
                  >
                    {t("addresses.setDefault")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive ms-auto"
                  onClick={() => setDeleteTarget(address)}
                >
                  {t("addresses.remove")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addresses.removeTitle")}</DialogTitle>
            <DialogDescription>
              {t("addresses.removeWarning", { label: deleteTarget?.label ?? "" })}
            </DialogDescription>
          </DialogHeader>
          {deleteAddress.isError && (
            <p role="alert" className="text-sm text-destructive">
              {t("deleteError")}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("addresses.cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleteAddress.isPending}
              onClick={() =>
                deleteTarget &&
                deleteAddress.mutate(deleteTarget._id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }
            >
              {deleteAddress.isPending
                ? t("addresses.removing")
                : t("addresses.removeConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
