import { Suspense } from "react";
import { AdminProductManagement } from "@/components/admin/admin-product-management";
export default function Page() {
  return (
    <Suspense>
      <AdminProductManagement />
    </Suspense>
  );
}
