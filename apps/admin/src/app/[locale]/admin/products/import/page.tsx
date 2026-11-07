import { Suspense } from "react";
import { AdminImportCenter } from "@/components/admin/admin-import-center";

export default function Page() {
  return (
    <Suspense>
      <AdminImportCenter />
    </Suspense>
  );
}
