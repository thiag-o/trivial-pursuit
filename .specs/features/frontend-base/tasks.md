# MVP-2: Frontend Base — Tasks

**Design**: `.specs/features/frontend-base/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Project Scaffold (Sequential)

Bootstrap do projeto React com Vite, Tailwind CSS, dependências e configuração base.

```
T1 → T2 → T3
```

### Phase 2: Services Layer (Sequential)

Auth helpers e Axios instance — pré-requisitos para qualquer componente que faz I/O.

```
T4 → T5
```

### Phase 3: Routing + Pages (Parallel OK)

ProtectedRoute wrapper e as 3 páginas. Pages podem ser feitas em paralelo após o router estar pronto.

```
         ┌→ T8  [P] ─┐
T6 → T7 ─┤→ T9  [P] ─├──→ Phase 4
         └→ T10 [P] ─┘
```

### Phase 4: Integration + Styling (Sequential)

Wiring final do App.tsx com todas as rotas, estilização consistente e validação E2E.

```
T11 → T12 → T13
```

---

## Task Breakdown

### T1: Scaffold React + Vite + TypeScript Project

**What**: Inicializar projeto React com Vite e TypeScript, instalar dependências core
**Where**: `frontend/` (novo diretório na raiz)
**Depends on**: None
**Requirement**: —

**Steps**:

1. `npm create vite@latest frontend -- --template react-ts`
2. `cd frontend && npm install`
3. Instalar dependências runtime: `axios`, `react-router-dom`
4. Limpar boilerplate (remover App.css, assets desnecessários, conteúdo default de App.tsx)
5. Verificar que `npm run dev` inicia sem erros

**Done when**:

- [x] `frontend/package.json` contém `react`, `react-dom`, `axios`, `react-router-dom`
- [x] `npm run dev` inicia sem erros
- [x] TypeScript strict mode ativo em `tsconfig.json`

**Verify**:

```bash
cd frontend && npm run dev -- --port 3000
# Deve iniciar em http://localhost:3000 sem erros
```

**Commit**: `chore(frontend): scaffold React+Vite+TypeScript project`

---

### T2: Configure Tailwind CSS

**What**: Instalar e configurar Tailwind CSS v3 com PostCSS
**Where**: `frontend/tailwind.config.js`, `frontend/postcss.config.js`, `frontend/src/index.css`
**Depends on**: T1
**Requirement**: FRONT-19

**Steps**:

1. Instalar: `npm install -D tailwindcss @tailwindcss/vite`
2. Configurar plugin Tailwind no `vite.config.ts`
3. Substituir conteúdo de `src/index.css` com `@import "tailwindcss"`
4. Verificar que classes Tailwind funcionam renderizando um elemento de teste

**Done when**:

- [x] `tailwindcss` e `@tailwindcss/vite` presentes no `devDependencies`
- [x] `src/index.css` contém diretiva `@import "tailwindcss"`
- [x] Classes Tailwind aplicadas corretamente (visível no browser)

**Verify**:

```bash
cd frontend && npm run build
# Build sem erros, CSS gerado corretamente
```

**Commit**: `feat(frontend): configure Tailwind CSS v4 with Vite plugin`

---

### T3: Create Environment Config + Project Structure

**What**: Criar `.env` com `VITE_API_URL`, estrutura de pastas, e entry point limpo
**Where**: `frontend/.env`, `frontend/src/main.tsx`, pastas `services/`, `components/`, `pages/`
**Depends on**: T1
**Requirement**: FRONT-16

**Steps**:

1. Criar `frontend/.env` com `VITE_API_URL=http://localhost:3001`
2. Criar pastas: `src/services/`, `src/components/`, `src/pages/`
3. Atualizar `src/main.tsx` com `BrowserRouter` wrapper no root
4. Limpar `App.tsx` para exportar componente mínimo

**Done when**:

