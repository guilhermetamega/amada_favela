# Migração do endereço para `address_1 + address_number`

## Objetivo

Padronizar o consumo do novo modelo de endereço em toda a aplicação, evitando que telas e integrações continuem usando apenas `address_1`.

## Estratégia adotada

1. **Compatibilidade progressiva**
   - Mantivemos `address_1` como campo base.
   - Passamos a buscar também `address_number` nos fluxos que usam dados de usuário.
2. **Composição centralizada**
   - Criamos utilitários de endereço em `src/utils/address.ts`.
   - Todas as telas críticas passam a renderizar o endereço formatado por helper único, reduzindo divergências.
3. **Baixo custo de renderização**
   - A composição é feita com função simples (string/regex leve), sem processamento pesado.
   - Mantivemos consultas enxutas com `select` explícito.

## Ajustes aplicados

- **Perfil e dados base**
  - `ProfileUser` e consultas de perfil agora incluem `address_number`.
- **Declaração de residência**
  - Snapshot, hash de integridade e exibição agora consideram `address_number`.
- **Carteirinha**
  - Endereço completo usa `address_1 + address_number + address_2`.
- **Cartas (Mails)**
  - Lista e detalhes de destinatário exibem endereço com número.
- **Ordens de serviço**
  - Tela do morador mostra endereço principal com número (quando disponível).
  - Listagem agrupada no admin exibe `address_label` já formatado.

## Próximos passos recomendados (database-first)

Para máxima escalabilidade no longo prazo:

1. Atualizar funções SQL (`create_service_order` e `resolve_service_order_group`) para suportar `address_number` de forma nativa.
2. Incluir `address_number` na tabela `service_orders` (ou manter `address_label` materializado).
3. Criar índice composto para agrupamento/consulta administrativa por comunidade e endereço.

Isso reduz ambiguidade de agrupamento quando existe a mesma rua com números diferentes.
