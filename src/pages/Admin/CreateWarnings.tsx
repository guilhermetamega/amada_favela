import { useState, type FormEvent } from "react";
import DashboardLayout from "@/components/layout/Layout";
import CreateWarningHero from "@/components/createWarning/Hero";
import CreateWarningFeedback from "@/components/createWarning/Feedback";
import WarningForm from "@/components/createWarning/WarningForm";
import BannerPreview from "@/components/createWarning/BannerPreview";
import { createWarningBanner } from "@/services/supabase/warning_banners";

export default function CreateWarningsPage() {
  const [message, setMessage] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!message.trim()) {
      setErrorMessage("Digite o texto do comunicado.");
      return;
    }

    if (!expiresAt) {
      setErrorMessage("Selecione a data de expiração do banner.");
      return;
    }

    setLoading(true);

    try {
      await createWarningBanner({
        message: message.trim(),
        text_color: textColor,
        expires_at: new Date(expiresAt).toISOString(),
      });

      setMessage("");
      setTextColor("#ffffff");
      setExpiresAt("");
      setSuccessMessage("Comunicado publicado com sucesso.");
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "Erro ao publicar comunicado.";
      setErrorMessage(nextMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <main className="px-4 py-4 sm:px-5 sm:py-5 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <CreateWarningHero />

          <CreateWarningFeedback
            errorMessage={errorMessage}
            successMessage={successMessage}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <WarningForm
              message={message}
              textColor={textColor}
              expiresAt={expiresAt}
              loading={loading}
              onMessageChange={setMessage}
              onTextColorChange={setTextColor}
              onExpiresAtChange={setExpiresAt}
              onSubmit={handleSubmit}
            />

            <BannerPreview
              message={message}
              textColor={textColor}
              expiresAt={expiresAt}
            />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
