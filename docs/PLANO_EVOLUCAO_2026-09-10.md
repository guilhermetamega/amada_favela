# Plano de evolução — Amada Favela

**Data:** 10/09/2026  
**Base:** auditoria funcional de produção, código local, GitHub e Supabase Dashboard.  
**Objetivo:** transformar os achados em ações executáveis e orientar novas funcionalidades de alto valor comunitário.

---

## 1) Direção recomendada

A plataforma já cobre muitos problemas reais, mas ainda se apresenta como uma coleção extensa de módulos. O próximo ciclo deve priorizar quatro resultados:

1. **confiança:** proteger dados, permitir recuperação e tornar o deploy reproduzível;
2. **velocidade:** mostrar informação útil rapidamente, inclusive em celular e rede limitada;
3. **simplicidade:** orientar a pessoa pelo que ela deseja fazer, com frases curtas e ações claras;
4. **utilidade recorrente:** notificações, agenda, oportunidades e acompanhamento de solicitações que façam o usuário voltar.

No retrato consultado, havia 147 usuários cadastrados e 18 usuários ativos mensais. Antes de ampliar muito o catálogo, a equipe deve medir ativação e recorrência para descobrir quais funções realmente aumentam o uso.

---

## 2) Matriz “o que fazer” e “como implementar”

| Área | O que ajustar | Como implementar | Aceite mínimo | Prioridade |
|---|---|---|---|---|
| Produção e versionamento | associar cada deploy a um commit e migration | conectar GitHub/Vercel/Supabase, criar baseline remoto, exigir preview e aprovação | commit, migration e release identificáveis no ambiente | P0 |
| Backup | garantir recuperação dos dados | habilitar backup compatível com o risco, export criptografado e ensaio de restauração | restauração documentada e testada | P0 |
| Funções SQL | aplicar privilégio mínimo e `search_path` seguro | migration revisando assinatura, owner, `SECURITY INVOKER/DEFINER`, grants e schemas qualificados | Advisor reduzido sem quebrar os papéis | P0 |
| RLS | evitar avaliação por linha e sobreposição | usar `(select auth.uid())`, consolidar policies equivalentes e indexar colunas de filtro | testes por papel + plano de execução melhor | P0/P1 |
| Cache autenticado | impedir dados de outra conta | chave com usuário/comunidade e limpeza central no evento de auth | teste A→logout→B sem dado antigo | P0 |
| CI | bloquear regressões | workflow ativo com install, TypeScript, ESLint, build, testes e advisors | PR impedido de mesclar quando falhar | P0 |
| Firebase/push | tornar coleta notificável | configurar ambiente, VAPID/service worker, permissão contextual e preferências | notificação em dispositivo real e log idempotente | P0/P1 |
| Carregamento | reduzir tela vazia de 8–20 s | split por rota, RPCs agregadas, deduplicação, cache stale-while-revalidate e imagem otimizada | conteúdo útil abaixo de 2,5 s no p75 móvel | P1 |
| Assets/HTTP | reduzir tráfego repetido | WebP/AVIF responsivo e cache imutável para `/assets/*` | imagem principal abaixo de 500 kB e cache `immutable` | P1 |
| Formulários/modais | acessibilidade e prevenção de erro | componente de diálogo único, labels, foco, `Escape`, validação inline e confirmação | teclado/NVDA concluem a tarefa | P1 |
| Linguagem | atender usuário leigo | glossário curto, verbos de ação, exemplos, passos e mensagens sem código do backend | teste moderado com moradores | P1 |
| Observabilidade | enxergar falha e lentidão reais | RUM, logs por request-id, métricas por rota/RPC e alertas | painel com p75/p95 e taxa de erro | P1 |
| Testes de negócio | validar efeitos reais com segurança | staging, seed sintético e E2E por morador/staff/admin | jornadas críticas automatizadas | P1 |
| Documentação | manter estado operacional atual | checklist de release e inventário gerado de rotas/functions/migrations | documentação conferida no CI | P2 |

---

## 3) Melhorias por módulo

### 3.1 Carteirinha

**O que:** explicar validade, benefícios e onde a carteirinha é aceita; oferecer QR verificável, modo de alto contraste e acesso offline.  
**Como:** QR com token público de escopo mínimo e expiração, tela pública sem dados pessoais excessivos, cache offline apenas do cartão do usuário atual e revogação no logout.  
**Aceite:** leitura do QR confirma apenas autenticidade/status; nenhuma informação sensível fica acessível pelo identificador.

