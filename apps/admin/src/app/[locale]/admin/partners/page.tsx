import { Suspense } from "react";
import { AdminResourcePage } from "@/components/admin/admin-management";
export default function Page() {
  return (
    <Suspense>
      <AdminResourcePage resourceKey="partners" />
    </Suspense>
  );
}
