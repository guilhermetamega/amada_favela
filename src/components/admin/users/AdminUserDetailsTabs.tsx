import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  FileClock,
  Fingerprint,
  History,
  Home,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import type {
  AdminUserAuditResponse,
  AdminUserDetailResponse,
  AdminUserPaymentsResponse,
} from "@/types/admin-user-detail";
import {
  formatCurrencyFromCents,
  formatDate,
  formatDateTime,
  formatPhone,
} from "@/utils/formatters";

export type AdminUserDetailTab =
  | "overview"
  | "data"
  | "payments"
  | "membership"
  | "audit";

type AdminUserDetailTabsProps = {
  activeTab: AdminUserDetailTab;
  detail: AdminUserDetailResponse;

  payments: AdminUserPaymentsResponse | null;
  paymentsLoading: boolean;
  paymentsError: string;
  onPaymentsPageChange: (page: number) => void;

  audit: AdminUserAuditResponse | null;
  auditLoading: boolean;
  auditError: string;
  onAuditPageChange: (page: number) => void;

  onTabChange: (tab: AdminUserDetailTab) => void;
};

type TabDefinition = {
  id: AdminUserDetailTab;
  label: string;
  icon: LucideIcon;
};

const tabs: TabDefinition[] = [
  {
    id: "overview",
    label: "Resumo",
    icon: UserRound,
  },
  {
    id: "data",
    label: "Dados",
    icon: Fingerprint,
  },
  {
    id: "payments",
    label: "Pagamentos",
    icon: ReceiptText,
  },
  {
    id: "membership",
    label: "Associação",
    icon: Building2,
  },
  {
    id: "audit",
    label: "Auditoria",
    icon: History,
  },
];

type InfoItemProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </p>

        <p className="mt-1 wrap-break-word font-medium text-zinc-800 dark:text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  disabled: boolean;
  onChange: (page: number) => void;
};

function Pagination({ page, totalPages, disabled, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-300 px-3 text-sm font-semibold disabled:opacity-40 dark:border-zinc-700"
      >
        <ChevronLeft size={17} />
        Anterior
      </button>

      <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
        {page} de {totalPages}
      </span>

      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="inline-flex h-10 items-center gap-1 rounded-xl border border-zinc-300 px-3 text-sm font-semibold disabled:opacity-40 dark:border-zinc-700"
      >
        Próxima
        <ChevronRight size={17} />
      </button>
    </div>
  );
}

function OverviewTab({ detail }: { detail: AdminUserDetailResponse }) {
  const { profile, financialSummary, currentMembership } = detail;

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
          <WalletCards className="text-emerald-600" />

          <p className="mt-4 text-xs text-zinc-500">Total contribuído</p>

          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrencyFromCents(financialSummary.totalContributedCents)}
          </p>
        </article>

        <article className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
          <CircleDollarSign className="text-cyan-600" />

          <p className="mt-4 text-xs text-zinc-500">Líquido da associação</p>

          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrencyFromCents(financialSummary.associationNetCents)}
          </p>
        </article>

        <article className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
          <ReceiptText className="text-violet-600" />

          <p className="mt-4 text-xs text-zinc-500">Pagamentos aprovados</p>

          <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {financialSummary.approvedPaymentsCount}
          </p>
        </article>

        <article className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
          <CalendarDays className="text-amber-600" />

          <p className="mt-4 text-xs text-zinc-500">Último pagamento</p>

          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {financialSummary.lastPaymentAt
              ? formatDate(financialSummary.lastPaymentAt)
              : "Nenhum"}
          </p>
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <InfoItem
          icon={Phone}
          label="Telefone"
          value={formatPhone(profile.phone)}
        />

        <InfoItem icon={Mail} label="E-mail" value={profile.email} />

        <InfoItem
          icon={MapPin}
          label="Endereço"
          value={[profile.address1, profile.addressNumber]
            .filter(Boolean)
            .join(", ")}
        />

        <InfoItem
          icon={Building2}
          label="Associação atual"
          value={currentMembership?.associationName ?? "Sem vínculo registrado"}
        />
      </section>
    </div>
  );
}