### 3.2 Currículos

**O que:** transformar o formulário longo em assistente por etapas, incluir exemplos e conectar oportunidades locais.  
**Como:** etapas “Dados”, “Experiência”, “Estudo”, “Habilidades” e “Revisar”; autosave por usuário; exemplos de resumo profissional; importação opcional do Perfil; exportação em PDF carregada sob demanda.  
**Aceite:** rascunho não cruza contas, retomada funciona e o PDF é utilizável em uma página.

### 3.3 Cartas

**O que:** avisar quando uma carta chega, explicar retirada e registrar confirmação sem ambiguidade.  
**Como:** preferência de push/WhatsApp, cartão com local e prazo de retirada, histórico “recebida pela associação → pronta → entregue” e confirmação com data.  
**Aceite:** usuário entende onde buscar e staff evita confirmação duplicada.

### 3.4 Declaração de residência

**O que:** mostrar critérios, validade, prévia e motivo quando a emissão não estiver disponível.  
**Como:** checklist simples antes do botão, preview sem criar registro, emissão idempotente, QR/código público com dados mínimos e histórico no Perfil.  
**Aceite:** pessoa consegue responder “posso emitir?”, “até quando vale?” e “como alguém valida?”.

### 3.5 Achados, perdidos e desaparecidos

**O que:** acelerar reencontro e reduzir exposição de telefone/endereço.  
**Como:** localização aproximada, data/hora, compartilhamento em imagem, alertas por raio/comunidade, contato intermediado ou telefone mascarado, fluxo “encontrado/devolvido” e deduplicação.  
**Aceite:** publicação guiada, contato protegido e encerramento preserva histórico; exclusão exige confirmação.

### 3.6 Imóveis

**O que:** tornar anúncios comparáveis e confiáveis.  
**Como:** preço, finalidade, cômodos, disponibilidade, fotos otimizadas, selo revisado, expiração automática, favoritos e filtros tolerantes a erro de escrita.  
**Aceite:** cards apresentam os mesmos dados essenciais e anúncios antigos pedem renovação.

### 3.7 Projetos sociais

**O que:** converter visualização em participação.  
**Como:** ações separadas para “Quero participar”, “Quero ser voluntário” e “Quero doar”; agenda, vagas, requisitos, responsável e prestação de contas resumida.  
**Aceite:** projeto mede inscrições, comparecimento, voluntariado e doações sem expor dados dos participantes.

### 3.8 Enquetes

**O que:** aumentar confiança no voto e fechar o ciclo de decisão.  
**Como:** explicar objetivo, prazo e público; recibo sem revelar voto; resultado acessível; publicação posterior “o que foi decidido e o que acontecerá agora”.  
**Aceite:** um voto por usuário conforme regra, resultado compreensível sem depender só de cor e trilha administrativa auditável.

### 3.9 Horários de lixo

**O que:** mostrar a próxima coleta e avisar mudanças/feriados.  
**Como:** card “Próxima coleta”, calendário semanal, exceções por data, push e alternativa por WhatsApp/SMS quando viável, preferências por comunidade.  
**Aceite:** nenhuma notificação duplicada, horário local correto e mensagem útil quando não houver agenda cadastrada.

### 3.10 Bingo

**O que:** explicar regras e tornar a cartela legível e confiável.  
**Como:** tutorial curto, modo letras/números grandes, anúncio acessível do número, reconexão sem perder marcações, idempotência de cartela e validação server-side do vencedor.  
**Aceite:** recarregar não gera outra cartela e nenhum cliente consegue sortear ou validar vencedor sem autorização.

### 3.11 Admin

**O que:** reduzir risco operacional e tempo de atendimento.  
**Como:** fila “precisa de ação”, filtros salvos, ações em lote com prévia, confirmação/undo, auditoria por usuário, permissão granular, revisão de conteúdo vencido e indicadores de SLA.  
**Aceite:** toda alteração sensível informa autor/data; ações destrutivas pedem confirmação e operações críticas exigem papel explícito.

---

## 4) Perfil pessoal

### 4.1 Diagnóstico funcional e de organização

