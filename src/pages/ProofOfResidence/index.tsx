import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/Layout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import type { ProofEligibility } from "@/types/proof_of_residence";
import {
  createResidenceProofRecord,
  getProofEligibility,
} from "@/services/supabase/proof_of_residence";
import { addDays, maskCpf } from "@/utils/proof_of_residence";
import {
  buildResidenceProofHash,
  generateValidationCode,
} from "@/utils/proof_of_residence_crypto";
import { generateResidenceProofPdf } from "@/utils/proof_of_residence_pdf";
import { buildAddressLine } from "@/utils/address";
import MainLayout from "@/components/layout/MainLayout";
import { CreditCard, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { buildPublicAppUrl } from "@/lib/env";

export default function ProofOfResidencePage() {
  const [eligibility, setEligibility] = useState<ProofEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await getProofEligibility();
        setEligibility(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a declaração de residência.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function handleGeneratePdf() {
    if (
      !eligibility?.allowed ||
      !eligibility.user ||
      !eligibility.association
    ) {
      return;
    }

    setGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const issuedAt = new Date().toISOString();
      const expiresAt = addDays(new Date(), 30).toISOString();

      const validationCode = await generateValidationCode();

      const verificationUrl = buildPublicAppUrl(
        `/validate-proof/${encodeURIComponent(validationCode)}`,
      );

      const integrityHash = await buildResidenceProofHash({
        userId: eligibility.user.id,
        associationId: eligibility.association.id,
        cpf: eligibility.user.cpf,
        address: buildAddressLine(
          eligibility.user.address_1,
          eligibility.user.address_number,
        ),
        issuedAt,
        expiresAt,
        validationCode,
      });

      await createResidenceProofRecord({
        user: eligibility.user,
        association: eligibility.association,
        issuedAt,
        expiresAt,
        validationCode,
        verificationUrl,
        integrityHash,
      });

      const pdfBytes = await generateResidenceProofPdf({
        user: eligibility.user,
        association: eligibility.association,
        issuedAt,
        expiresAt,
        validationCode,
        verificationUrl,
        integrityHash,
      });

      const pdfArrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength,
      ) as ArrayBuffer;

      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `declaracao-residencia-${validationCode}.pdf`;
      anchor.click();

      URL.revokeObjectURL(url);

      setSuccessMessage("Declaração gerada com sucesso.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o PDF.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <DashboardLayout>
      <MainLayout>
        <div className="mx-auto max-w-6xl">
          <DashboardHeader title="Declaração de Residência" />

          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              Carregando dados da declaração...
            </div>
          ) : null}

          {!loading && eligibility ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
              <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Status da emissão
                </h2>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Permissão
                  </p>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      eligibility.allowed
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {eligibility.allowed
                      ? "Liberado para emissão"
                      : "Bloqueado"}
                  </p>
                </div>

                <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <div>
                    <span className="font-medium">Usuário:</span>{" "}
                    {eligibility.user?.fullname || "-"}
                  </div>
                  <div>
                    <span className="font-medium">CPF:</span>{" "}
                    {eligibility.user ? maskCpf(eligibility.user.cpf) : "-"}
                  </div>
                </div>

                {!eligibility.allowed && eligibility.reason ? (
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                      {eligibility.reason}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate("/profile#partner-section")}
                      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-amber-300/80 bg-linear-to-r from-amber-300 via-yellow-300 to-orange-300 px-4 py-3 text-sm font-semibold text-amber-950 shadow-[0_12px_30px_rgba(251,191,36,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(251,191,36,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 dark:border-amber-300/20 dark:from-amber-300 dark:via-yellow-200 dark:to-orange-200 dark:text-amber-950 sm:min-w-55 sm:w-auto"
                    >
                      <span className="pointer-events-none absolute inset-y-0 left-[-30%] w-1/3 -skew-x-12 bg-white/25 blur-md transition-transform duration-700 group-hover:translate-x-[330%]" />
                      <span className="pointer-events-none absolute right-3 top-2 text-amber-800/80">
                        <Sparkles size={12} className="animate-pulse" />
                      </span>
                      <CreditCard size={16} />
                      Quero Virar Sócio
                    </button>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={!eligibility.allowed || generating}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {generating ? "Gerando PDF..." : "Baixar PDF"}
                </button>
              </aside>
            </div>
          ) : null}
        </div>
      </MainLayout>
    </DashboardLayout>
  );
}
