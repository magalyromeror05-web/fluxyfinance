
# Autenticação de Usuários + Preparação para Conexões Bancárias

## O que será construído

O AtlasCash receberá um sistema completo de autenticação (cadastro, login e logout) com email/senha, protegendo todas as páginas atuais. Também serão criadas as tabelas do banco de dados necessárias para armazenar conexões, contas e transações reais de cada usuário.

---

## Visão geral do fluxo

```text
┌──────────────────────────────────────────────────────┐
│  Usuário acessa AtlasCash                            │
│                                                      │
│  ├── Não autenticado → redireciona para /auth        │
│  │     ├── Aba Login (email + senha)                 │
│  │     └── Aba Cadastro (nome + email + senha)       │
│  │                                                   │
│  └── Autenticado → AppLayout (sidebar + conteúdo)   │
│        └── Avatar + nome real no rodapé do sidebar   │
│            com botão "Sair"                          │
└──────────────────────────────────────────────────────┘
```

---

## Parte 1 — Banco de Dados (Lovable Cloud)

### Tabelas a criar via migrations

**1. `profiles`** — dados públicos do usuário
```
id          → references auth.users(id) ON DELETE CASCADE
full_name   → text
avatar_url  → text (opcional)
created_at  → timestamptz
```

**2. `connections`** — integrações bancárias por usuário
```
id                  → uuid PK
user_id             → references auth.users(id)
provider            → text  (ex: "pluggy", "wise", "salt_edge", "manual")
provider_type       → text  (open_finance | wise | aggregator | manual)
country             → text  (BR | US | PY)
status              → text  (connected | expiring | disconnected)
consent_expires_at  → timestamptz
logo                → text
created_at          → timestamptz
```

**3. `accounts`** — contas por conexão
```
id                   → uuid PK
user_id              → references auth.users(id)
connection_id        → references connections(id)
institution_name     → text
account_name         → text
type                 → text  (checking | savings | credit | investment | wallet)
currency             → text  (BRL | USD | PYG)
balance              → numeric
provider_account_id  → text
last_sync_at         → timestamptz
status               → text
```

**RLS (Row Level Security)** em todas as tabelas:
- Leitura/escrita permitida apenas para o próprio `auth.uid()`.
- Tabela `profiles`: auto-criada via trigger no cadastro.

---

## Parte 2 — Autenticação (Frontend)

### Arquivos a criar

**`src/lib/supabase.ts`**
- Instância do cliente Supabase.

**`src/contexts/AuthContext.tsx`**
- Contexto React com `user`, `session`, `loading`.
- Escuta `onAuthStateChange` (configurado antes de `getSession()`).
- Funções: `signIn`, `signUp`, `signOut`.

**`src/pages/Auth.tsx`** — página pública `/auth`
- Dois modos: Login e Cadastro, alternados por abas.
- Design seguindo o padrão AtlasCash (fundo escuro, card central, tipografia Plus Jakarta Sans).
- Login: email + senha + botão "Entrar".
- Cadastro: nome completo + email + senha + confirmação de senha.
- Mensagens de erro gentis e inline.
- Logo AtlasCash no topo.

### Arquivos a modificar

**`src/components/AuthGuard.tsx`** (novo)
- Componente wrapper que verifica autenticação.
- Se `loading` → mostra spinner.
- Se não autenticado → redireciona para `/auth`.

**`src/App.tsx`**
- Envolve tudo com `AuthProvider`.
- Rota `/auth` como rota pública.
- Todas as rotas protegidas passam por `AuthGuard`.

**`src/components/AppSidebar.tsx`**
- Substitui "João Demo" pelo nome real do usuário autenticado via `useAuth()`.
- Adiciona botão de logout com ícone `LogOut` no rodapé.

---

## Parte 3 — Preparação para Conexões Bancárias

Com as tabelas `connections` e `accounts` criadas e protegidas por RLS, a página de Conexões (`/conexoes`) estará preparada para:

- Listar as conexões reais do usuário autenticado (vindas do banco).
- Exibir o mock atual enquanto o usuário não tem conexões reais.
- Os botões "Sincronizar" e "Reconectar" já estão na UI — eles serão ligados às chamadas reais nas próximas iterações (Pluggy, Wise, Salt Edge).

---

## Sequência de implementação

1. Ativar Lovable Cloud e criar as 3 migrations (profiles, connections, accounts) com RLS.
2. Criar `src/lib/supabase.ts`.
3. Criar `src/contexts/AuthContext.tsx` com listener de sessão.
4. Criar `src/pages/Auth.tsx` com formulários de login/cadastro.
5. Criar `src/components/AuthGuard.tsx`.
6. Atualizar `src/App.tsx` — rotas protegidas + rota pública `/auth`.
7. Atualizar `src/components/AppSidebar.tsx` — nome real + botão sair.

---

## Detalhes técnicos

- Senha mínima: 6 caracteres (padrão Supabase).
- Após cadastro: login automático (sem necessidade de confirmar email no MVP — pode-se desativar confirmação no dashboard do Lovable Cloud).
- Trigger automático cria linha em `profiles` quando `auth.users` recebe novo registro.
- `onAuthStateChange` configurado antes de `getSession()` para evitar race conditions.
- Nenhuma informação sensível no código — tudo via variáveis do Lovable Cloud.
