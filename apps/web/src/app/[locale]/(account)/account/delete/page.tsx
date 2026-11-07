"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { deletionRequestSchema, type DeletionRequestInput } from "@ioma/validation";
import { useDeletionRequestMutation } from "@/hooks/use-account";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

export default function DeleteAccountPage() {
  const t = useTranslations("Account");
  const requestDeletion = useDeletionRequestMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingInput, setPendingInput] = useState<DeletionRequestInput | null>(null);
  const form = useForm<DeletionRequestInput>({
    resolver: zodResolver(deletionRequestSchema),
    defaultValues: { reason: "" },
  });

  function prepareConfirmation(input: DeletionRequestInput) {
    setPendingInput(input);
    setConfirmOpen(true);
  }

  return (
    <section aria-labelledby="delete-title" className="max-w-2xl">
      <h1
        id="delete-title"
        className="font-display text-3xl font-light md:text-4xl text-destructive"
      >
        {t("deletion.title")}
      </h1>
      <div className="mt-8 border-s-2 border-destructive ps-5">
        <p className="leading-7 text-muted-foreground">{t("deletion.warning")}</p>
      </div>

      {requestDeletion.isSuccess ? (
        <p role="status" className="mt-8 border border-border p-5 text-sm leading-6">
          {t("deletion.requested")}
        </p>
      ) : (
        <form
          className="mt-10"
          noValidate
          onSubmit={form.handleSubmit(prepareConfirmation)}
        >
          <FieldGroup>
            <Controller
              name="reason"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="deletion-reason">
                    {t("deletion.reasonLabel")}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="deletion-reason"
                    rows={5}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError>{t("invalidField")}</FieldError>}
                </Field>
              )}
            />
            {requestDeletion.isError && (
              <p role="alert" className="text-sm text-destructive">
                {t("saveError")}
              </p>
            )}
            <Button type="submit" variant="destructive" size="lg" className="w-fit">
              {t("deletion.confirm")}
            </Button>
          </FieldGroup>
        </form>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deletion.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("deletion.confirmWarning")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("deletion.cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={requestDeletion.isPending}
              onClick={() =>
                pendingInput &&
                requestDeletion.mutate(pendingInput, {
                  onSuccess: () => setConfirmOpen(false),
                })
              }
            >
              {requestDeletion.isPending
                ? t("deletion.submitting")
                : t("deletion.confirmFinal")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