- [x] `.env` contém `VITE_API_URL=http://localhost:3001`
- [x] Pastas `services/`, `components/`, `pages/` existem
- [x] `main.tsx` usa `BrowserRouter` wrapping `<App />`
- [x] Sem erros de TypeScript (`npx tsc --noEmit`)

**Verify**:

```bash
cd frontend && npx tsc --noEmit
# Zero errors
```

**Commit**: `feat(frontend): add env config and project structure`

---

### T4: Create Auth Helpers (`auth.ts`)

**What**: Funções puras para gerenciar token/nickname no localStorage
**Where**: `frontend/src/services/auth.ts`
**Depends on**: T1
**Requirement**: FRONT-03, FRONT-06

**Steps**:

1. Implementar `getToken(): string | null`
2. Implementar `setToken(token: string): void`
3. Implementar `removeToken(): void`
4. Implementar `getNickname(): string | null`
5. Implementar `setNickname(nickname: string): void`
6. Implementar `isAuthenticated(): boolean` — retorna `!!getToken()`
7. Implementar `clearAuth(): void` — remove token + nickname

**Done when**:

- [x] Todas as 7 funções exportadas
- [x] Sem erros de TypeScript (`npx tsc --noEmit`)

**Verify**:

```bash
cd frontend && npx tsc --noEmit
# Zero errors
```

**Commit**: `feat(frontend): add auth localStorage helpers`

---

### T5: Create Axios Instance with Interceptors (`api.ts`)

**What**: Instância Axios centralizada com request interceptor (JWT) e response interceptor (401 redirect)
**Where**: `frontend/src/services/api.ts`
**Depends on**: T4
**Requirement**: FRONT-14, FRONT-15, FRONT-16

**Steps**:

1. Criar instância Axios com `baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001'`
2. Request interceptor: se `getToken()` não-null, adicionar `Authorization: Bearer <token>`
3. Response interceptor: se status 401 e request URL **não** é `/auth/login`, chamar `clearAuth()` e `window.location.href = '/login'`
4. Exportar instância como default

**Done when**:

- [ ] Instância Axios exportada com baseURL configurável
- [ ] Request interceptor adiciona header JWT quando token existe
- [ ] Response interceptor trata 401 (limpa auth + redirect)
- [ ] Interceptor NÃO redireciona em 401 do `/auth/login` (previne loop infinito)
- [ ] Sem erros de TypeScript (`npx tsc --noEmit`)

**Verify**:

```bash
cd frontend && npx tsc --noEmit
# Zero errors
```

**Commit**: `feat(frontend): add Axios instance with JWT interceptors`

---

### T6: Create ProtectedRoute Component

**What**: Wrapper component que verifica autenticação e redireciona para `/login` se ausente
**Where**: `frontend/src/components/ProtectedRoute.tsx`
**Depends on**: T4
**Requirement**: FRONT-12

**Steps**:

1. Importar `isAuthenticated` de `auth.ts`
2. Se autenticado → renderizar `<Outlet />`
3. Se não autenticado → `<Navigate to="/login" replace />`

**Done when**:

- [ ] Componente exportado como default
- [ ] Usa `Outlet` do React Router para renderizar children routes
- [ ] Redireciona para `/login` quando não autenticado
- [ ] Sem erros de TypeScript

**Verify**:

```bash
cd frontend && npx tsc --noEmit
# Zero errors
```

**Commit**: `feat(frontend): add ProtectedRoute auth guard component`

---

### T7: Configure React Router in App.tsx

**What**: Definir rotas com React Router v6 — login (público), start e game (protegidos)
**Where**: `frontend/src/App.tsx`
**Depends on**: T3, T6
**Requirement**: FRONT-11, FRONT-13

**Steps**:

1. Importar `Routes`, `Route`, `Navigate` do React Router
2. Rota `/login` → `<LoginPage />` (público)
3. Layout route com `<ProtectedRoute>` para rotas protegidas
4. Rota `/start` → `<StartPage />` (protegida)
5. Rota `/game` → `<GamePage />` (protegida)
6. Rota `/` → `<Navigate to="/start" replace />`
7. Rota `*` → `<Navigate to="/start" replace />`

**Done when**:

- [ ] 3 rotas definidas: `/login`, `/start`, `/game`
- [ ] `/start` e `/game` são protegidas via `<ProtectedRoute>`
- [ ] `/` e `*` redirecionam para `/start`
- [ ] Sem erros de TypeScript

**Verify**:

```bash
cd frontend && npx tsc --noEmit
# Zero errors
```

**Commit**: `feat(frontend): configure React Router with protected routes`

---

### T8: Create LoginPage Component [P]

**What**: Formulário de login com campo de apelido, validação client-side, integração API e redirect
**Where**: `frontend/src/pages/LoginPage.tsx`
**Depends on**: T5, T7
**Requirement**: FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05, FRONT-06

**Steps**:

1. State: `nickname`, `error`, `loading`
2. `useEffect` on mount: se `isAuthenticated()` → `navigate('/start')`
3. Validação client-side: não-vazio, não-whitespace-only, max 30 chars
4. `handleSubmit`: validar → `api.post('/auth/login', { nickname })` → `setToken` + `setNickname` → `navigate('/start')`
5. Tratamento de erro: catch → extrair mensagem → `setError`
6. Tratamento de erro de rede: "Erro de conexão com o servidor"
7. Layout: formulário centralizado com card styling (Tailwind)
8. Botão desabilitado durante loading

**Done when**:

- [ ] Form renderiza com input de nickname e botão submit
- [ ] Validação bloqueia envio de campo vazio, whitespace-only e >30 chars
- [ ] POST `/auth/login` é chamado com `{ nickname }` no submit válido
- [ ] Token e nickname são salvos em localStorage após sucesso
- [ ] Redirect para `/start` após login bem-sucedido
- [ ] Redirect para `/start` se já autenticado (on mount)
- [ ] Erro da API exibido inline no formulário
- [ ] Erro de rede exibe mensagem amigável
- [ ] Botão desabilitado durante loading
- [ ] Layout centralizado com estilo card (Tailwind)
- [ ] Sem erros de TypeScript

**Verify**:

```bash
cd frontend && npx tsc --noEmit
# Zero errors
# Manual: abrir http://localhost:3000/login → testar fluxo completo
```

**Commit**: `feat(frontend): add LoginPage with validation and API integration`

---

### T9: Create StartPage Component [P]

**What**: Tela de boas-vindas com botão "Iniciar Jogo" e integração com POST /game/start
**Where**: `frontend/src/pages/StartPage.tsx`
**Depends on**: T5, T7
**Requirement**: FRONT-07, FRONT-08, FRONT-09, FRONT-10

**Steps**:

1. State: `error`, `loading`
2. Exibir `"Bem-vindo, {nickname}!"` usando `getNickname()`
3. Botão "Iniciar Jogo" centralizado
4. `handleStart`: `api.post('/game/start')` → `navigate('/game')` on success
5. Erro: catch → extrair mensagem → `setError`
6. Erro de rede: "Erro de conexão com o servidor"
7. Botão desabilitado + feedback visual durante loading
8. Layout centralizado com Tailwind

**Done when**:

- [ ] Exibe welcome message com nickname do jogador
- [ ] Botão "Iniciar Jogo" envia POST `/game/start` com JWT
- [ ] Redirect para `/game` após sucesso
- [ ] Erro da API exibido na tela
- [ ] Erro de rede exibe mensagem amigável
- [ ] Botão desabilitado durante loading (previne double-click)
- [ ] Layout centralizado com estilo consistente (Tailwind)
- [ ] Sem erros de TypeScript

**Verify**:

```bash
cd frontend && npx tsc --noEmit
# Zero errors
# Manual: login → /start → clicar "Iniciar Jogo" → verificar redirect para /game
```