O Perfil reúne identificação, dados pessoais, mensalidade, senha, anúncios, documentos legais, exclusão e logout. A divisão em cards é visualmente consistente e os campos principais possuem rótulos. Contudo, uma única página concentra tarefas demais e coloca segurança/exclusão ao lado de tarefas frequentes.

O arquivo principal possui cerca de 1.240 linhas e ainda duplica cache/carregamento que já existem em `src/lib/cache/profile-cache.ts`, `src/hooks/useProfilePage.ts` e `src/lib/prefetch/prefetch-profile.ts`. O hook e o prefetch extraídos não estão integrados ao Perfil atual. Isso aumenta divergência, como TTL de 5 minutos no componente e 10 minutos no módulo de cache.

Em recarregamento com sessão/cache existente, o shell apareceu em aproximadamente 2,1 s e o Perfil completo em aproximadamente 8,2 s. A tela consulta perfil, histórico, três tabelas de anúncios e pagamento aberto; depois solicita URL assinada do avatar.

### 4.2 O que melhorar no Perfil

| Problema | Ajuste | Implementação sugerida |
|---|---|---|
| página longa e cognitivamente pesada | navegação local por categorias | abas/accordion: “Meus dados”, “Mensalidade”, “Meus anúncios”, “Segurança e privacidade” |
| dados úteis chegam tarde | carregar resumo primeiro | RPC `get_my_profile_summary` para dados essenciais; anúncios/histórico sob demanda |
| quatro consultas + três consultas internas de anúncios | diminuir round-trips | uma RPC paginada ou requests independentes que não bloqueiem o cabeçalho |
| cache duplicado e não isolado | uma única fonte | remover implementação interna, usar cache `userId/community`, invalidar por evento |
| dois botões “Mensalidade ativa” | consolidar estado e meios de pagamento | um card de status; opções de pagamento apenas quando cabíveis |
| troca de senha com regra mínima de 6 caracteres | fortalecer fluxo | mínimo de 8–12, requisitos visíveis, mostrar/ocultar, força, senha atual ou reautenticação |
| feedback somente no topo | resposta próxima da ação | mensagens inline e região `aria-live`, além do resumo global |
| excluir/encerrar anúncio sem confirmação | prevenir toque acidental | diálogo explicando “Encerrar mantém; Excluir apaga”, com foco seguro |
| remover avatar sem confirmação | permitir recuperação | confirmação simples ou desfazer por curto período; apagar arquivo anterior após sucesso do novo upload |
| telefone exibido sem máscara | melhorar legibilidade | formatar em pt-BR, armazenando forma normalizada separadamente |
| e-mail desabilitado sem orientação | explicar mudança | texto “Para alterar seu e-mail...” e fluxo seguro dedicado |
| exclusão com texto jurídico | dupla camada de linguagem | resumo simples primeiro e detalhes legais expansíveis |
| ausência de visão de completude | orientar próximo passo | checklist “Complete seu perfil” com benefício de cada campo |

### 4.3 Arquitetura proposta do Perfil

1. `useProfileSummary(userId)` carrega nome, avatar, comunidade, papel e status.
2. Cada aba carrega seu domínio somente quando aberta.
3. `profileQueryKeys` inclui usuário e comunidade.
4. Mutações invalidam apenas os domínios afetados.
5. Anúncios usam paginação e seleção explícita de colunas, não `select('*')`.
6. Mudança de senha exige reautenticação e invalida outras sessões quando solicitado.
7. Exclusão de conta passa por Edge Function versionada, auditada e idempotente.

---

## 5) Aplicação para usuários leigos ou com baixa formação

### O que já funciona bem

- o menu combina nome e descrição curta para cada módulo;
- os botões usam verbos reconhecíveis como “Editar”, “Baixar”, “Criar” e “Ver detalhes”;
- estados vazios existem nas áreas principais;
- ícones são acompanhados por texto na maioria dos casos;
- cards e espaços visuais ajudam a separar assuntos.

### Onde ainda há barreiras

- muitos módulos aparecem de uma vez no menu;
- Perfil e Admin mostram grande quantidade de informação numa única tela;
- termos como “status”, “checkout”, “mensalidade ativa”, “retenções legalmente exigidas” e mensagens técnicas do Supabase podem não ser claros;
- mais de 80 pontos da camada de serviços repassam `error.message` diretamente, o que pode exibir inglês, código ou texto sem orientação;
- formulários não explicam sempre o formato esperado antes do erro;
- ações parecidas, como “Encerrar” e “Excluir”, não explicam a diferença;
- não há modo de leitura assistida, tutorial ou ajuda contextual.

