import { Suspense } from "react";
import { AdminCustomers } from "@/components/admin/admin-customers";

export default function Page() {
  return (
    <Suspense>
      <AdminCustomers />
    </Suspense>
  );
}
