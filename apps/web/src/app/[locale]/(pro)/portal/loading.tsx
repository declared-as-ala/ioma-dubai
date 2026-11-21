import { SkeletonBlock, SkeletonProductCard } from "@/components/pro/pro-ui";

// Shown instantly while a portal page loads: the title and a grid of cards, so nothing jumps afterwards.
export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        <SkeletonBlock className="h-9 w-48" />
        <SkeletonBlock className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 min-[600px]:grid-cols-2 2xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    </div>
  );
}
