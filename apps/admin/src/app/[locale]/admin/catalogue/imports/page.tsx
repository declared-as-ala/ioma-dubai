import { Suspense } from "react";
import { AdminImportCenter } from "@/components/admin/admin-import-center";

// Same screen as /admin/products/import (kept so existing links keep working).
export default function Page() {
  return (
    <Suspense>
      <AdminImportCenter />
    </Suspense>
  );
}
