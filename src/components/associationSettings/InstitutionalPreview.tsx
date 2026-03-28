type Props = {
  name: string;
  cnpj: string;
  phone: string;
  addressPreview: string;
  logoUrl: string | null;
  signatureUrl: string | null;
  presidentName: string;
  presidentRole: string;
  isActive: boolean;
};

export default function InstitutionalPreview({
  name,
  cnpj,
  phone,
  addressPreview,
  logoUrl,
  signatureUrl,
  presidentName,
  presidentRole,
  isActive,
}: Props) {
  return (
    <aside className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-5">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
          Preview institucional
        </h2>
      </div>

      <div className="p-4 sm:p-5">
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 pb-5 text-center dark:border-zinc-800">
            {/* Logo centralizada */}
            <div className="mb-4 flex justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo da associação"
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-200 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  Logo
                </div>
              )}
            </div>

            {/* Conteúdo institucional */}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {name || "Nome da associação"}
              </h3>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                CNPJ {cnpj || "-"}
              </p>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Telefone {phone || "-"}
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {addressPreview || "Endereço institucional"}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Presidência
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {presidentName || "-"}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {presidentRole || "Presidente"}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Prévia da assinatura
            </p>

            <div className="mt-3 flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 ">
              {signatureUrl ? (
                <img
                  src={signatureUrl}
                  alt="Assinatura institucional"
                  className="max-h-24 max-w-full object-contain"
                />
              ) : (
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Envie um arquivo de assinatura para visualizar aqui.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Status
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {isActive ? "Ativa" : "Inativa"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
