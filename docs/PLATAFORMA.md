# Documentação Completa — Plataforma Amada Favela

## 1) Resumo executivo (visão de consultoria sênior)

A plataforma foi arquitetada para operar como **sistema operacional da associação comunitária**, conectando:

- experiência digital do morador,
- gestão operacional da associação,
- comunicação de utilidade pública,
- monetização via parceiros e mensalidade,
- trilha de governança com papéis e guards de acesso.

Do ponto de vista de maturidade, o projeto já possui:

- separação de domínios por telas e serviços,
- módulo de patrocínio desacoplado,
- backend orientado a eventos financeiros (Stripe webhook),
- base preparada para escalar em funcionalidades por comunidade.

---

## 2) Stack técnica e responsabilidades

## Frontend

- **React 19 + TypeScript + Vite**: SPA com lazy loading de páginas e guardas de rota.
- **Tailwind**: design system utilitário.
- **Capacitor**: base para build Android.

## Backend e dados

- **Supabase Auth**: autenticação de moradores.
- **Supabase Postgres**: dados de negócio.
- **Supabase Storage**: mídia (banner, anúncios, arquivos etc.).
- **Supabase Edge Functions**: fluxos transacionais e integrações externas.

## Pagamentos

- **Stripe**:
  - checkout de mensalidade;
  - sincronização/estado de pagamentos;
  - webhook para confirmação e pós-processamento;
  - onboarding/sync de conta conectada da associação.

---

## 3) Modelo de acesso e segurança funcional

A navegação usa 3 camadas de proteção:

1. **Rota pública**: páginas legais, auth e validação pública de comprovante.
2. **`ProtectedRoute`**: exige sessão autenticada para portal do morador.
3. **`RoleGuard`**:
   - staff: `employee`, `admin`, `president`;
   - superadmin: `admin`.
4. **`SponsorSessionGuard`**: sessão específica para patrocinadores.

Essa separação evita sobreposição de regras de negócio entre persona morador e sponsor.

---

## 4) Inventário de telas (rotas + objetivo de negócio)

## 4.1 Públicas

- **`/` e `/auth`**: onboarding e autenticação.
- **`/privacy`, `/terms`, `/child-policy`**: compliance jurídico.
- **`/delete-account`**: aderência a LGPD/privacidade.
- **`/payment/result`**: fechamento de jornada de compra.
- **`/validate-proof/:validationCode`**: verificação externa de comprovante.

## 4.2 Morador autenticado

- **`/dashboard`**: hub de navegação e comunicação.
- **`/profile`**: dados pessoais, segurança e histórico.
- **`/lost-and-found`**: achados e perdidos.
- **`/missing`**: animais desaparecidos.
- **`/home-rent`**: oferta/procura de moradia.
- **`/polls`**: participação cidadã e priorização comunitária.
- **`/service-orders`**: abertura e acompanhamento de solicitações.
- **`/mails`**: comunicação segmentada.
- **`/member-card`**: carteira/identificação digital.
- **`/proof-of-residence`**: emissão de comprovante.
- **`/social-projects` e detalhes**: vitrine de iniciativas locais.

## 4.3 Staff administrativo

- **`/admin`**: cockpit operacional.
- **`/admin/service-orders`**: triagem e resolução agrupada.
- **`/admin/polls`**: criação e gestão de enquetes.
- **`/admin/mail`**: comunicações oficiais.
- **`/admin/association`**: dados institucionais da associação.
- **`/admin/create-warnings`**: gestão de avisos prioritários.
- **`/admin/social-projects`**: governança de projetos sociais.
- **`/admin/welcome-banner`**: personalização de banner institucional.

## 4.4 Superadmin

- **`/super-admin`**: camada de supervisão global.

## 4.5 Patrocinador

- **`/sponsor/login`**: login dedicado.
- **`/sponsor`**: home do patrocinador.
- **`/sponsor/weekly-ad`**: anúncio semanal.
- **`/sponsor/banner`**: banner de loja/comércio.

---

## 5) Funções importantes por domínio (frontend/service layer)

## 5.1 Contexto de autenticação e perfil

- `src/providers/AppProviders.tsx`: composição global de providers.
- `src/providers/AuthProvider.tsx`: sessão e estado de auth.
- `src/contexts/ProfileContext.tsx`: permissões, comunidade e status parceiro.
- `src/hooks/useAuth.ts` e `src/hooks/usePermissions.ts`: acesso simplificado de estado.

**Papel estratégico:** garante autorização contextual para habilitar/ocultar módulos da experiência.

## 5.2 Dados e integrações Supabase (camada de serviços)

