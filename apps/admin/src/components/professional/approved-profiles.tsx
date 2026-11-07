"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useApprovedProfiles, useSuspendProfileMutation } from "@/hooks/use-professional";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function ApprovedProfiles() {
  const t = useTranslations("Admin.professionals");
  const query = useApprovedProfiles();
  const suspend = useSuspendProfileMutation();
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  return (
    <section className="mt-10">
      <h2 className="text-xl">{t("approvedProfiles")}</h2>
      {query.isPending && <p role="status">{t("dialog.processing")}</p>}
      {query.isError && <p role="alert">{t("loadError")}</p>}
      <div className="mt-4 space-y-3">
        {query.data?.map((profile) => (
          <div
            key={profile._id}
            data-testid={`approved-profile-${profile._id}`}
            className="flex flex-wrap items-center justify-between gap-4 border p-4"
          >
            <span>{profile.companyName}</span>
            <Button
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setSelected(profile._id);
                setReason("");
                suspend.reset();
              }}
            >
              {t("suspend")}
            </Button>
          </div>
        ))}
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !suspend.isPending) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("suspend")}</DialogTitle>
            <DialogDescription>{t("suspendDescription")}</DialogDescription>
          </DialogHeader>
          <Label htmlFor="suspension-reason">{t("dialog.notes")}</Label>
          <Textarea
            id="suspension-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {suspend.isError && <p role="alert">{t("toast.error")}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              disabled={suspend.isPending}
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || suspend.isPending}
              onClick={async () => {
                if (!selected) return;
                try {
                  await suspend.mutateAsync({ id: selected, reason });
                  setSelected(null);
                } catch {
                  /* Render localized error above. */
                }
              }}
            >
              {t("confirmSuspend")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