**Commit**: `feat(frontend): add StartPage with game start integration`

---

### T10: Create GamePage Placeholder [P]

**What**: Página placeholder para a rota `/game` com mensagem e nickname
**Where**: `frontend/src/pages/GamePage.tsx`
**Depends on**: T4
**Requirement**: FRONT-20

**Steps**:

1. Exibir: `"Jogo iniciado! O tabuleiro será renderizado em breve."`
2. Exibir nickname do jogador via `getNickname()`
3. Layout centralizado com Tailwind — consistente com outras telas

**Done when**:

- [ ] Exibe placeholder text conforme spec
- [ ] Exibe nickname do jogador
- [ ] Layout centralizado e consistente
- [ ] Sem erros de TypeScript

**Verify**:

```bash
cd frontend && npx tsc --noEmit
# Zero errors
```

**Commit**: `feat(frontend): add GamePage placeholder`

---

### T11: Apply Consistent Styling + Dark Theme

**What**: Estilização consistente entre telas — dark theme, cores do quiz, polimento visual
**Where**: `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/StartPage.tsx`, `frontend/src/pages/GamePage.tsx`, `frontend/src/index.css`
**Depends on**: T8, T9, T10
**Requirement**: FRONT-17, FRONT-18, FRONT-19

**Steps**:

1. Definir paleta escura consistente: `bg-gray-900` fundo, `bg-gray-800` cards, `text-white` texto principal
2. Inputs: `bg-gray-700 border-gray-600 text-white focus:ring-indigo-500`
3. Botão primário: `bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50`
4. Erros: `text-red-400` abaixo do input
5. Validar consistência visual entre LoginPage, StartPage e GamePage
6. Adicionar body background em `index.css` ou `main.tsx` via classe

**Done when**:

- [ ] Todas as telas usam dark theme consistente (bg-gray-900 base)
- [ ] Cards com padding, rounded, shadow
- [ ] Botões com hover states e disabled styling
- [ ] Erros em vermelho abaixo dos inputs
- [ ] Visual polido e profissional (inspeção visual)

**Verify**:

```bash
cd frontend && npm run build
# Build sem erros
# Manual: inspecionar visualmente /login, /start, /game — tema escuro consistente
```

**Commit**: `style(frontend): apply consistent dark theme across pages`

---

### T12: CORS/Proxy Validation + Full Flow Test

**What**: Verificar que frontend comunica corretamente com backend (CORS, JWT flow, redirects)
**Where**: Nenhum arquivo novo — validation task
**Depends on**: T11
**Requirement**: All FRONT-*

**Steps**:

1. Iniciar backend: `cd backend && npm run start:dev`
2. Iniciar frontend: `cd frontend && npm run dev -- --port 3000`
3. Testar fluxo: `/login` → digitar nickname → submit → verificar token no localStorage
4. Verificar redirect para `/start` com mensagem de boas-vindas
5. Clicar "Iniciar Jogo" → verificar POST com JWT → redirect `/game`
6. Verificar placeholder na tela de jogo
7. Limpar localStorage → navegar para `/start` → verificar redirect para `/login`
8. Verificar no DevTools Network: header Authorization presente nas requests

**Done when**:

- [ ] Login fluxo completo funciona (nickname → token → redirect)
- [ ] Start game fluxo funciona (botão → POST com JWT → redirect)
- [ ] GamePage placeholder exibido
- [ ] Rotas protegidas redirecionam quando não autenticado
- [ ] CORS não bloqueia requests
- [ ] JWT header presente automaticamente

**Verify**:

```bash
# Terminal 1:
cd backend && npm run start:dev
# Terminal 2:
cd frontend && npm run dev -- --port 3000
# Browser: http://localhost:3000/login → full flow test
```

**Commit**: `test(frontend): validate full flow login → start → game`

---

### T13: Fix Issues + Final Build Verification

