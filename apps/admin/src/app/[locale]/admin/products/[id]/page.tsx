import { AdminProductDetail } from "@/components/admin/admin-product-editor";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProductDetail id={id} />;
}
