import { notFound, redirect } from "next/navigation";
import { AdminDetail } from "@/components/admin/admin-management";
export default async function Page({
  params,
}: {
  params: Promise<{ resource: string; id: string; locale: string }>;
}) {
  const { resource, id, locale } = await params;
  if (resource === "partners")
    redirect(`/${locale}/admin/professional-accounts/${encodeURIComponent(`b:${id}`)}`);
  if (
    [
      "trainings",
      "training-sessions",
      "training-bookings",
      "protocols",
      "documents",
      "certificates",
      "magazine",
      "content",
      "hero",
    ].includes(resource)
  )
    notFound();
  return <AdminDetail resourceKey={resource} id={id} />;
}
