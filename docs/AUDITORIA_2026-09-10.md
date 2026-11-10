# Auditoria geral — Amada Favela

**Data da verificação:** 10/09/2026  
**Ambiente:** `https://amada-favela.vercel.app`  
**Escopo:** aplicação autenticada, código local, GitHub, Vercel/HTTP e Supabase Dashboard.

---

## 1) Resumo executivo

A aplicação está operacional e as principais jornadas autenticadas renderizam com uma sessão administrativa válida. Carteirinha, currículo, cartas, declaração de residência, listagens comunitárias, projetos sociais, enquetes, bingo e telas administrativas foram abertas e inspecionadas. As ações que gravariam dados reais — publicar itens, votar, gerar cartela, sortear, finalizar, excluir, enviar carta ou salvar configurações — não foram executadas em produção.

Os riscos mais importantes não estão concentrados em uma única tela. Eles estão na operação do ambiente:

1. produção, GitHub e Supabase não possuem hoje uma trilha reproduzível única;
2. o Supabase não registra migrations aplicadas nem possui backup disponível no plano atual;
3. caches de perfil, carteirinha e bingo não são isolados por usuário e não são limpos globalmente no logout;
4. rotas autenticadas importantes levaram aproximadamente 16–20 segundos para exibir conteúdo útil;
5. o workflow do GitHub Actions está sem gatilhos e o lint local falha;
6. notificações de coleta estão desabilitadas em produção por falta das variáveis públicas do Firebase;
7. há alertas relevantes do Supabase Advisor para segurança de funções e desempenho de RLS.

---

## 2) Método e limitações

Foram usados quatro tipos de verificação:

- **uso real no navegador:** navegação autenticada, abertura de telas, estados vazios, filtros, detalhes e formulários sem envio;
- **inspeção de código:** rotas, providers, serviços Supabase, cache, migrations, Edge Functions, assets e configuração da Vercel;
- **validação técnica local:** TypeScript, ESLint e build de produção;
- **painéis remotos:** GitHub Actions/deployments e Supabase Dashboard (saúde, advisors, query performance, migrations, backups e funções).

Limitações deliberadas:

- nenhuma mutação real foi realizada na base de produção;
- download de PDF/carteirinha não foi disparado;
- logout não foi executado para não interromper a sessão fornecida; o comportamento de limpeza foi verificado no código;
- a emulação de viewport móvel do navegador embutido não foi confiável; portanto, a conclusão de responsividade vem de inspeção de estilos, não de certificação visual mobile;
- tempos medidos são amostras manuais no ambiente disponível e devem ser confirmados com RUM/Lighthouse em uma janela controlada.

---

## 3) Cobertura funcional por módulo

| Módulo | Jornada simulada | Resultado |
|---|---|---|
| Carteirinha | abrir, conferir dados e disponibilidade do download | conteúdo e botão de download renderizados |
| Currículos | abrir editor, revisar dados, modelos, experiência, formação, habilidades e preview | editor completo renderizado; rascunho local indicado; carregamento muito lento |
| Cartas | abrir caixa de cartas | estado vazio claro; carregamento muito lento; entrega não testada sem uma carta real |
| Declaração de residência | consultar elegibilidade e ação de PDF | usuário elegível e botão de PDF renderizado; carregamento muito lento |
| Achados e Perdidos | listar, filtrar, abrir detalhe e formulário de publicação | listagem funcional; modal sem semântica/foco acessível |
| Desaparecidos | listar e abrir formulário de relato | listagem funcional; modal sem semântica/foco acessível |
| Imóveis | listar, abrir item e formulário de anúncio | listagem funcional; modal sem semântica/foco acessível |
| Projetos sociais | listar e navegar para detalhe | seis projetos renderizados; detalhe, galeria e contato disponíveis |
| Enquetes | consultar enquetes do morador e abrir criação administrativa | estado vazio do morador e do admin corretos; modal admin sem semântica/foco acessível |
| Horários de lixo | consultar tabela do morador e cadastro administrativo | estados “Sem horários” corretos; push indisponível por configuração ausente |
| Bingo | abrir jogo ativo e administração | jogo e controles renderizados; geração/sorteio/finalização não executados |
| Admin | dashboard, analytics, usuários, OS, enquetes, bingo, cartas, associação, projetos, avisos, banner e coleta | telas e dados renderizados; operações destrutivas ou representacionais não executadas |

---

## 4) Funcionalidade e confiabilidade

### Urgentes

- **Ambiente não reproduzível:** o Supabase Dashboard mostra “No repository connected”, nenhuma migration registrada e nenhuma branch. O banco contém RPCs que aparecem na migration local, indicando aplicação manual ou fora da trilha registrada. Há também 29 Edge Functions implantadas, enquanto o diretório local não contém pelo menos `delete-my-account` e `request-account-deletion`.
- **Recuperação de desastre sem garantia:** o projeto Supabase não apresenta backups disponíveis no plano atual. Dados de usuários, pagamentos e operação não devem depender de um ambiente sem restauração testada.