### Como adequar

1. trocar linguagem técnica por ação e consequência: “Pagamento sendo confirmado” em vez de `processing`;
2. uma ideia por frase, parágrafos curtos e detalhes avançados recolhidos;
3. oferecer “Ouvir instruções” usando voz do dispositivo em páginas críticas;
4. criar busca inicial “O que você precisa?” com resultados por intenção;
5. limitar a home a 4–6 ações frequentes e mover o restante para “Todos os serviços”;
6. mostrar exemplos dentro/abaixo de campos: telefone, CEP, título do anúncio e resumo profissional;
7. validar enquanto a pessoa digita, mantendo o valor preenchido após erro;
8. mapear erros técnicos para mensagens portuguesas com próximo passo e código de suporte;
9. testar com moradores reais usando tarefas, não perguntas de opinião;
10. oferecer tamanho de texto maior, alto contraste e navegação completa por teclado.

A orientação segue a W3C: palavras simples, frases curtas, blocos pequenos, instruções separadas, rótulos associados e confirmação clara de sucesso/erro.

---

## 6) Novas funções de interesse do usuário

### Prioridade A — aumenta retorno e resolve necessidades frequentes

1. **Central “O que você precisa?”** — busca por intenção, sinônimos e erros de digitação; leva diretamente à ação.
2. **Caixa de notificações e preferências** — cartas, coleta, resposta de OS, enquete, projeto e alertas, com canal escolhido pelo usuário.
3. **Agenda da comunidade** — eventos, cursos, vacinação, reuniões, prazos e coleta excepcional; lembrete com um toque.
4. **Oportunidades** — empregos, cursos e benefícios, ligados ao Currículo; filtros por escolaridade, localização e prazo.
5. **Acompanhamento unificado** — linha do tempo de OS, carta, documento, inscrição e denúncia em “Meus pedidos”.
6. **Ajuda guiada** — passos, áudio opcional, perguntas frequentes e contato da associação sem sair da tarefa.

### Prioridade B — amplia utilidade comunitária

1. **Guia de serviços locais verificados** — saúde, assistência, educação, comércio e emergência, com horário e rota.
2. **Inscrição em projetos e voluntariado** — vagas, lista de espera, presença e lembretes.
3. **Mapa comunitário leve** — serviços, projetos, coleta, achados e alertas com localização aproximada e modo de baixo consumo.
4. **Carteira de documentos** — carteirinha, declarações emitidas, recibos e validade, sem guardar além do necessário no dispositivo.
5. **Benefícios e direitos** — conteúdo por perfil, checklist de documentos e encaminhamento, sempre com revisão da associação.
6. **Alertas urgentes oficiais** — água, energia, risco, mudança de serviço; somente staff autorizado, expiração automática e histórico.

### Prioridade C — depois de validar adoção

1. marketplace comunitário de itens/serviços;
2. orçamento participativo e envio de propostas antes da enquete;
3. doações transparentes para projetos, com prestação de contas;
4. agendamento de atendimento presencial e gestão de fila;
5. indicadores públicos agregados de resolução e participação.

### Como decidir o que construir

Aplicar uma enquete curta e entrevistas com 8–12 moradores, separando usuários frequentes, novos, idosos e pessoas com baixa alfabetização digital. Medir para cada proposta: frequência do problema, impacto, alternativa atual, urgência e disposição para usar. Construir primeiro a menor função que prove uso recorrente.

---

## 7) Supabase Security Advisor — 95 warnings agrupados

Os 95 registros não significam 95 causas diferentes. Várias funções aparecem em mais de um teste ou em sobrecargas. O painel foi percorrido integralmente e consolidado assim:

### 7.1 Function Search Path Mutable — 10

**Afetados:** `set_social_projects_updated_at`, `touch_updated_at`, `expire_partners`, `generate_bingo_card_numbers`, `assign_closed_raffle_winners`, `set_service_orders_updated_at`, `set_updated_at`, `create_sponsor_raffle`, `get_public_raffle` e `normalize_mail_phone`.

