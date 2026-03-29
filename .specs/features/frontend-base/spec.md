# MVP-2: Frontend Base — Specification

## Problem Statement

O backend REST está completo (MVP-1), mas não existe interface para o jogador interagir. Sem frontend, o projeto não demonstra competência fullstack e o jogo não é jogável. Precisamos das telas mínimas (Login, Iniciar Jogo) e da infraestrutura React/Axios/Router que sustentará todas as features visuais seguintes (tabuleiro, perguntas, etc.).

## Goals

- [ ] Aplicação React funcional com Vite, Tailwind CSS e React Router
- [ ] Tela de Login com campo de apelido, validação e integração POST /auth/login
- [ ] Tela de Iniciar Jogo com botão centralizado e integração POST /game/start
- [ ] Axios configurado com interceptor JWT (envio automático de token)
- [ ] Redirect automático para /login em caso de 401 ou ausência de token
- [ ] Rota /game protegida (placeholder para MVP-3+)

## Out of Scope

| Feature                                | Reason                                                  |
| -------------------------------------- | ------------------------------------------------------- |
| Tabuleiro PixiJS / renderização 2D     | Pertence ao MVP-3                                       |
| Lógica de turno (dado, movimento)      | Pertence ao MVP-4                                       |
| Telas de vitória/derrota               | Pertence ao MVP-5                                       |
| Testes unitários de componentes React  | Pertence ao MVP-7                                       |
| Responsividade mobile                  | Explicitamente fora de escopo (PROJECT.md)              |
| SSR / Server-side rendering            | Desktop SPA é suficiente para portfólio                 |
| Refresh token / rotação de JWT         | Overkill para uso local; token de 2h é suficiente       |
| Feedback visual avançado (animações)   | Pertence a Fase 2 (F2-2)                                |
| Seleção de número de oponentes na tela | Design simplificado — usar default (3) no MVP-2; seleção virá no MVP-4 |

---

## User Stories

### P1: Login com Apelido ⭐ MVP

**User Story**: As a player, I want to enter my nickname on a login screen so that I get authenticated and can play.

**Why P1**: Sem login, o jogador não obtém JWT e nenhuma outra tela funciona.

**Acceptance Criteria**:

1. WHEN player navigates to `/login` THEN system SHALL display a centered form with a nickname text input and a submit button
2. WHEN player types a valid nickname (1-30 chars, não só whitespace) and clicks submit THEN system SHALL POST to `/auth/login` with `{ "nickname": "<value>" }` and receive a JWT token
3. WHEN login succeeds THEN system SHALL store the JWT in `localStorage` under key `token` and redirect to `/start`
4. WHEN login succeeds THEN system SHALL store the nickname in `localStorage` under key `nickname` for display purposes
5. WHEN player submits empty field or whitespace-only THEN system SHALL show inline validation error without calling the API
6. WHEN player submits nickname with more than 30 characters THEN system SHALL show inline validation error
7. WHEN API returns error (e.g., 400, 500) THEN system SHALL display an error message on the form (not redirect)
8. WHEN player is already authenticated (valid token in localStorage) and navigates to `/login` THEN system SHALL redirect to `/start`

**Independent Test**: Open browser → navigate to `http://localhost:3000/login` → type nickname → submit → verify redirect to `/start` and token in localStorage

---

### P1: Tela de Iniciar Jogo ⭐ MVP

**User Story**: As an authenticated player, I want to see a start screen with a button so that I can begin a new match.

**Why P1**: É a transição obrigatória entre login e o jogo propriamente dito.

**Acceptance Criteria**:

1. WHEN authenticated player navigates to `/start` THEN system SHALL display a welcome message with the player's nickname and a centered "Iniciar Jogo" button
2. WHEN player clicks "Iniciar Jogo" THEN system SHALL POST to `/game/start` with JWT header and redirect to `/game` on success
3. WHEN POST /game/start returns error (e.g., 400 "Game already in progress") THEN system SHALL display an error message on the screen
4. WHEN unauthenticated user navigates to `/start` THEN system SHALL redirect to `/login`
5. WHEN "Iniciar Jogo" button is clicked THEN button SHALL show loading state (disabled + spinner/text) to prevent double-click

**Independent Test**: Login → arrive at `/start` → click "Iniciar Jogo" → verify POST sent with JWT and redirect to `/game`

---

### P1: React Router com Rotas Protegidas ⭐ MVP

**User Story**: As the system, I want React Router configured with 3 routes so that navigation works correctly and protected routes redirect unauthenticated users.

**Why P1**: Sem roteamento, não há navegação entre telas.

**Acceptance Criteria**:

1. WHEN app loads THEN React Router SHALL define 3 routes: `/login` (public), `/start` (protected), `/game` (protected)
2. WHEN unauthenticated user navigates to any protected route (`/start`, `/game`) THEN system SHALL redirect to `/login`
3. WHEN authenticated user navigates to `/` (root) THEN system SHALL redirect to `/start`
4. WHEN authenticated user navigates to unknown route THEN system SHALL redirect to `/start`
5. WHEN user navigates to `/game` without an active game THEN system SHALL display the `/game` route (placeholder page — game state handling will come in MVP-3+)

**Independent Test**: Clear localStorage → navigate to `/start` → verify redirect to `/login`; set valid token → navigate to `/start` → verify page loads

---

### P1: Axios com Interceptor JWT ⭐ MVP

**User Story**: As the system, I want Axios configured with a request interceptor so that every API call automatically includes the JWT token.

**Why P1**: Sem interceptor, cada chamada precisa adicionar o header manualmente — propenso a erros.

