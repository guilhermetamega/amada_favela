import DashboardHeader from "@/components/layout/DashboardHeader";
import DashboardLayout from "@/components/layout/Layout";
import { AlertTriangle, Eye, Mail, Shield, Siren, Ban } from "lucide-react";

const REPORT_EMAIL = "guitamega06@gmail.com";

const commitments = [
  {
    icon: Shield,
    title: "Tolerância zero",
    description:
      "A AMA da Favela e o aplicativo Lojas das Comunidades adotam política de tolerância zero em relação a qualquer forma de abuso, exploração ou conteúdo sexual envolvendo crianças e adolescentes.",
  },
  {
    icon: Ban,
    title: "Conteúdo proibido",
    description:
      "É expressamente proibida a publicação, o compartilhamento, o armazenamento ou a disseminação de qualquer conteúdo que viole a integridade, a dignidade ou a segurança de menores.",
  },
  {
    icon: Eye,
    title: "Monitoramento e prevenção",
    description:
      "A plataforma poderá monitorar, revisar, limitar alcance, remover conteúdos e aplicar medidas preventivas sempre que houver indício de violação desta política ou risco à comunidade.",
  },
  {
    icon: Siren,
    title: "Ação imediata",
    description:
      "Conteúdos ou condutas suspeitas poderão resultar em remoção imediata, suspensão ou bloqueio da conta, além de comunicação às autoridades competentes quando necessário.",
  },
];

const forbiddenExamples = [
  "Conteúdo sexual envolvendo crianças ou adolescentes.",
  "Material de exploração, abuso, aliciamento ou sexualização de menores.",
  "Mensagens, imagens, vídeos ou links com insinuação, estímulo ou facilitação de abuso infantil.",
  "Tentativas de contato impróprio, assédio, grooming ou condutas que coloquem menores em risco.",
  "Uso da plataforma para armazenar, divulgar ou intermediar conteúdo ilegal relacionado a menores.",
];

const actions = [
  "Remover imediatamente conteúdos que violem estas diretrizes.",
  "Bloquear, restringir ou suspender usuários envolvidos em condutas ilícitas ou suspeitas.",
  "Preservar registros, quando cabível, para fins de auditoria, segurança e cooperação legal.",
  "Cooperar com autoridades competentes e cumprir a legislação aplicável.",
  "Aprimorar continuamente mecanismos de prevenção, denúncia e resposta.",
];

export default function CSAEPage() {
  return (
    <DashboardLayout>
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <DashboardHeader
            title="Segurança Infantil e Prevenção de Abuso (CSAE)"
            description="Política institucional de proteção contra abuso, exploração e conteúdo sexual envolvendo crianças e adolescentes."
          />

          <section className="mt-6 overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 bg-zinc-50/80 px-5 py-5 dark:border-zinc-800 dark:bg-zinc-950/40 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-2.5 dark:border-red-900/60 dark:bg-red-950/40">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
                    Compromisso de proteção
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    A plataforma AMA da Favela e o aplicativo Lojas das
                    Comunidades adotam política de tolerância zero em relação a
                    qualquer forma de abuso, exploração ou conteúdo sexual
                    envolvendo crianças e adolescentes.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {commitments.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article
                      key={item.title}
                      className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <div className="mb-3 gap-3 flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                        <Icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">
                          {item.title}
                        </h3>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                        {item.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
                Condutas e conteúdos proibidos
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                É expressamente proibida a utilização da plataforma para
                publicação, compartilhamento, armazenamento ou disseminação de
                qualquer conteúdo que viole a integridade de menores.
              </p>

              <div className="mt-4 space-y-3">
                {forbiddenExamples.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
                Medidas adotadas pela plataforma
              </h2>

              <div className="mt-4 space-y-3">
                {actions.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
              Canal oficial de denúncia
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Usuários podem denunciar conteúdos ou comportamentos suspeitos por
              meio do canal oficial abaixo. As denúncias serão analisadas com
              prioridade e poderão resultar em medidas imediatas para proteção
              dos usuários e da plataforma.
            </p>

            <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <Mail className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
                    Email oficial
                  </p>
                  <a
                    href={`mailto:${REPORT_EMAIL}`}
                    className="mt-1 block break-all text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-500 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:decoration-zinc-400"
                  >
                    {REPORT_EMAIL}
                  </a>
                </div>
              </div>

              <a
                href={`mailto:${REPORT_EMAIL}?subject=Den%C3%BAncia%20CSAE`}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-zinc-900 bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:opacity-90 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Enviar denúncia
              </a>
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 sm:text-lg">
              Conformidade
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              A AMA da Favela atua em conformidade com as políticas aplicáveis
              do Google Play e com a legislação pertinente, buscando garantir um
              ambiente digital mais seguro, responsável e protegido para toda a
              comunidade.
            </p>
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
}