### Graves

- **Notificação de coleta indisponível:** a tela informa que as variáveis públicas do Firebase não estão configuradas e mantém “Ativar notificações” desabilitado.
- **CI quebrado:** `.github/workflows/main.yml` está integralmente comentado; o GitHub Actions acusa “No event triggers defined in on”. Assim, push/PR não validam build, lint ou integração.
- **Produção fora da trilha principal:** o GitHub mostrava `main` em `59b3a2c` (16/08/2026), o clone local estava em `30ca833` (08/09/2026) com referência `origin/main` ainda mais antiga, e os assets em produção tinham `Last-Modified` de 09/09/2026. É impossível associar com segurança a produção a um commit revisado.

### Médios

- Falta teste automatizado de autorização por papel e comunidade para cada rota administrativa.
- Falta teste end-to-end dos efeitos de publicar, votar, gerar cartela, sortear, finalizar, emitir PDF e marcar carta como entregue.
- A tela de enquetes do morador tem estado vazio adequado, mas não oferece explicação de quando novas enquetes aparecerão nem ação de atualização.

### Leves

- O título HTML permaneceu “AMA da Favela” em rotas diferentes; títulos específicos melhorariam histórico, abas e leitores de tela.
- Alguns nomes e textos administrativos variam entre “horários de lixo”, “coleta” e “garbage schedules”; padronizar a terminologia reduz ambiguidade operacional.

---

## 5) Performance e entrega web

### Urgentes

- Nenhum item isolado foi classificado como urgente; os problemas abaixo são graves e devem entrar no próximo release.

### Graves

- **Tempo para conteúdo útil:** em recarregamentos autenticados, Cartas levou cerca de 16,5 s, Declaração cerca de 17 s e Currículos não atingiu o estado pronto dentro de 20 s em uma das medições. O shell aparece antes, mas a tela parece vazia ou incompleta por tempo excessivo.
- **Imagem de 27,3 MB:** `src/assets/warning_bg.png` possui 27.326.200 bytes e é usado no carrossel/preview de avisos. Um único asset dessa ordem domina o tráfego e penaliza especialmente celulares.
- **Cache HTTP inadequado para arquivos com hash:** JS e CSS de produção responderam com `Cache-Control: public, max-age=0, must-revalidate`. Assets versionados pelo nome deveriam ser imutáveis por um ano.
- **Bundles grandes:** o build gerou JS principal de aproximadamente 637 kB (176 kB gzip), Analytics de 469 kB (131 kB gzip), PDFButton de 429 kB (178 kB gzip) e CSS de 233 kB (27 kB gzip).

### Médios

- Várias telas pesadas continuam no grafo inicial em vez de `lazy()`/split por rota, incluindo enquetes, bingo e páginas administrativas.
- O bootstrap autenticado consulta contexto de acesso e status de parceria em todas as cargas. O Supabase registrou 1.110 chamadas de `get_current_user_access_context()` com média próxima de 123 ms e máximo acima de 2,5 s.
- `mail_push_candidates` acumulou 91.532 execuções no período exibido pelo painel; a frequência sugere polling/agendamento excessivo ou trabalho duplicado.
- `expire_partners()` acumulou 4.036 chamadas, média próxima de 59 ms e máximo acima de 1,2 s. Expiração não deve ser um efeito colateral recorrente de leitura.

### Leves

- Há dependências e componentes com custo alto que podem ser pré-carregados somente quando a intenção do usuário for evidente.
- Estados skeleton existem, mas precisam exibir timeout, mensagem de falha e “Tentar novamente” quando a requisição ultrapassar um limite razoável.

### Correções recomendadas

1. converter `warning_bg.png` para WebP/AVIF, redimensionar para o tamanho real de exibição e manter a versão final abaixo de 300–500 kB;
2. configurar `Cache-Control: public, max-age=31536000, immutable` para `/assets/*` e `no-cache` para `index.html`;
3. separar por rota Admin Analytics, gerador de PDF, bingo, enquetes e fluxos de patrocinador;
4. adicionar medição RUM para LCP, INP, CLS, TTFB, tempo de bootstrap e tempo até conteúdo por rota;
5. deduplicar requisições em voo e revalidar em segundo plano, mantendo dados anteriores visíveis;
6. revisar a frequência de `mail_push_candidates` e migrar para evento/fila ou lote com checkpoint.

---

## 6) Banco de dados e Supabase

### Urgentes