function DataTab({ detail }: { detail: AdminUserDetailResponse }) {
  const { profile, permissions } = detail;

  return (
    <div className="space-y-4">
      {!permissions.canViewSensitiveData ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          Dados sensíveis estão ocultos para o seu perfil administrativo.
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2">
        <InfoItem
          icon={UserRound}
          label="Nome completo"
          value={profile.fullname}
        />

        <InfoItem icon={Mail} label="E-mail" value={profile.email} />

        <InfoItem
          icon={Phone}
          label="Telefone"
          value={formatPhone(profile.phone)}
        />

        <InfoItem
          icon={Fingerprint}
          label="CPF"
          value={profile.cpf ?? "Não informado"}
        />

        <InfoItem
          icon={CalendarDays}
          label="Nascimento"
          value={profile.birth ? formatDate(profile.birth) : "Dado protegido"}
        />

        <InfoItem
          icon={MapPin}
          label="Rua e número"
          value={[profile.address1, profile.addressNumber]
            .filter(Boolean)
            .join(", ")}
        />

        <InfoItem
          icon={Home}
          label="Complemento"
          value={profile.address2 ?? "Não informado"}
        />

        <InfoItem icon={MapPin} label="CEP" value={profile.zipcode} />

        <InfoItem
          icon={Building2}
          label="Comunidade"
          value={profile.communityLabel}
        />

        <InfoItem icon={ShieldCheck} label="Função" value={profile.role} />
      </section>
    </div>
  );
}

function getPaymentStatusStyle(status: string) {
  switch (status) {
    case "succeeded":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";

    case "failed":
    case "cancelled":
      return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";

    default:
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  }
}

function PaymentsTab({
  payments,
  loading,
  error,
  onPageChange,
}: {
  payments: AdminUserPaymentsResponse | null;
  loading: boolean;
  error: string;
  onPageChange: (page: number) => void;
}) {
  if (loading && !payments) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!payments || payments.items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
        <ReceiptText className="mx-auto text-zinc-400" />

        <p className="mt-3 font-semibold text-zinc-700 dark:text-zinc-300">
          Nenhum pagamento registrado
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {payments.items.map((payment) => (
          <article
            key={payment.id}
            className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-bold",
                      getPaymentStatusStyle(payment.status),
                    ].join(" ")}
                  >
                    {payment.status}
                  </span>

                  <span className="text-sm font-semibold uppercase text-zinc-500">
                    {payment.provider}
                  </span>
                </div>

                <p className="mt-3 text-sm text-zinc-500">
                  {payment.paidAt
                    ? formatDateTime(payment.paidAt)
                    : formatDateTime(payment.createdAt)}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrencyFromCents(payment.amountTotal)}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Associação:{" "}
                  {formatCurrencyFromCents(payment.amountAssociationTransfer)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-3 dark:border-zinc-800">
              <p>
                <span className="text-zinc-500">Método:</span>{" "}
                {payment.paymentMethodType ?? "Não informado"}
              </p>

              <p>
                <span className="text-zinc-500">Modalidade:</span>{" "}
                {payment.checkoutMode ?? "Não informada"}
              </p>

              <p>
                <span className="text-zinc-500">Tarifa:</span>{" "}
                {formatCurrencyFromCents(payment.amountGatewayFee)}
              </p>
            </div>

            {payment.receiptUrl ? (
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-300"
              >
                <ExternalLink size={16} />
                Abrir comprovante
              </a>
            ) : null}
          </article>
        ))}
      </div>

      <Pagination
        page={payments.page}
        totalPages={payments.totalPages}
        disabled={loading}
        onChange={onPageChange}
      />
    </>
  );
}

function MembershipTab({ detail }: { detail: AdminUserDetailResponse }) {
  if (detail.membershipHistory.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
        <Building2 className="mx-auto text-zinc-400" />

        <p className="mt-3 font-semibold text-zinc-700 dark:text-zinc-300">
          Nenhum vínculo registrado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {detail.membershipHistory.map((membership, index) => (
        <article
          key={membership.id}
          className="relative rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          {index === 0 ? (
            <span className="absolute right-4 top-4 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
              Mais recente
            </span>
          ) : null}

          <h3 className="pr-24 font-bold text-zinc-900 dark:text-zinc-100">
            {membership.associationName ?? "Associação não identificada"}
          </h3>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">Situação</p>

              <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                {membership.status ?? "Não informada"}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Criado em</p>

              <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                {formatDate(membership.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Vencimento</p>

              <p className="mt-1 font-semibold text-zinc-800 dark:text-zinc-200">
                {formatDate(membership.expiresAt)}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

const auditLabels: Record<string, string> = {
  user_basic_data_updated: "Dados básicos atualizados",

  user_sensitive_data_updated: "Dados sensíveis atualizados",

  user_email_updated: "E-mail atualizado",

  user_cpf_updated: "CPF atualizado",

  user_role_updated: "Função atualizada",

  user_community_updated: "Comunidade atualizada",

  user_password_reset: "Senha redefinida",

  user_password_changed_after_reset: "Senha temporária substituída",
};

function AuditTab({
  audit,
  loading,
  error,
  onPageChange,
}: {
  audit: AdminUserAuditResponse | null;
  loading: boolean;
  error: string;
  onPageChange: (page: number) => void;
}) {
  if (loading && !audit) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!audit || audit.items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
        <FileClock className="mx-auto text-zinc-400" />

        <p className="mt-3 font-semibold text-zinc-700 dark:text-zinc-300">
          Nenhuma alteração auditada
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {audit.items.map((log) => (
          <article
            key={log.id}
            className="rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                  {auditLabels[log.actionType] ?? log.actionType}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  Por {log.actorName}
                </p>
              </div>

              <time className="text-sm text-zinc-500">
                {formatDateTime(log.createdAt)}
              </time>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {log.reason}
            </p>

            {log.changedFields.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {log.changedFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="mt-3 text-xs text-zinc-400">
              Verificação: {log.verificationMethod}
            </p>
          </article>
        ))}
      </div>

      <Pagination
        page={audit.page}
        totalPages={audit.totalPages}
        disabled={loading}
        onChange={onPageChange}
      />
    </>
  );
}

export default function AdminUserDetailTabs({
  activeTab,
  detail,
  payments,
  paymentsLoading,
  paymentsError,
  onPaymentsPageChange,
  audit,
  auditLoading,
  auditError,
  onAuditPageChange,
  onTabChange,
}: AdminUserDetailTabsProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex min-w-max gap-1 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={[
                  "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {activeTab === "overview" ? <OverviewTab detail={detail} /> : null}

        {activeTab === "data" ? <DataTab detail={detail} /> : null}

        {activeTab === "payments" ? (
          <PaymentsTab
            payments={payments}
            loading={paymentsLoading}
            error={paymentsError}
            onPageChange={onPaymentsPageChange}
          />
        ) : null}

        {activeTab === "membership" ? <MembershipTab detail={detail} /> : null}

        {activeTab === "audit" ? (
          <AuditTab
            audit={audit}
            loading={auditLoading}
            error={auditError}
            onPageChange={onAuditPageChange}
          />
        ) : null}
      </div>
    </section>
  );
}
