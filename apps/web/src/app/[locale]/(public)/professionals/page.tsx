import type { Metadata } from "next";
import ProLanding from "@/components/pro/pro-landing";

export const metadata: Metadata = {
  title: "Trade access for beauty professionals | IOMA Pro",
  description:
    "Register in one minute. IOMA calls you to validate your account, then you see the trade prices and order online.",
};

export default function ProfessionalsPage() {
  return <ProLanding />;
}
