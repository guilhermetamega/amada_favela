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
- backend orientado a eventos financeiros (webhooks Stripe e Mercado Pago),
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
- **Mercado Pago**:
  - checkout e retorno de pagamento;
  - OAuth e contas conectadas;
  - webhooks, consulta e sincronização de pagamentos;
  - integração de associação e patrocinadores.

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
- **`/bingo`**: cartela do morador e acompanhamento do sorteio ativo.
- **`/service-orders`**: abertura e acompanhamento de solicitações.
- **`/mails`**: comunicação segmentada.
- **`/member-card`**: carteira/identificação digital.
- **`/proof-of-residence`**: emissão de comprovante.
- **`/resume-builder`**: criação e exportação de currículo em PDF.
- **`/social-projects` e detalhes**: vitrine de iniciativas locais.
- **`/garbage-schedules`**: consulta dos horários de coleta e ativação de notificações push.

## 4.3 Staff administrativo

- **`/admin`**: cockpit operacional.
- **`/admin/analytics`**: indicadores de usuários, pagamentos e operação.
- **`/admin/users` e `/admin/users/:userId`**: consulta e gestão de usuários.
- **`/admin/service-orders`**: triagem e resolução agrupada.
- **`/admin/polls`**: criação e gestão de enquetes.
- **`/admin/bingo`**: criação, sorteio e encerramento de jogos.
- **`/admin/mail`**: comunicações oficiais.
- **`/admin/association`**: dados institucionais da associação.
- **`/admin/association/garbage-schedules`**: cadastro dos horários de coleta.
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
- **`/sponsor/raffles`**: criação e acompanhamento de rifas/sorteios.

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
- `service_orders.ts`: solicitações de serviço e resolução.
- `association.ts` e `association_public.ts`: dados institucionais.
- `membership.ts`: mensalidade/parceria.
- `mail.ts`: comunicação com moradores.
- `lost_and_found.ts`, `lost_animals.ts`, `home_rent.ts`: módulos de utilidade comunitária.
- `social_projects.ts`: projetos sociais.
- `proof_of_residence.ts`: emissão/validação de comprovante.
- `member_card.ts`: geração de carteira do morador.
- `bingo.ts`: jogos, cartelas e sorteios.
- `garbage_schedules.ts`: horários da coleta e preferências de notificação.
- `sponsor_auth.ts`, `sponsor_weekly_ad.ts`, `sponsor_store_banner.ts`: fluxo de patrocinadores.

**Papel estratégico:** centraliza regras de acesso a dados, reduz acoplamento da UI e facilita auditoria.

## 5.3 Cache e desempenho

Em `src/lib/cache/` há estratégias por domínio (polls, hero, profile, memberCard, bingo, homeRent, lostAndFound, lostAnimals e serviceOrders).

**Valor:** melhora UX percebida e reduz round-trips em módulos de consulta recorrente.

**Regra obrigatória:** qualquer chave que possa armazenar conteúdo pessoal, administrativo ou segmentado deve incluir `userId` e, quando aplicável, `communityId`. O evento `SIGNED_OUT` deve invalidar cache em memória, `sessionStorage` e `localStorage` dos domínios autenticados.

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

## 6.3 Mercado Pago, bingo e notificações

- Funções Mercado Pago cobrem OAuth, criação/consulta de pagamentos e webhooks.
- Funções de bingo protegem operações de cartela e sorteio no backend.
- Funções de push de coleta dependem da configuração pública do Firebase no frontend e das credenciais server-side na função correspondente.
- O inventário implantado no Supabase deve ser reconciliado com `supabase/functions/` antes de cada release.

---

## 7) Estrutura de dados (visão funcional)

Sem detalhar schema SQL completo, o sistema opera com entidades de alto valor:

- **Usuário e perfil** (papel, comunidade, dados de contato).
- **Associação** (dados institucionais, ativos visuais e parâmetros financeiros).
- **Conteúdo comunitário** (avisos, enquetes, mails, projetos).
- **Solicitações operacionais** (ordens de serviço, moradia, achados/perdidos, animais).
- **Financeiro** (pagamentos, status, integrações Stripe/Mercado Pago, repasses).
- **Patrocínio** (features liberadas, mídia ativa, sessão específica).

---

## 8) Riscos técnicos e recomendações de evolução (nível sênior)

## Curto prazo

1. **Eliminar cache cruzado entre contas** em perfil, carteirinha e bingo; limpar todo cache autenticado no logout.
2. **Versionar o estado remoto**: conectar GitHub/Supabase, registrar migrations e manter as Edge Functions locais alinhadas às implantadas.
3. **Restabelecer CI**: o workflow atual está sem gatilhos e o lint precisa voltar a passar.
4. **Reduzir o tempo de conteúdo das rotas autenticadas** e definir timeout, erro e ação de tentar novamente.
5. **Configurar as variáveis do Firebase em produção** para habilitar notificações da coleta.

## Médio prazo

1. **Observabilidade**: logs estruturados por domínio e correlação por request-id.
2. **Testes de integração críticos**: auth, pagamentos, fluxo admin e sponsor.
3. **Documentação viva de contratos** (Edge Functions + payloads).
4. **Acessibilidade**: semântica de diálogo, foco, fechamento por `Escape`, rótulos e estados vazios.
5. **Performance de banco**: corrigir RLS com `auth.*` por linha, revisar funções com `search_path` mutável e validar índices com `EXPLAIN (ANALYZE, BUFFERS)`.

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

---

## 10) Estado operacional verificado

A última verificação manual registrada ocorreu em **10/09/2026**, usando a aplicação em produção, o código local, o repositório GitHub e o Supabase Dashboard. O relatório detalhado, com severidade, evidências, limitações e plano de correção, está em [`AUDITORIA_2026-09-10.md`](AUDITORIA_2026-09-10.md).

Antes de publicar uma nova versão:

1. executar `tsc`, lint e build em CI;
2. aplicar migrations por ferramenta versionada, nunca somente pelo SQL Editor;
3. comparar Edge Functions locais e remotas;
4. validar cabeçalhos HTTP e cache de assets no domínio de produção;
5. executar smoke tests autenticados por papel, sem reutilizar cache de outra conta;
6. confirmar backup recuperável e procedimento de restauração.
