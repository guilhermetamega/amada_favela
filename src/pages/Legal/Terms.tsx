import Layout from "@/components/layout/Layout";
import LegalDocument from "@/components/legal/LegalDocument";
import { TERMS_OF_USE_CONTENT } from "@/lib/legal";

export default function TermsOfUsePage() {
  return (
    <Layout>
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <LegalDocument content={TERMS_OF_USE_CONTENT} />
      </main>
    </Layout>
  );
}