**Acceptance Criteria**:

1. WHEN any HTTP request is made via the Axios instance THEN system SHALL add `Authorization: Bearer <token>` header if token exists in localStorage
2. WHEN token does not exist in localStorage THEN system SHALL send the request without Authorization header (login endpoint doesn't need it)
3. WHEN any API response returns HTTP 401 THEN Axios response interceptor SHALL remove token from localStorage and redirect to `/login`
4. WHEN Axios instance is created THEN baseURL SHALL be configured to `http://localhost:3001` (or from env variable `VITE_API_URL`)
5. WHEN redirect to `/login` happens due to 401 THEN system SHALL NOT enter infinite redirect loop (login endpoint is public, doesn't trigger 401 interceptor)

**Independent Test**: Set valid token in localStorage → make request → verify Authorization header present in DevTools Network tab; expire token → make request → verify redirect to `/login`

---

### P2: Estilização Base Tailwind CSS

**User Story**: As a player, I want the login and start screens to look clean and professional so that the project demonstrates frontend skill.

**Why P2**: Visual importa para portfólio, mas funcionalidade vem primeiro.

**Acceptance Criteria**:

1. WHEN login screen loads THEN layout SHALL be vertically and horizontally centered with a card-style form (background, padding, border-radius, shadow)
2. WHEN start screen loads THEN layout SHALL be vertically and horizontally centered with prominent button and welcome text
3. WHEN validation error is shown THEN text SHALL be red and appear below the input field
4. WHEN button is in loading state THEN it SHALL show visual feedback (opacity change, cursor change, or spinner)
5. WHEN app renders THEN it SHALL use a consistent color scheme (dark background with contrasting elements — tema de trivia/quiz)

**Independent Test**: Visual inspection — screens look polished, centered, and consistent

---

### P3: Mensagem de Boas-vindas na Tela de Jogo (Placeholder)

**User Story**: As a player who started a game, I want to see a placeholder on the game screen so that I know the game route works before the board is built.

**Why P3**: Nice-to-have; confirma que o fluxo completo funciona end-to-end, mas MVP-3 substituirá esta tela.

**Acceptance Criteria**:

1. WHEN player navigates to `/game` after starting a game THEN system SHALL display a placeholder message: "Jogo iniciado! O tabuleiro será renderizado em breve."
2. WHEN game page loads THEN it SHALL show the player's nickname on screen

**Independent Test**: Full flow login → start → game → verify placeholder text visible

---

## Edge Cases

- WHEN localStorage is manually cleared while on `/start` or `/game` THEN next API call SHALL trigger 401 → redirect to `/login`
- WHEN backend is unreachable (network error) THEN system SHALL display a friendly error message ("Erro de conexão com o servidor") instead of crashing
- WHEN player submits login form while a request is already in-flight THEN system SHALL ignore the duplicate submission (button disabled during loading)
- WHEN JWT is malformed (not a valid JWT string) in localStorage THEN API call SHALL result in 401 → interceptor clears token → redirect to `/login`
- WHEN player refreshes the browser on `/start` THEN system SHALL remain on `/start` if token exists in localStorage
- WHEN player navigates back to `/login` after authentication THEN system SHALL redirect to `/start` (prevent re-login)

---

## Requirement Traceability

| Requirement ID | Story                                          | Phase  | Status  |
| -------------- | ---------------------------------------------- | ------ | ------- |
| FRONT-01       | P1: Login — form with nickname input           | Design | Pending |
| FRONT-02       | P1: Login — POST /auth/login integration       | Design | Pending |
| FRONT-03       | P1: Login — JWT storage in localStorage        | Design | Pending |
| FRONT-04       | P1: Login — client-side validation             | Design | Pending |
| FRONT-05       | P1: Login — API error display                  | Design | Pending |
| FRONT-06       | P1: Login — redirect if already authenticated  | Design | Pending |
| FRONT-07       | P1: Start — welcome message + start button     | Design | Pending |
| FRONT-08       | P1: Start — POST /game/start integration       | Design | Pending |
| FRONT-09       | P1: Start — error handling                     | Design | Pending |
| FRONT-10       | P1: Start — loading state on button            | Design | Pending |
| FRONT-11       | P1: Router — 3 routes definition               | Design | Pending |
| FRONT-12       | P1: Router — protected route redirect          | Design | Pending |
| FRONT-13       | P1: Router — root/unknown redirect             | Design | Pending |
| FRONT-14       | P1: Axios — request interceptor (JWT header)   | Design | Pending |
| FRONT-15       | P1: Axios — response interceptor (401 redirect)| Design | Pending |
| FRONT-16       | P1: Axios — baseURL configuration              | Design | Pending |
| FRONT-17       | P2: Styling — centered layouts                 | Design | Pending |
| FRONT-18       | P2: Styling — error display + loading states   | Design | Pending |
| FRONT-19       | P2: Styling — consistent color scheme          | Design | Pending |
| FRONT-20       | P3: Game placeholder page                      | Design | Pending |

**Coverage:** 20 total, 0 mapped to tasks, 20 unmapped ⚠️

---

## Success Criteria

- [ ] Player can type nickname, login, and see JWT stored in localStorage
- [ ] Player can click "Iniciar Jogo" and be redirected to `/game`
- [ ] Unauthenticated access to `/start` or `/game` redirects to `/login`
- [ ] All API calls include JWT header automatically
- [ ] 401 response triggers automatic redirect to `/login`
- [ ] Full flow (login → start → game) works end-to-end against running backend
