import { Suspense } from "react";
import { AdminTranslations } from "@/components/admin/admin-translations";

export default function Page() {
  return (
    <Suspense>
      <AdminTranslations />
    </Suspense>
  );
}
