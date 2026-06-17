# Recuperação de senha no Supabase

Este app usa o fluxo nativo de recuperação de senha do Supabase Auth.

## O que foi implementado no app

- Na tela de login, o botão **Esqueci minha senha** envia o e-mail de recuperação para o CPF/e-mail informado.
- Quando o usuário abre o link do e-mail, o Supabase redireciona para `/auth` e o app exibe o formulário **Criar nova senha**.
- Após salvar a senha, a sessão temporária é encerrada e o usuário pode fazer login novamente.

## Passo a passo para ativar no Supabase

1. Acesse o painel do projeto no Supabase.
2. Vá em **Authentication > URL Configuration**.
3. Em **Site URL**, informe a URL pública do app, por exemplo:
   - Produção: `https://seu-dominio.com`
   - Homologação/local: `http://localhost:5173`
4. Em **Redirect URLs**, adicione as URLs que o Supabase pode usar após o clique no link de recuperação:
   - `https://seu-dominio.com/auth`
   - `https://seu-dominio.com/auth/`
   - `http://localhost:5173/auth` (se precisar testar localmente)
   - `http://localhost:5173/auth/` (se precisar testar localmente)
5. Vá em **Authentication > Providers > Email** e confirme que o provedor de e-mail está habilitado.
6. Se o envio de e-mails estiver desativado ou limitado, configure SMTP em **Project Settings > Authentication > SMTP Settings**.
7. Opcionalmente, personalize o template em **Authentication > Email Templates > Reset Password**. Mantenha o link/token padrão do Supabase no template.
8. Salve as alterações e teste com um usuário real: digite o CPF/e-mail no login, clique em **Esqueci minha senha**, abra o e-mail e defina a nova senha.

## Observações

- O app resolve CPF para e-mail usando a mesma função de login existente (`get_email_by_cpf`).
- O link de recuperação usa dinamicamente a origem atual do navegador e redireciona para `/auth`.
- Para produção, a URL `/auth` precisa estar listada em **Redirect URLs**; caso contrário, o Supabase pode bloquear ou redirecionar incorretamente o fluxo.
