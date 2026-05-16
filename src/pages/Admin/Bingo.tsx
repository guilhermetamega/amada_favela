import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import BingoAdminCreateForm from "@/components/bingo/AdminCreateForm";
import BingoAdminDrawPanel from "@/components/bingo/AdminDrawPanel";
import BingoFeedback from "@/components/bingo/Feedback";
import BingoHero from "@/components/bingo/Hero";
import BingoPageSkeleton from "@/components/bingo/PageSkeleton";
import {
  createBingo,
  drawBingoNumber,
  finalizeBingo,
  getManageableBingos,
} from "@/services/supabase/bingo";
import type { BingoGame } from "@/types/bingo";

function toLocalDateTime(value: Date) {
  const pad = (number: number) => String(number).padStart(2, "0");

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export default function AdminBingoPage() {
  const [bingos, setBingos] = useState<BingoGame[]>([]);
  const [selectedBingoId, setSelectedBingoId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    return toLocalDateTime(nextHour);
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [rollingNumber, setRollingNumber] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedBingo = useMemo(
    () => bingos.find((bingo) => bingo.id === selectedBingoId) ?? bingos[0] ?? null,
    [bingos, selectedBingoId],
  );

  async function loadBingos() {
    try {
      setLoading(true);
      setErrorMessage("");
      const data = await getManageableBingos();
      setBingos(data);
      setSelectedBingoId((current) => current ?? data[0]?.id ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar bingos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBingos();
  }, []);

  async function handleCreate() {
    try {
      setCreating(true);
      setErrorMessage("");
      setSuccessMessage("");
      const bingoId = await createBingo({
        title,
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      const data = await getManageableBingos();
      setBingos(data);
      setSelectedBingoId(bingoId);
      setTitle("");
      setSuccessMessage("Bingo criado com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao criar bingo.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleFinalize() {
    if (!selectedBingo) return;

    const confirmed = window.confirm(
      `Deseja finalizar o bingo "${selectedBingo.title}"? Após finalizar, novos sorteios serão bloqueados e ele sairá da tela pública.`,
    );

    if (!confirmed) return;

    try {
      setFinalizing(true);
      setErrorMessage("");
      setSuccessMessage("");
      const updated = await finalizeBingo(selectedBingo.id);
      setBingos((current) =>
        current.map((bingo) => (bingo.id === updated.id ? updated : bingo)),
      );
      setSuccessMessage("Bingo finalizado com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao finalizar bingo.",
      );
    } finally {
      setFinalizing(false);
    }
  }

  async function handleDraw() {
    if (!selectedBingo) return;

    try {
      setDrawing(true);
      setErrorMessage("");
      setSuccessMessage("");

      let ticks = 0;
      const interval = window.setInterval(() => {
        ticks += 1;
        setRollingNumber(Math.floor(Math.random() * 75) + 1);
        if (ticks >= 16) window.clearInterval(interval);
      }, 70);

      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      const updated = await drawBingoNumber(selectedBingo.id);
      setBingos((current) =>
        current.map((bingo) => (bingo.id === updated.id ? updated : bingo)),
      );
      setRollingNumber(updated.current_number);
      setSuccessMessage(`Número ${updated.current_number} sorteado.`);
      window.setTimeout(() => setRollingNumber(null), 450);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao sortear número.",
      );
      setRollingNumber(null);
    } finally {
      setDrawing(false);
    }
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4">
          <BingoHero title="Gerenciar Bingo" />
          <BingoAdminCreateForm
            title={title}
            scheduledAt={scheduledAt}
            loading={creating}
            onTitleChange={setTitle}
            onScheduledAtChange={setScheduledAt}
            onSubmit={handleCreate}
          />
          <BingoFeedback
            errorMessage={errorMessage}
            successMessage={successMessage}
          />

          {loading ? (
            <BingoPageSkeleton />
          ) : (
            <>
              {bingos.length > 1 ? (
                <select
                  value={selectedBingo?.id ?? ""}
                  onChange={(event) => setSelectedBingoId(event.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {bingos.map((bingo) => (
                    <option key={bingo.id} value={bingo.id}>
                      {bingo.title}
                    </option>
                  ))}
                </select>
              ) : null}

              <BingoAdminDrawPanel
                bingo={selectedBingo}
                rollingNumber={rollingNumber}
                drawing={drawing}
                finalizing={finalizing}
                onDraw={handleDraw}
                onFinalize={handleFinalize}
              />
            </>
          )}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
