# Amada Favela — Plataforma Comunitária

> Aplicação web/mobile (React + Vite + Supabase) para gestão de comunidade, comunicação com moradores, serviços locais e integrações de pagamento (Stripe e Mercado Pago).

## Etapa 1 — Documento para tela inicial do GitHub

Este README foi desenhado como visão executiva para **produto, engenharia, operações e negócio**.

## Visão do Produto

O sistema centraliza os principais fluxos de uma associação comunitária:

- **Acesso e identidade**: cadastro/login de moradores, perfis e permissões por papel.
- **Portal do morador**: dashboard, perfil, enquetes, avisos e conteúdos públicos.
- **Serviços da comunidade**: ordens de serviço, achados e perdidos, animais desaparecidos, aluguel e projetos sociais.
- **Gestão administrativa**: administração por papéis (employee/admin/president/super-admin).
- **Módulo de parceiros/patrocinadores**: autenticação própria e gestão de banners/anúncios.
- **Financeiro**: checkout de mensalidade, webhooks e sincronização de estados de pagamento via Stripe e Mercado Pago.

## Arquitetura em alto nível

- **Frontend**: React 19 + TypeScript + Vite + Tailwind.
- **Backend BaaS**: Supabase (Auth, Postgres, Storage, Edge Functions).
- **Pagamentos**: Stripe e Mercado Pago (checkout, assinatura, contas conectadas/OAuth, webhooks e conciliação).
- **Aplicativo móvel**: Capacitor (Android configurado no projeto).

## Mapa de telas (rotas principais)

### Acesso público

- `/` e `/auth` — autenticação.
- `/privacy`, `/terms`, `/child-policy` — páginas legais.
- `/delete-account` — instrução/fluxo de exclusão de conta.
- `/payment/result` — retorno de pagamento.
- `/validate-proof/:validationCode` — validação de comprovante.

### Morador (autenticado)

- `/dashboard`
- `/profile`
- `/lost-and-found`
- `/missing`
- `/home-rent`
- `/polls`
- `/bingo`
- `/service-orders`
- `/mails`
- `/member-card`
- `/proof-of-residence`
- `/resume-builder`
- `/social-projects` e `/social-projects/:id`
- `/garbage-schedules`

### Administrativo (employee/admin/president)

- `/admin`
- `/admin/analytics`
- `/admin/users` e `/admin/users/:userId`
- `/admin/service-orders`
- `/admin/polls`
- `/admin/bingo`
- `/admin/mail`
- `/admin/association`
- `/admin/association/garbage-schedules`
- `/admin/create-warnings`
- `/admin/social-projects`
- `/admin/welcome-banner`

### Superadmin

- `/super-admin`

### Patrocinador

- `/sponsor/login`
- `/sponsor`
- `/sponsor/weekly-ad`
- `/sponsor/banner`
- `/sponsor/raffles`

## Organização técnica (resumo)

- `src/pages/` → telas/rotas.
- `src/components/` → componentes por domínio.
- `src/services/supabase/` → acesso a dados e regras de integração com Supabase.
- `src/routes/` → roteamento e guards de segurança.
- `supabase/functions/` → Edge Functions (Stripe, sponsor auth e mídia, onboarding).
- `supabase/migrations/` → evolução de schema.

## Principais capacidades por área

- **Produto**: app único para ciclo completo do morador e operação da associação.
- **Engenharia**: separação clara entre UI, domínio e integração com backend.
- **Operação**: fluxos administrativos e de atendimento centralizados.
- **Receita/financeiro**: integrações de pagamento com rastreabilidade por eventos.

## Etapa 2 — Documento completo

A documentação completa (dados, telas e funções importantes) está em:

- [`docs/PLATAFORMA.md`](docs/PLATAFORMA.md)
- [`docs/AUDITORIA_2026-09-10.md`](docs/AUDITORIA_2026-09-10.md) — verificação funcional, UX, performance, banco, sessão/cache e operação.
- [`docs/PLANO_EVOLUCAO_2026-09-10.md`](docs/PLANO_EVOLUCAO_2026-09-10.md) — ações propostas, revisão do Perfil, inclusão digital, novas funcionalidades e tratamento dos Advisors do Supabase.

## Como rodar localmente

```bash
npm install
npm run dev
```

## Scripts úteis

```bash
npm run dev
npm run build
npm run lint
npm run preview
```
