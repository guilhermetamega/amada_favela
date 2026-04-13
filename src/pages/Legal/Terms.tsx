import Layout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import LegalDocument from "@/components/legal/LegalDocument";
import { TERMS_OF_USE_CONTENT } from "@/lib/legal";

export default function TermsOfUsePage() {
  return (
    <Layout>
      <MainLayout>
        <LegalDocument content={TERMS_OF_USE_CONTENT} />
      </MainLayout>
    </Layout>
  );
}
