import { PageLoader, SkeletonTable } from "@/components/ui/loading-screen";

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <PageLoader variant="admin" fullScreen={false} className="py-8" />
      <SkeletonTable rows={6} />
    </div>
  );
}