**O que significa:** a função resolve nomes usando um `search_path` que pode variar. Em função privilegiada, um objeto malicioso com o mesmo nome pode ser escolhido antes do objeto esperado.

**Solução:** definir `SET search_path = ''` e qualificar tudo (`public.users`, `auth.uid()`, `extensions.citext` etc.). Aplicar com a assinatura exata, pois há overload de `create_sponsor_raffle`. Testar triggers e RPCs após a migration.

### 7.2 Extension in Public — 2

**Afetados:** `pg_net` e `citext`.

**O que significa:** extensões no schema exposto aumentam a superfície pública e podem criar colisões de nomes/permissões.

**Solução:** criar/usar schema `extensions` e mover extensões relocáveis com `ALTER EXTENSION ... SET SCHEMA extensions`; revisar dependências qualificando o schema. Para extensão não relocável, documentar a exceção, fixar `search_path` e restringir grants.

### 7.3 Public Bucket Allows Listing — 3

**Afetados:** `social_projects`, `sponsor-raffles` e `warning_banners`.

**O que significa:** a policy de `SELECT` em `storage.objects` permite enumerar arquivos. Mesmo imagens públicas podem revelar nomes, volume, estrutura e arquivos esquecidos.

**Solução:** remover a listagem ampla para `anon`; permitir leitura somente por prefixo/objeto necessário ou tornar o bucket privado e emitir URLs assinadas. Se o conteúdo precisar ser público, usar nomes não previsíveis, metadata sem PII e registrar a decisão.

### 7.4 Anonymous users can execute SECURITY DEFINER — 36

**Afetados:** funções de permissão, bingo, enquetes, OS, rifas, parceiros, relatórios, pagamentos, validação pública e utilitários.

**O que significa:** `anon` consegue chamar uma função executada com os privilégios do proprietário. Uma checagem interna correta pode bloquear o abuso, mas um erro nessa checagem vira escalada de privilégio.

**Solução por classe:** 

- **admin/job** (`draw_bingo_number`, `assign_closed_raffle_winners`, `expire_partners`, `resolve_service_order_group`, `rls_auto_enable`): revogar `PUBLIC` e `anon`; executar por Edge Function/service role ou job;
- **autenticada** (`get_or_create_bingo_card`, `create_service_order`, contexto/role): revogar `anon`, conceder somente `authenticated` e preferir `SECURITY INVOKER` quando RLS bastar;
- **realmente pública** (`get_public_raffle`, `validate_residence_proof_public`): manter somente se indispensável, com saída mínima, validação, rate limit, `search_path` fixo e teste contra enumeração;
- **sensível** (`get_email_by_cpf`): retirar da API direta, colocar em Edge Function com rate limit/CAPTCHA e resposta genérica.

Executar como migration: `REVOKE EXECUTE ... FROM PUBLIC, anon;` seguido apenas dos `GRANT` indispensáveis, sempre usando a assinatura completa.

### 7.5 Signed-in users can execute SECURITY DEFINER — 43

**Afetados:** inclui RPCs `admin_*`, analytics, usuários, pagamentos, bingo, enquetes, OS, rifas e helpers de papel/contexto.

**O que significa:** qualquer conta autenticada pode chamar a RPC. Esconder botão/rota no React não é autorização. Se a função não verificar papel e comunidade internamente, um morador pode chamar o endpoint diretamente.

**Solução:** 

- RPCs de leitura/escrita do próprio usuário devem preferir `SECURITY INVOKER` + RLS;
- RPCs administrativas devem validar `auth.uid()`, papel, associação e comunidade dentro da transação;
- operações de privilégio alto devem sair do schema exposto e ser chamadas por Edge Function autorizada;
- revogar execução de `authenticated` quando não for requisito;
- criar testes negativos para morador, funcionário de outra comunidade e token expirado.

As 36 ocorrências públicas e 43 autenticadas se sobrepõem; não são 79 funções distintas.

### 7.6 Leaked Password Protection Disabled — 1

**O que significa:** o Auth não rejeita automaticamente uma senha já conhecida em vazamentos. No código atual, a alteração de senha aceita mínimo de seis caracteres.

