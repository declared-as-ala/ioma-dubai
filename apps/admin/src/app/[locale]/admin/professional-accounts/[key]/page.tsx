import { Suspense } from "react";
import { AdminProfessionalDetail } from "@/components/admin/admin-professional-detail";

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return (
    <Suspense>
      <AdminProfessionalDetail keyParam={key} />
    </Suspense>
  );
}
