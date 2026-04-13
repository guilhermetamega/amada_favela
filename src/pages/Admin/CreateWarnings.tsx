import { useEffect, useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import DashboardLayout from "@/components/layout/Layout";
import CreateWarningHero from "@/components/createWarning/Hero";
import CreateWarningFeedback from "@/components/createWarning/Feedback";
import WarningForm from "@/components/createWarning/WarningForm";
import BannerPreview from "@/components/createWarning/BannerPreview";
import EditWarningsModal from "@/components/createWarning/EditWarningsModal";
import {
  createWarningBanner,
  getEditableCurrentCommunityWarningBanners,
  updateWarningBanner,
} from "@/services/supabase/warning_banners";
import type { WarningBanner } from "@/types/warning_banners";
import MainLayout from "@/components/layout/MainLayout";

export default function CreateWarningsPage() {
  const [message, setMessage] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItems, setEditingItems] = useState<WarningBanner[]>([]);
  const [loadingEditingItems, setLoadingEditingItems] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState("");

  async function loadEditableBanners() {
    try {
      setLoadingEditingItems(true);
      setEditErrorMessage("");
      const data = await getEditableCurrentCommunityWarningBanners();
      setEditingItems(data);
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Erro ao carregar banners editáveis.";
      setEditErrorMessage(nextMessage);
    } finally {
      setLoadingEditingItems(false);
    }
  }

  useEffect(() => {
    if (!editModalOpen) return;
    void loadEditableBanners();
  }, [editModalOpen]);

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

  async function handleSaveEdit(
    bannerId: string,
    input: {
      message: string;
      text_color: string;
      expires_at: string;
    },
  ) {
    try {
      setSavingEdit(true);
      setEditErrorMessage("");

      const updated = await updateWarningBanner(bannerId, input);

      setEditingItems((prev) =>
        prev.map((item) => (item.id === bannerId ? updated : item)),
      );

      setSuccessMessage("Comunicado atualizado com sucesso.");
    } catch (error) {
      const nextMessage =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar comunicado.";
      setEditErrorMessage(nextMessage);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4">
          <CreateWarningHero />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <Pencil size={16} />
              Editar banners ativos
            </button>
          </div>

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
      </MainLayout>

      <EditWarningsModal
        open={editModalOpen}
        items={editingItems}
        loadingList={loadingEditingItems}
        saving={savingEdit}
        errorMessage={editErrorMessage}
        onClose={() => setEditModalOpen(false)}
        onRefresh={loadEditableBanners}
        onSave={handleSaveEdit}
      />
    </DashboardLayout>
  );
}
