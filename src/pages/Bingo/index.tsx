import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import MainLayout from "@/components/layout/MainLayout";
import BingoFeedback from "@/components/bingo/Feedback";
import BingoHero from "@/components/bingo/Hero";
import BingoPageSkeleton from "@/components/bingo/PageSkeleton";
import UserBingoPanel from "@/components/bingo/UserBingoPanel";
import { usePermissions } from "@/contexts/profile-context";
import {
  getOrCreateBingoCard,
  getVisibleBingos,
  rerollBingoCard,
  updateBingoCardMarks,
} from "@/services/supabase/bingo";
import type { BingoCard, BingoGame } from "@/types/bingo";

export default function BingoPage() {
  const { permissions, loading: permissionsLoading } = usePermissions();
  const [bingos, setBingos] = useState<BingoGame[]>([]);
  const [cards, setCards] = useState<BingoCard[]>([]);
  const [associationLogoUrl, setAssociationLogoUrl] = useState<string | null>(
    null,
  );
  const [selectedBingoId, setSelectedBingoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cardLoading, setCardLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedBingo = useMemo(
    () => bingos.find((bingo) => bingo.id === selectedBingoId) ?? bingos[0] ?? null,
    [bingos, selectedBingoId],
  );

  const selectedCard = useMemo(
    () => cards.find((card) => card.bingo_id === selectedBingo?.id) ?? null,
    [cards, selectedBingo?.id],
  );

  async function loadBingos() {
    try {
      setLoading(true);
      setErrorMessage("");
      const data = await getVisibleBingos();
      setBingos(data.bingos);
      setCards(data.cards);
      setAssociationLogoUrl(data.associationLogoUrl);
      setSelectedBingoId((current) => current ?? data.bingos[0]?.id ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao carregar bingo.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (permissionsLoading) return;
    void loadBingos();
  }, [permissionsLoading]);

  function upsertCard(card: BingoCard) {
    setCards((current) => {
      const exists = current.some((item) => item.id === card.id);
      if (exists) return current.map((item) => (item.id === card.id ? card : item));
      return [card, ...current];
    });
  }

  async function handleCreateCard() {
    if (!selectedBingo) return;

    try {
      setCardLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      const card = await getOrCreateBingoCard(selectedBingo.id);
      upsertCard(card);
      setSuccessMessage("Cartela gerada com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao gerar cartela.",
      );
    } finally {
      setCardLoading(false);
    }
  }

  async function handleReroll() {
    if (!selectedBingo) return;

    try {
      setCardLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      const card = await rerollBingoCard(selectedBingo.id);
      upsertCard(card);
      setSuccessMessage("Cartela roletada com sucesso. Essa ação só pode ser feita 1 vez por bingo.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao roletar cartela.",
      );
    } finally {
      setCardLoading(false);
    }
  }

  async function handleToggleNumber(number: number) {
    if (!selectedCard || !permissions?.canAccessPremium) return;

    const currentMarks = new Set(selectedCard.marked_numbers);
    if (currentMarks.has(number)) {
      currentMarks.delete(number);
    } else {
      currentMarks.add(number);
    }

    const optimisticCard = {
      ...selectedCard,
      marked_numbers: Array.from(currentMarks),
    };
    upsertCard(optimisticCard);

    try {
      const card = await updateBingoCardMarks(
        selectedCard.id,
        optimisticCard.marked_numbers,
      );
      upsertCard(card);
    } catch (error) {
      upsertCard(selectedCard);
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao marcar número.",
      );
    }
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl space-y-4">
          <BingoHero />
          <BingoFeedback
            errorMessage={errorMessage}
            successMessage={successMessage}
          />

          {loading || permissionsLoading ? (
            <BingoPageSkeleton />
          ) : bingos.length === 0 ? (
            <div className="rounded-[28px] border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Nenhum bingo disponível no momento.
            </div>
          ) : selectedBingo ? (
            <>
              {bingos.length > 1 ? (
                <select
                  value={selectedBingo.id}
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

              <UserBingoPanel
                bingo={selectedBingo}
                card={selectedCard}
                associationLogoUrl={associationLogoUrl}
                canAccessPremium={!!permissions?.canAccessPremium}
                loadingCard={cardLoading}
                onCreateCard={handleCreateCard}
                onReroll={handleReroll}
                onToggleNumber={handleToggleNumber}
              />
            </>
          ) : null}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