**Solução:** proteção de senhas vazadas no plano Pro; independentemente do plano, elevar mínimo para pelo menos 8–12 caracteres, aplicar rate limit/CAPTCHA no login, MFA para staff/admin e exigir senha atual ou reautenticação na troca. A documentação oficial não recomenda senha com menos de oito caracteres.

---

## 8) Supabase Performance Advisor — 74 warnings agrupados

### 8.1 Auth RLS Initialization Plan — 50

**Tabelas:** 23 tabelas, incluindo `users` (5), `partners` (5), `mail` (4), `user_push_tokens` (4), `lost_and_found` (3), `lost_animals` (3), `bingo_cards` (3), `home_rent` (3), `warning_banners` (3), além de projetos, comprovantes, pagamentos, enquetes, OS, relatórios, coleta, bingo, rifas e auditoria.

**O que significa:** expressões como `auth.uid()`/`auth.jwt()` são recalculadas para cada linha examinada.

**Solução:** envolver funções estáveis em subselect — `(select auth.uid())`, `(select auth.jwt())` e `(select public.helper())` — para gerar init plan; incluir `TO authenticated/anon` explicitamente; indexar colunas comparadas (`user_id`, `created_by`, `community`, `association_id`) quando o plano justificar. Validar resultado e autorização antes/depois.

### 8.2 Multiple Permissive Policies — 20

**Tabelas:** `communities`, `content_reports`, `garbage_collection_schedules` (5), `partners`, `sponsor_features`, `sponsor_raffles` (5), `sponsor_store_banner_features`, `sponsor_store_banners`, `sponsor_weekly_ads`, `user_admin_audit_logs`, `user_admin_permissions` e `users`.

**O que significa:** para o mesmo papel/ação, o Postgres precisa avaliar várias policies permissivas e combiná-las com `OR`. O custo cresce por linha e a regra fica difícil de auditar.

**Solução:** listar policy, papel, comando, `USING` e `WITH CHECK`; consolidar policies realmente equivalentes em uma única regra com `OR`, ou restringir cada uma a papéis/comandos distintos. Os maiores ganhos prováveis estão em coleta e rifas, com cinco ocorrências cada.

### 8.3 Duplicate Index — 4

**Tabelas:** `association`, `connected_accounts`, `payments` e `user_admin_audit_logs`.

**O que significa:** dois índices cobrem a mesma definição. Cada `INSERT/UPDATE/DELETE` paga o custo de manter ambos e o banco ocupa espaço desnecessário.

**Solução:** consultar `pg_index`, `pg_class`, `pg_get_indexdef()` e `pg_stat_user_indexes`; comparar colunas, ordem, predicado, unicidade e opclass; preservar índice ligado a constraint; remover somente o redundante com `DROP INDEX CONCURRENTLY` em operação separada e monitorada. Não é seguro adivinhar o nome pelo Advisor.

---

## 9) Sequência de implementação

### Sprint 0 — segurança e base operacional

- baseline de migrations/functions;
- backup e restauração;
- grants de `SECURITY DEFINER` e `search_path`;
- isolamento/limpeza de cache;
- CI mínimo;
- política de senha e MFA administrativo.

### Sprint 1 — performance e Perfil

- imagem de avisos e cache HTTP;
- RLS init plan e policies duplicadas;
- Perfil carregado em blocos e cache único;
- feedback/confirmadores acessíveis;
- Firebase da coleta.

### Sprint 2 — inclusão e adoção

- home por intenção e “Todos os serviços”;
- mensagens simples e catálogo de erros;
- central de notificações;
- “Meus pedidos”;
- analytics de ativação/recorrência.

### Sprint 3 — novos serviços validados

- agenda comunitária;
- oportunidades ligadas ao Currículo;
- inscrições em projetos;
- guia de serviços locais.

---

## 10) Fontes de referência

- [Supabase — Advisors](https://supabase.com/docs/guides/observability/advisors)
- [Supabase — RLS policies e recomendações de performance](https://supabase.com/docs/guides/ai-tools/ai-prompts/database-rls-policies)
- [Supabase — Password security](https://supabase.com/docs/guides/auth/password-security)
- [W3C WAI — Conteúdo claro e compreensível](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/)
- [W3C WAI — Formulários acessíveis](https://www.w3.org/WAI/tutorials/forms/)

Este plano deve ser reavaliado após cada sprint com métricas de produção, testes com moradores e nova execução dos Advisors.
