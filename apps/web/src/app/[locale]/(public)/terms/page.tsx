import { LegalDocument } from "@/components/legal/legal-document";
import { TERMS } from "@/content/services";
import { currentLoc, pageMetadata } from "@/lib/page-meta";

// An unapproved draft: kept out of search results until counsel approves it.
export const generateMetadata = () =>
  pageMetadata("/terms", TERMS.seo, { noindex: true });

export default async function TermsPage() {
  return <LegalDocument doc={TERMS} loc={await currentLoc()} />;
}
