import { AdminDetail } from "@/components/admin/admin-management";
export default async function Page({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  return <AdminDetail resourceKey={resource} id={id} />;
}