- **Migrations sem rastreabilidade remota:** conectar o projeto ao fluxo versionado, criar baseline aprovado e impedir alteração de schema apenas pelo Dashboard.
- **Backup:** contratar/ativar backup compatível com o risco, gerar export criptografado e testar restauração em projeto isolado.

### Graves

- O Security Advisor reportou **95 warnings**. Entre os primeiros itens estão funções com `search_path` mutável, incluindo rotinas de projetos, atualização, parceiros, bingo, rifas, ordens de serviço, cartas e outras. Funções `SECURITY DEFINER` exigem atenção imediata.
- O Performance Advisor reportou **74 warnings**. Políticas de RLS em `lost_and_found`, `lost_animals`, `home_rent`, `partners` e `bingo_cards` reavaliam `auth.*` por linha.
- A extensão `pg_net` aparece no schema `public`; revisar necessidade e mover para schema de extensões quando compatível.

### Médios

- Tabelas de OAuth/webhook/contas conectadas aparecem com RLS habilitado e sem policy. Isso pode ser intencional para uso exclusivo por service role, mas deve ser documentado e acompanhado de auditoria explícita de grants.
- A migration local `20260908_optimize_app_reads.sql` cria RPCs/índices úteis, mas não corrige os alertas atuais de RLS nem aparece na trilha de migrations do Dashboard.
- Consultas de listas comunitárias devem ser medidas com `EXPLAIN (ANALYZE, BUFFERS)` antes de criar novos índices. Candidatos devem combinar comunidade, status e ordenação/data conforme cada consulta real.

### Leves

- Padronizar `updated_at`, nomes de comunidade e tipos de status reduz conversões e lógica duplicada no cliente.
- Registrar comentários SQL em RPCs sensíveis facilita a auditoria do contrato e do papel autorizado.

### Correções recomendadas

1. para cada função afetada, fixar `SET search_path = ''` e qualificar todas as tabelas/funções por schema;
2. nas policies, trocar chamadas por linha como `auth.uid()` por `(select auth.uid())`, mantendo a mesma regra e validando com testes de autorização;
3. substituir expiração por leitura por status calculado ou job agendado idempotente;
4. revisar grants de funções e tabelas server-only, removendo execução de `anon`/`authenticated` quando não necessária;
5. versionar e reconciliar as 29 Edge Functions remotas com o repositório;
6. criar smoke test SQL por papel/comunidade e rodá-lo em ambiente de staging.

---

## 7) Sessão, cache e privacidade

### Urgentes

- Nenhum item foi classificado como urgente isoladamente, desde que o ambiente permaneça controlado. O problema de cache cruzado abaixo deve ser corrigido antes de ampliar o uso em dispositivos compartilhados.

### Graves

- `profile_page_cache_v2` e `member_card_cache_v1` guardam dados pessoais em `sessionStorage` e memória sem `userId` na chave.
- `bingo:admin:list` e `bingo:public:list` usam `localStorage` global, sem usuário/comunidade.
- O `AuthProvider.signOut()` encerra a sessão Supabase, mas não chama uma invalidação global dos caches. Em uma mesma aba/dispositivo, uma conta seguinte pode receber dados antigos por alguns minutos.

### Médios

- Caches de imóveis, achados e desaparecidos são segmentados por comunidade, mas não por usuário; confirmar formalmente se todos os dados ali são públicos para qualquer membro da comunidade.
- Não existe um registro central de chaves, TTLs, sensibilidade e política de invalidação.
- A sessão Supabase persiste e o refresh automático funciona; recarregamentos mantiveram autenticação. Falta, porém, uma política visível de expiração por inatividade para perfis administrativos.

### Leves

- O cache genérico pode manter entradas expiradas em memória até uma nova escrita/leitura adequada.
- TTLs diferentes por módulo não estão documentados junto aos requisitos do produto.

### Correções recomendadas

1. usar chaves no formato `amada:<versao>:<dominio>:<userId>:<communityId>`;
2. impedir persistência client-side de dados pessoais que não sejam necessários para retomada da tela;
3. no evento `SIGNED_OUT`, limpar caches em memória e todas as chaves autenticadas de `sessionStorage`/`localStorage`;
4. ao receber `SIGNED_IN`, `TOKEN_REFRESHED`, troca de comunidade ou papel, invalidar dados incompatíveis;
5. criar testes E2E “usuário A sai, usuário B entra na mesma aba” para perfil, carteirinha, admin, bingo, cartas e pagamentos;
6. adotar uma camada de query/cache única com deduplicação, chave declarativa e invalidação por mutação.

---

## 8) UI, UX e acessibilidade

### Urgentes

- Nenhum bloqueio visual urgente foi observado no desktop.

### Graves

