import { IBM_Plex_Sans } from "next/font/google";
import { ProShell } from "@/components/pro/pro-shell";

// IBM Plex Sans is the Carbon typeface; it is only loaded for the professional portal.
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

// The pro space (espace pro): its own header, menu and contact box. Access level (visitor,
// validated, customer) is decided by the API and mirrored by ProShell. `pro-carbon` scopes the
// white-and-blue design tokens (see globals.css) to the portal only.
export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plex.variable} pro-carbon`}>
      <ProShell>{children}</ProShell>
    </div>
  );
}
