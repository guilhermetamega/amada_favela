import Layout from "@/components/layout/Layout";
import LegalDocument from "@/components/legal/LegalDocument";
import { PRIVACY_POLICY_CONTENT } from "@/lib/legal";

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <LegalDocument content={PRIVACY_POLICY_CONTENT} />
      </main>
    </Layout>
  );
}