- Modais de criação/detalhe em Achados e Perdidos, Desaparecidos, Imóveis e criação de Enquete não expõem `role="dialog"`/`aria-modal`, não transferem foco para o conteúdo e deixam o foco no botão que abriu o modal. Isso prejudica teclado e leitores de tela.
- Vários filtros e campos de admin (bingo, cartas e horários de coleta) dependem de contexto visual e não possuem nome acessível direto. Rótulos visuais devem estar corretamente associados.

### Médios

- O atraso de 16–20 s produz sensação de tela travada; skeleton sozinho não explica o que está acontecendo.
- O botão de notificações da coleta desabilitado é bem explicado, mas expõe ao usuário final um detalhe técnico de implantação. Preferir mensagem de indisponibilidade orientada ao serviço e telemetria interna.
- Tabelas administrativas com muitos dados pessoais exigem modo compacto responsivo, cabeçalho fixo e alternativa em cards no mobile.
- A validação visual mobile ficou pendente e deve fazer parte do checklist de release em larguras 320, 375, 390, 768 e 1024 px.

### Leves

- Textos secundários do dashboard têm contraste discreto no tema escuro; validar WCAG AA com medição, especialmente em telas externas.
- Há bastante espaço vazio no desktop do Admin; aproveitar melhor a largura ou limitar o container pode melhorar leitura.
- Padronizar estados vazios com descrição e ação contextual mantém consistência entre Cartas, Enquetes e tabelas de coleta.

### Correções recomendadas

1. criar um componente `AccessibleDialog` único com foco inicial, focus trap, retorno de foco, `Escape`, título/descrição e bloqueio do conteúdo de fundo;
2. associar `label`/`htmlFor` ou `aria-label` a todo `input`, `select` e `textarea`;
3. adicionar `aria-live` para sucesso/erro de publicação, voto, download, sorteio e salvamento;
4. testar navegação somente por teclado e com NVDA;
5. aplicar títulos de página por rota e preservar foco no título principal após navegação SPA.

---

## 9) Segurança HTTP e qualidade de código

### Urgentes

- Nenhum incidente ativo foi identificado durante a inspeção.

### Graves

- A produção não retornou CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` nem proteção explícita de framing. A configuração local pendente de `vercel.json` já aponta para uma correção, mas precisa ser revisada, implantada e validada no domínio real.
- ESLint encerrou com **31 erros e 2 warnings**, principalmente regras de hooks, pureza e tipos `any`. O build passa, mas a base não está em condição de gate de qualidade.

### Médios

- A CSP proposta deve ser testada com Stripe, Mercado Pago, Supabase, Firebase e downloads de PDF para não bloquear jornadas legítimas.
- Não há evidência de pipeline automatizado com testes de dependências, secrets, RLS e Edge Functions.

### Leves

- `npm run lint` não iniciou pelo executável global do npm quebrado neste computador; o binário local do ESLint foi usado diretamente. Padronizar Node via Volta/Corepack ou imagem CI elimina essa variação.

---

## 10) Plano de correção priorizado

### P0 — antes do próximo release

1. criar backup recuperável e testar restauração;
2. reconciliar commit de produção, `main`, migrations e Edge Functions;
3. corrigir caches de perfil/carteirinha/bingo e limpeza no logout;
4. corrigir funções com `search_path` mutável e revisar grants;
5. reativar CI e impedir merge/deploy com TypeScript, lint ou build falhando;
6. configurar Firebase ou esconder temporariamente a ativação de push.

### P1 — próximo ciclo

1. otimizar o asset de 27,3 MB e cache HTTP de arquivos com hash;
2. corrigir RLS por linha e chamadas de alta frequência;
3. reduzir o bootstrap das rotas para conteúdo útil abaixo de 2,5 s no p75 móvel;
4. migrar modais para o componente acessível único;
5. adicionar testes E2E por papel e comunidade.

### P2 — evolução

1. RUM/observabilidade por rota e RPC;
2. auditoria mobile e WCAG completa;
3. padronização de estados vazios, títulos e mensagens;
4. catálogo vivo de cache, RPC, Edge Functions, políticas RLS e owners.

---

## 11) Evidências de validação local

- TypeScript (`tsc -b`): **aprovado**.
- Build Vite: **aprovado**, com aviso de chunks acima de 500 kB.
- ESLint: **reprovado**, 31 erros e 2 warnings.
- GitHub Actions: **reprovado**, workflow sem gatilho válido.
- Supabase: projeto saudável no momento da consulta, mas com 95 avisos de segurança e 74 de performance.
- Produção: rotas autenticadas acessíveis; sessão persistiu após reload; nenhum erro de console foi observado nos fluxos inspecionados.

Este documento registra um retrato do ambiente em 10/09/2026. Mudanças em produção, banco ou configuração devem gerar nova evidência e atualizar a data da verificação.
