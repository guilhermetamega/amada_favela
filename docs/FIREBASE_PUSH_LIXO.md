# Notificações push Firebase para horários de lixo

Este guia configura o envio de push quando faltar **10 minutos** para a coleta cadastrada em `garbage_collection_schedules`.

## O que foi implementado no código

- `user_push_tokens`: armazena tokens FCM por usuário/comunidade.
- `garbage_collection_notification_logs`: evita envio duplicado para o mesmo horário/data.
- `GarbagePushNotificationCard`: botão para o usuário ativar notificações na tela `/garbage-schedules`.
- `firebase-messaging-sw.js`: service worker que recebe notificações em background.
- `garbage-collection-push-dispatcher`: Edge Function que deve ser chamada por cron a cada minuto e envia push para os tokens da comunidade.

## 1. Criar/configurar o projeto no Firebase

1. Acesse <https://console.firebase.google.com/>.
2. Crie um projeto ou selecione um projeto existente.
3. Adicione um app Web em **Project settings > General > Your apps > Web app**.
4. Copie o objeto `firebaseConfig`; ele será usado nas variáveis `VITE_FIREBASE_*`.
5. Acesse **Project settings > Cloud Messaging**.
6. Em **Web Push certificates**, gere ou copie a chave pública VAPID. Ela será usada como `VITE_FIREBASE_VAPID_KEY`.
7. Confirme que a **Firebase Cloud Messaging API (HTTP v1)** está habilitada no Google Cloud do projeto.

Referência oficial: o setup Web do FCM usa Firebase config, service worker e `getToken` com VAPID key: <https://firebase.google.com/docs/cloud-messaging/web/get-started>.

## 2. Criar credenciais de servidor para o Supabase Edge Function

1. No Firebase Console, vá em **Project settings > Service accounts**.
2. Clique em **Generate new private key**.
3. Baixe o JSON da service account.
4. Guarde com segurança os campos:
   - `project_id`
   - `client_email`
   - `private_key`
5. A Edge Function usa OAuth 2.0 com o escopo `https://www.googleapis.com/auth/firebase.messaging` e envia para o endpoint HTTP v1 do FCM.

Referência oficial: <https://firebase.google.com/docs/cloud-messaging/send/v1-api#authorize-http-v1-send-requests>.

## 3. Variáveis de ambiente do front-end

Configure no ambiente de build do Vite:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=... # opcional
VITE_FIREBASE_VAPID_KEY=...
```

Sem essas variáveis, o card de ativação aparece bloqueado e informa que o Firebase ainda não foi configurado.

## 4. Secrets no Supabase

Configure os secrets da Edge Function:

```bash
supabase secrets set \
  FIREBASE_PROJECT_ID="seu-projeto" \
  FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com" \
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" \
  GARBAGE_COLLECTION_TIMEZONE="America/Sao_Paulo"
```

> Importante: mantenha as quebras de linha da private key como `\n` quando configurar via CLI/shell.

## 5. Aplicar migrations

Rode as migrations no Supabase:

```bash
supabase db push
```

As novas tabelas têm RLS:

- usuários só leem/alteram seus próprios tokens;
- logs de envio são visíveis apenas para staff da mesma comunidade;
- a Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para consultar horários, tokens e gravar logs.

## 6. Deploy da Edge Function

```bash
supabase functions deploy garbage-collection-push-dispatcher
```

A função espera `POST` e usa:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `GARBAGE_COLLECTION_TIMEZONE` (opcional; padrão `America/Sao_Paulo`)

## 7. Agendar o envio automático no Supabase Cron

A função precisa rodar a cada minuto. No Dashboard do Supabase:

1. Vá em **Cron / Jobs**.
2. Crie um job.
3. Escolha chamada HTTP/Edge Function ou use SQL com `pg_net`.
4. Configure a execução a cada minuto.

Exemplo SQL com `pg_net`:

```sql
select cron.schedule(
  'garbage-collection-push-dispatcher-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/garbage-collection-push-dispatcher',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SUPABASE_ANON_OR_SERVICE_KEY',
      'apikey', 'SUPABASE_ANON_OR_SERVICE_KEY'
    ),
    body := jsonb_build_object('source', 'cron'),
    timeout_milliseconds := 10000
  );
  $$
);
```

Referência oficial do Supabase Cron: <https://supabase.com/docs/guides/cron/quickstart>.

## 8. Como o disparo funciona

1. O cron chama a Edge Function a cada minuto.
2. A função soma 10 minutos ao horário atual no timezone configurado.
3. Busca horários ativos de lixo que batem com o dia da semana e `HH:mm` calculados.
4. Insere um log único para impedir duplicidade no mesmo dia/horário.
5. Busca tokens FCM ativos da comunidade.
6. Envia uma mensagem FCM HTTP v1 para cada token.
7. Tokens inválidos/desregistrados são desativados.

## 9. Teste manual

1. Configure um horário de lixo para 10 minutos à frente.
2. Acesse `/garbage-schedules`.
3. Clique em **Ativar notificações** e aceite a permissão do navegador.
4. Rode manualmente a função pelo Dashboard do Supabase ou via curl:

```bash
curl -X POST \
  'https://PROJECT_REF.supabase.co/functions/v1/garbage-collection-push-dispatcher' \
  -H 'Authorization: Bearer SUPABASE_ANON_OR_SERVICE_KEY' \
  -H 'apikey: SUPABASE_ANON_OR_SERVICE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"source":"manual-test"}'
```

5. Verifique se a notificação chegou e se `garbage_collection_notification_logs` recebeu registro.

## 10. Observações importantes

- Navegadores só permitem push depois de ação explícita do usuário e permissão concedida.
- Em iOS/Safari, notificações Web Push têm requisitos próprios de instalação/compatibilidade. Para app nativo Capacitor, o ideal é uma segunda etapa usando plugin nativo de push notifications.
- O envio atual é por token individual, o que facilita desativar tokens inválidos e manter escopo por comunidade.
