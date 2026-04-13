import Layout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import LegalDocument from "@/components/legal/LegalDocument";
import { PRIVACY_POLICY_CONTENT } from "@/lib/legal";

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <MainLayout>
        <LegalDocument content={PRIVACY_POLICY_CONTENT} />
      </MainLayout>
    </Layout>
  );
}
