import { Suspense } from "react";
import { AdminProfessionals } from "@/components/admin/admin-professionals";

export default function Page() {
  return (
    <Suspense>
      <AdminProfessionals />
    </Suspense>
  );
}
