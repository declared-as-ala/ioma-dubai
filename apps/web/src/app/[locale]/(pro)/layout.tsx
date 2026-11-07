import { ProShell } from "@/components/pro/pro-shell";

// The pro space (espace pro): its own header, menu and contact box. Access level (visitor,
// validated, customer) is decided by the API and mirrored by ProShell.
export default function ProLayout({ children }: { children: React.ReactNode }) {
  return <ProShell>{children}</ProShell>;
}
