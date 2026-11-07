import { Suspense } from "react";
import { AdminProductOrganization } from "@/components/admin/admin-product-organization";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-neutral-500">
          Loading Product Organization Hub...
        </div>
      }
    >
      <AdminProductOrganization />
    </Suspense>
  );
}