**What**: Corrigir quaisquer problemas encontrados no T12 e validar build de produção
**Where**: Quaisquer arquivos com bugs identificados no T12
**Depends on**: T12
**Requirement**: All FRONT-*

**Steps**:

1. Corrigir quaisquer bugs encontrados no fluxo E2E (T12)
2. Executar `npm run build` — verificar que build de produção compila sem erros
3. Executar `npx tsc --noEmit` — zero erros de TypeScript
4. Executar `npm run lint` — zero erros de lint (se eslint configurado)
5. Atualizar requirement traceability no spec se necessário

**Done when**:

- [ ] Todos os bugs do T12 corrigidos
- [ ] `npm run build` compila sem erros
- [ ] `npx tsc --noEmit` zero erros
- [ ] Fluxo completo login → start → game funciona end-to-end

**Verify**:

```bash
cd frontend && npm run build && npx tsc --noEmit
# Zero errors em ambos
```

**Commit**: `fix(frontend): resolve integration issues and verify build`

---

## Parallel Execution Map

```
Phase 1 (Sequential — Scaffold):
  T1 ──→ T2 ──→ T3

Phase 2 (Sequential — Services):
  T4 ──→ T5

Phase 3 (Router + Pages — Parallel):
  T6 ──→ T7, then:
    ├── T8  [P] (LoginPage)
    ├── T9  [P] (StartPage)
    └── T10 [P] (GamePage)

Phase 4 (Integration — Sequential):
  T11 ──→ T12 ──→ T13
```

---

## Task Granularity Check

| Task                                 | Scope          | Status        |
| ------------------------------------ | -------------- | ------------- |
| T1: Scaffold React+Vite project     | 1 project init | ✅ Granular   |
| T2: Configure Tailwind CSS          | 1 config       | ✅ Granular   |
| T3: Env config + project structure   | 1 config + dirs| ✅ Granular   |
| T4: Auth helpers (auth.ts)           | 1 module       | ✅ Granular   |
| T5: Axios instance (api.ts)          | 1 module       | ✅ Granular   |
| T6: ProtectedRoute component         | 1 component    | ✅ Granular   |
| T7: React Router config (App.tsx)    | 1 config       | ✅ Granular   |
| T8: LoginPage component             | 1 component    | ⚠️ Dense (validation+API+UI) but cohesive single page |
| T9: StartPage component             | 1 component    | ✅ Granular   |
| T10: GamePage placeholder            | 1 component    | ✅ Granular   |
| T11: Consistent styling/dark theme   | styling pass   | ✅ Granular   |
| T12: CORS/flow validation            | validation     | ✅ Granular   |
| T13: Fix issues + final build        | bugfix + build | ✅ Granular   |

---

## Requirement Traceability

| Requirement | Task(s)    | Coverage |
| ----------- | ---------- | -------- |
| FRONT-01    | T8         | ✅       |
| FRONT-02    | T8         | ✅       |
| FRONT-03    | T4, T8     | ✅       |
| FRONT-04    | T8         | ✅       |
| FRONT-05    | T8         | ✅       |
| FRONT-06    | T4, T8     | ✅       |
| FRONT-07    | T9         | ✅       |
| FRONT-08    | T9         | ✅       |
| FRONT-09    | T9         | ✅       |
| FRONT-10    | T9         | ✅       |
| FRONT-11    | T7         | ✅       |
| FRONT-12    | T6         | ✅       |
| FRONT-13    | T7         | ✅       |
| FRONT-14    | T5         | ✅       |
| FRONT-15    | T5         | ✅       |
| FRONT-16    | T3, T5     | ✅       |
| FRONT-17    | T8, T9, T11| ✅       |
| FRONT-18    | T8, T9, T11| ✅       |
| FRONT-19    | T2, T11    | ✅       |
| FRONT-20    | T10        | ✅       |

**Coverage:** 20/20 requirements mapped ✅