Principais arquivos em `src/services/supabase/`:

- `auth.ts`: cadastro/login/logout e fluxo de conta.
- `profile.ts` e `user_profile.ts`: perfil do usuário e informações pessoais.
- `polls.ts`: enquetes (morador + admin).
- `warning_banners.ts`: avisos de destaque no dashboard.
- `service_orders` (arquivo atual nomeado como `sevice_orders.ts`): solicitações de serviço e resolução.
- `association.ts` e `association_public.ts`: dados institucionais.
- `membership.ts`: mensalidade/parceria.
- `mail.ts`: comunicação com moradores.
- `lost_and_found.ts`, `lost_animals.ts`, `home_rent.ts`: módulos de utilidade comunitária.
- `social_projects.ts`: projetos sociais.
- `proof_of_residence.ts`: emissão/validação de comprovante.
- `member_card.ts`: geração de carteira do morador.
- `sponsor_auth.ts`, `sponsor_weekly_ad.ts`, `sponsor_store_banner.ts`: fluxo de patrocinadores.

**Papel estratégico:** centraliza regras de acesso a dados, reduz acoplamento da UI e facilita auditoria.

## 5.3 Cache e desempenho

Em `src/lib/cache/` há estratégias por domínio (polls, hero, profile, homeRent, lostAndFound, lostAnimals, serviceOrders).

**Valor:** melhora UX percebida e reduz round-trips em módulos de consulta recorrente.

## 5.4 Utilitários críticos

- `src/utils/proof_of_residence_pdf.ts`: artefato PDF de comprovante.
- `src/utils/proof_of_residence_crypto.ts`: recursos de assinatura/validação.
- `src/utils/address.ts`, `zipcode.ts`, `cpf.ts`: normalização e validações.
- `src/lib/permissions.ts`: matriz de permissões por papel.

---

## 6) Backend transacional (Supabase Edge Functions)

## 6.1 Financeiro e Stripe

- `create-membership-checkout`: inicia checkout de mensalidade (inclusive recorrente).
- `get-membership-checkout-status`: consulta estado da sessão/pagamento.
- `stripe-webhook`: processa eventos Stripe e materializa efeitos no banco.
- `sync-open-membership-payment-state`: reconciliação de pendências.
- `create-association-stripe-onboarding`: cria fluxo de onboarding da associação.
- `sync-association-stripe-onboarding-status`: sincroniza progresso do onboarding.

## 6.2 Patrocinadores

- `sponsor-login`: autenticação de patrocinador.
- `sponsor-weekly-ad-get/save/delete`: CRUD de anúncio semanal.
- `sponsor-store-banner-get/save/delete`: CRUD de banner de loja.
- `_shared/sponsor-session.ts`: validação de sessão e autorização por feature.

**Papel estratégico:** move regras sensíveis para backend server-side e evita exposição de segredo no cliente.

---

## 7) Estrutura de dados (visão funcional)

Sem detalhar schema SQL completo, o sistema opera com entidades de alto valor:

- **Usuário e perfil** (papel, comunidade, dados de contato).
- **Associação** (dados institucionais, ativos visuais e parâmetros financeiros).
- **Conteúdo comunitário** (avisos, enquetes, mails, projetos).
- **Solicitações operacionais** (ordens de serviço, moradia, achados/perdidos, animais).
- **Financeiro** (pagamentos, status, integrações Stripe, repasses).
- **Patrocínio** (features liberadas, mídia ativa, sessão específica).

---

## 8) Riscos técnicos e recomendações de evolução (nível sênior)

## Curto prazo

1. **Padronização de nomenclaturas** (ex.: `sevice_orders.ts` → `service_orders.ts`).
2. **Unificação de pontos de acesso de contexto** para evitar duplicidade de hooks.
3. **Checklist de cache por usuário/comunidade** para prevenir leak de sessão.

## Médio prazo

1. **Observabilidade**: logs estruturados por domínio e correlação por request-id.
2. **Testes de integração críticos**: auth, pagamentos, fluxo admin e sponsor.
3. **Documentação viva de contratos** (Edge Functions + payloads).

## Longo prazo

1. **Arquitetura orientada a módulos de domínio** com boundaries formais.
2. **Matriz de permissões declarativa** auditável por produto/segurança.
3. **KPIs operacionais** por módulo (SLA de ordens, taxa de resolução, engajamento em enquetes etc.).

---

## 9) Guia rápido de operação para engenharia

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

Para backend local e deploy de funções, utilizar fluxo padrão Supabase CLI já versionado em `supabase/`.
