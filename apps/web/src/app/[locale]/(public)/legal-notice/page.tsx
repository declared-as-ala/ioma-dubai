import { LegalDocument } from "@/components/legal/legal-document";
import { LEGAL_NOTICE } from "@/content/services";
import { currentLoc, pageMetadata } from "@/lib/page-meta";

// An unapproved draft: kept out of search results until counsel approves it.
export const generateMetadata = () =>
  pageMetadata("/legal-notice", LEGAL_NOTICE.seo, { noindex: true });

export default async function LegalNoticePage() {
  return <LegalDocument doc={LEGAL_NOTICE} loc={await currentLoc()} />;
}
