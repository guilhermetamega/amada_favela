# Amada Favela — Plataforma Comunitária

> Aplicação web/mobile (React + Vite + Supabase) para gestão de comunidade, comunicação com moradores, serviços locais e integrações de pagamento (Stripe).

## Etapa 1 — Documento para tela inicial do GitHub

Este README foi desenhado como visão executiva para **produto, engenharia, operações e negócio**.

## Visão do Produto

O sistema centraliza os principais fluxos de uma associação comunitária:

- **Acesso e identidade**: cadastro/login de moradores, perfis e permissões por papel.
- **Portal do morador**: dashboard, perfil, enquetes, avisos e conteúdos públicos.
- **Serviços da comunidade**: ordens de serviço, achados e perdidos, animais desaparecidos, aluguel e projetos sociais.
- **Gestão administrativa**: administração por papéis (employee/admin/president/super-admin).
- **Módulo de parceiros/patrocinadores**: autenticação própria e gestão de banners/anúncios.
- **Financeiro**: checkout de mensalidade, webhook Stripe e sincronização de estados de pagamento.

## Arquitetura em alto nível

- **Frontend**: React 19 + TypeScript + Vite + Tailwind.
- **Backend BaaS**: Supabase (Auth, Postgres, Storage, Edge Functions).
- **Pagamentos**: Stripe (Checkout, assinatura, onboarding de conta conectada, webhook).
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
- `/service-orders`
- `/mails`
- `/member-card`
- `/proof-of-residence`
- `/social-projects` e `/social-projects/:id`

### Administrativo (employee/admin/president)

- `/admin`
- `/admin/service-orders`
- `/admin/polls`
- `/admin/mail`
- `/admin/association`
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
- **Receita/financeiro**: integração de pagamentos com rastreabilidade por eventos.

## Etapa 2 — Documento completo

A documentação completa (dados, telas e funções importantes) está em:

- [`docs/PLATAFORMA_AMADA_FAVELA.md`](docs/PLATAFORMA_AMADA_FAVELA.md)

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
