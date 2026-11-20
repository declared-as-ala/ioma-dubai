import { Suspense } from "react";
import { AdminPortalContent } from "@/components/admin/admin-portal-content";

export default function Page() {
  return (
    <Suspense>
      <AdminPortalContent />
    </Suspense>
  );
}
