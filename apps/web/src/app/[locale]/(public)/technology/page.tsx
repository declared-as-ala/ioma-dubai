import { getLocale } from "next-intl/server";
import { TechnologyExperience } from "@/components/technology/cinematic/technology-experience";

// SEO is unchanged from the previous version of this page.
export const metadata = {
  title: "Our technology | IOMA Paris Dubai",
  description:
    "i-Diag, IOMA Sphere 2 and IOMA In.Lab: three devices that read your skin and one that creates your formula.",
};

// Runs before first paint on a hard load: flags the page so the opening (hidden) states apply without a
// flash. Visitors without JavaScript never get the flag and see everything. If the page script has not
// started after a few seconds, the flag is removed so the static layout takes over.
const FLAG = `document.documentElement.classList.add('tx-js');setTimeout(function(){if(!window.__txReady)document.documentElement.classList.remove('tx-js')},4500)`;

export default async function TechnologyPage() {
  const loc = (await getLocale()) === "ar" ? "ar" : "en";
  return (
    <main>
      <script dangerouslySetInnerHTML={{ __html: FLAG }} />
      <TechnologyExperience loc={loc} />
    </main>
  );
}
