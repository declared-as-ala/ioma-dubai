import { Suspense } from "react";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export default function NavigationPage() {
  return (
    <Suspense>
      <AdminNavigation />
    </Suspense>
  );
}
