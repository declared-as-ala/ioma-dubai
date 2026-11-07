"use client";

import { ApprovedProfiles } from "@/components/professional/approved-profiles";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  usePendingApplications,
  useApproveApplicationMutation,
  useRejectApplicationMutation,
  useRequestDocumentsMutation,
  useApplicationDocumentMutation,
} from "@/hooks/use-professional";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle, XCircle, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminProfessionalsPage() {
  const t = useTranslations("Admin.professionals");
  const ta = useTranslations("Professionals.apply");
  const locale = useLocale();
  const { data: applications, isLoading, isError, refetch } = usePendingApplications();
  const approve = useApproveApplicationMutation();
  const reject = useRejectApplicationMutation();
  const requestDocuments = useRequestDocumentsMutation();
  const viewDocument = useApplicationDocumentMutation();
  const [actionError, setActionError] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | "request" | null>(null);

  const handleAction = async () => {
    if (!selectedApp || !action) return;
    setActionError(false);
    try {
      if (action === "approve") {
        await approve.mutateAsync({
          id: selectedApp,
          reviewNotes: reviewNotes || undefined,
        });
        toast.success(t("toast.approved"));
      } else {
        if (!reviewNotes.trim()) {
          toast.error(t("toast.rejectionReasonRequired"));
          return;
        }
        if (action === "request") {
          await requestDocuments.mutateAsync({ id: selectedApp, reviewNotes });
          toast.success(t("toast.requested"));
        } else {
          await reject.mutateAsync({ id: selectedApp, reviewNotes });
          toast.success(t("toast.rejected"));
        }
      }
      setSelectedApp(null);
      setReviewNotes("");
      setAction(null);
    } catch {
      setActionError(true);
      toast.error(t("toast.error"));
    }
  };

  return (
    <div>
      <h1 className="font-heading text-3xl font-light tracking-tight text-ioma-black md:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-ioma-grey-500">{t("subtitle")}</p>

      {isError && (
        <div role="alert" className="mt-6">
          <p>{t("loadError")}</p>
          <Button onClick={() => refetch()}>{ta("retry")}</Button>
        </div>
      )}
      {viewDocument.isError && <p role="alert">{t("toast.error")}</p>}
      {documentUrl && (
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="my-4 inline-flex min-h-11 items-center underline"
        >
          {t("actions.viewDocument")}
        </a>
      )}
      {isLoading ? (
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-ioma-grey-100" />
          ))}
        </div>
      ) : applications && applications.length > 0 ? (
        <div className="mt-8 space-y-4">
          {applications.map((app) => {
            return (
              <Card key={app._id} data-testid={`admin-application-${app._id}`}>
                <CardHeader className="flex flex-wrap items-center justify-between gap-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-ioma-grey-50 p-2">
                      <Building2 className="h-5 w-5 text-ioma-grey-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-light">
                        {app.companyName}
                      </CardTitle>
                      <p className="text-sm text-ioma-grey-500">
                        {app.contactPerson} &middot; {app.email}
                      </p>
                    </div>
                  </div>
                  <Badge>{ta(`statuses.${app.status}`)}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3 text-sm">
                    <div>
                      <span className="text-ioma-grey-400">
                        {t("field.businessType")}
                      </span>
                      <p className="mt-1 capitalize text-ioma-black">
                        {ta(`businessTypes.${app.businessType}`)}
                      </p>
                    </div>
                    <div>
                      <span className="text-ioma-grey-400">{t("field.emirate")}</span>
                      <p className="mt-1 text-ioma-black">
                        {ta(`emirates.${app.emirate}`)}
                      </p>
                    </div>
                    <div>
                      <span className="text-ioma-grey-400">
                        {t("field.tradeLicence")}
                      </span>
                      <p className="mt-1 text-ioma-black">{app.tradeLicenceNumber}</p>
                    </div>
                    <div>
                      <span className="text-ioma-grey-400">
                        {t("field.locationsCount")}
                      </span>
                      <p className="mt-1 text-ioma-black">{app.locationsCount}</p>
                    </div>
                    <div>
                      <span className="text-ioma-grey-400">
                        {t("field.expectedVolume")}
                      </span>
                      <p className="mt-1 text-ioma-black">{app.expectedOrderVolume}</p>
                    </div>
                    <div>
                      <span className="text-ioma-grey-400">{t("field.submitted")}</span>
                      <p className="mt-1 text-ioma-black">
                        {new Date(app.submittedAt ?? app.createdAt).toLocaleDateString(
                          locale,
                        )}
                      </p>
                    </div>
                  </div>
                  {app.documents.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm text-ioma-grey-400">
                        {t("field.documents")}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {app.documents.map((doc) => (
                          <Button
                            key={doc.documentId}
                            variant="outline"
                            className="min-h-11 max-w-full whitespace-normal break-all"
                            disabled={viewDocument.isPending}
                            onClick={async () => {
                              setDocumentUrl(null);
                              try {
                                const result = await viewDocument.mutateAsync({
                                  id: app._id,
                                  documentId: doc.documentId,
                                });
                                setDocumentUrl(result.url);
                              } catch {
                                /* Localized mutation error above. */
                              }
                            }}
                          >
                            {doc.originalName}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={app.status === "documents_requested"}
                      onClick={() => {
                        setSelectedApp(app._id);
                        setAction("request");
                        setReviewNotes("");
                        setActionError(false);
                      }}
                    >
                      {t("actions.requestDocuments")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedApp(app._id);
                        setAction("approve");
                        setReviewNotes("");
                      }}
                    >
                      <CheckCircle className="me-2 h-3 w-3" />
                      {t("actions.approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedApp(app._id);
                        setAction("reject");
                        setReviewNotes("");
                      }}
                    >
                      <XCircle className="me-2 h-3 w-3" />
                      {t("actions.reject")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : !isError ? (
        <div className="mt-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-ioma-grey-300" />
          <p className="mt-4 text-ioma-grey-500">{t("noApplications")}</p>
        </div>
      ) : null}

      <ApprovedProfiles />
      {/* Review dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve"
                ? t("dialog.approveTitle")
                : action === "request"
                  ? t("dialog.requestTitle")
                  : t("dialog.rejectTitle")}
            </DialogTitle>
            <DialogDescription>{t("subtitle")}</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reviewNotes">{t("dialog.notes")}</Label>
            <Textarea
              id="reviewNotes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="mt-1"
              rows={3}
              placeholder={
                action === "approve"
                  ? t("dialog.approvePlaceholder")
                  : t("dialog.rejectPlaceholder")
              }
            />
          </div>
          {actionError && (
            <p role="alert" className="text-destructive">
              {t("toast.error")}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApp(null)}>
              {t("dialog.cancel")}
            </Button>
            <Button
              variant={action === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={
                approve.isPending ||
                reject.isPending ||
                requestDocuments.isPending ||
                (action !== "approve" && !reviewNotes.trim())
              }
            >
              {approve.isPending || reject.isPending || requestDocuments.isPending
                ? t("dialog.processing")
                : action === "approve"
                  ? t("dialog.confirmApprove")
                  : action === "request"
                    ? t("dialog.confirmRequest")
                    : t("dialog.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
