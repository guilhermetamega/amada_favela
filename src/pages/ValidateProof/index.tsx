import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/Layout";
import { validateResidenceProof } from "@/services/supabase/proof_of_residence";
import type { ValidateResidenceProofResult } from "@/types/proof_of_residence";
import { formatDateTime, maskCpf } from "@/utils/proof_of_residence";

export default function ValidateProofPage() {
  const { validationCode = "" } = useParams();
  const [result, setResult] = useState<ValidateResidenceProofResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const data = await validateResidenceProof(validationCode);
        setResult(data);
      } finally {
        setLoading(false);
      }
    }

    if (validationCode) {
      void load();
    } else {
      setLoading(false);
      setResult({
        valid: false,
        reason: "Código de validação ausente.",
        record: null,
      });
    }
  }, [validationCode]);

  return (
    <DashboardLayout>
      <main className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Validação de Declaração de Residência
            </h1>

            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Código consultado:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {validationCode || "-"}
              </span>
            </p>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Validando documento...
              </div>
            ) : null}

            {!loading && result ? (
              <>
                <div
                  className={`mt-6 rounded-2xl border p-5 ${
                    result.valid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <p className="text-base font-semibold">
                    {result.valid
                      ? "Documento válido"
                      : result.reason || "Documento inválido"}
                  </p>
                </div>

                {result.record ? (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Nome
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {result.record.full_name_snapshot}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        CPF
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {maskCpf(result.record.cpf_snapshot)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Endereço
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {result.record.address_snapshot}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Emitido em
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDateTime(result.record.issued_at)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Válido até
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDateTime(result.record.expires_at)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:col-span-2">
                      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Hash de integridade
                      </p>
                      <p className="mt-1 break-all text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {result.record.integrity_hash}
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
