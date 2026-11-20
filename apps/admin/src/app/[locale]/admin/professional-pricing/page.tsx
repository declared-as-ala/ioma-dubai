import { Suspense } from "react";
import { AdminProPricing } from "@/components/admin/admin-pro-pricing";

export default function Page() {
  return (
    <Suspense>
      <AdminProPricing />
    </Suspense>
  );
}
