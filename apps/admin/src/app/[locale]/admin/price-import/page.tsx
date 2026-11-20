import { Suspense } from "react";
import { AdminPriceImport } from "@/components/admin/admin-price-import";

export default function Page() {
  return (
    <Suspense>
      <AdminPriceImport />
    </Suspense>
  );
}
