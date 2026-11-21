import { Suspense } from "react";
import { AdminReviews } from "@/components/admin/admin-reviews";

export default function Page() {
  return (
    <Suspense>
      <AdminReviews />
    </Suspense>
  );
}
