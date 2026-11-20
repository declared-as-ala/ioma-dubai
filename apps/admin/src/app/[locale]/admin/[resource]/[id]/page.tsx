import { notFound } from "next/navigation";
import { AdminDetail } from "@/components/admin/admin-management";
export default async function Page({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
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
