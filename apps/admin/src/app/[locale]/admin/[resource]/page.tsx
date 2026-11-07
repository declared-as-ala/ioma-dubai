import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { AdminResourcePage } from "@/components/admin/admin-management";
import { AdminSystem } from "@/components/admin/admin-system";
import { AdminCustomers } from "@/components/admin/admin-customers";
import { AdminOrders } from "@/components/admin/admin-orders";
import { AdminCategories } from "@/components/admin/admin-categories";
import { AdminSkinConcerns } from "@/components/admin/admin-skin-concerns";
import { AdminProductRanges } from "@/components/admin/admin-product-ranges";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { resource, locale } = await params;

  if (resource === "categories") {
    return (
      <Suspense>
        <AdminCategories />
      </Suspense>
    );
  }

  if (resource === "concerns" || resource === "skin-concerns") {
    return (
      <Suspense>
        <AdminSkinConcerns />
      </Suspense>
    );
  }

  if (resource === "ranges" || resource === "product-ranges") {
    return (
      <Suspense>
        <AdminProductRanges />
      </Suspense>
    );
  }

  if (resource === "navigation") {
    return (
      <Suspense>
        <AdminNavigation />
      </Suspense>
    );
  }

  if (resource === "customers") {
    return (
      <Suspense>
        <AdminCustomers />
      </Suspense>
    );
  }

  if (resource === "orders") {
    return (
      <Suspense>
        <AdminOrders />
      </Suspense>
    );
  }

  // The skin diagnosis feature was removed from the platform.
  if (["diagnoses", "ai-analyses", "routines", "saved-routines"].includes(resource))
    notFound();

  // Inventory is edited per product (Variants / Inventory cards), not as a separate page.
  if (["inventory", "stock-movements"].includes(resource)) notFound();

  if (resource === "roles" || resource === "settings")
    return <AdminSystem section={resource} />;

  if (resource === "notifications") notFound();

  return (
    <Suspense>
      <AdminResourcePage resourceKey={resource} />
    </Suspense>
  );
}
