# MVP-1: Backend Base — Specification

## Problem Statement

O jogo Trivia Pursuit precisa de um backend REST que gerencie autenticação, estado de partida e perguntas. Sem ele, o frontend não tem como iniciar sessão, controlar turnos ou verificar respostas. É o alicerce de toda a aplicação.

## Goals

- [ ] API REST funcional com 3 módulos NestJS (Auth, Game, Questions)
- [ ] Autenticação JWT stateless protegendo todas as rotas (exceto login)
- [ ] Estado de jogo completo em memória (jogadores, posições, fatias, turnos)
- [ ] Perguntas em JSON estático com endpoints de busca e verificação

## Out of Scope

| Feature                                       | Reason                                        |
| --------------------------------------------- | --------------------------------------------- |
| Banco de dados / persistência                 | Decisão de escopo — estado em memória apenas  |
| WebSockets / real-time                        | MVP usa HTTP REST; multiplayer real é Fase 2+ |
| Lógica de tabuleiro (grafo, destinos válidos) | Pertence ao MVP-4 (Lógica de Turno)           |
| Oponentes simulados (IA, turnos automáticos)  | Pertence ao MVP-6                             |
| Frontend / UI                                 | Pertence ao MVP-2                             |

---

## User Stories

### P1: Autenticação por Apelido ⭐ MVP

**User Story**: As a player, I want to log in with a nickname so that I get a session token to play.

**Why P1**: Sem autenticação, nenhuma rota funciona. É pré-requisito de tudo.

**Acceptance Criteria**:

1. WHEN POST /auth/login with `{ "nickname": "Thiago" }` THEN system SHALL return `{ "token": "<JWT>" }` with HTTP 201
2. WHEN POST /auth/login with `{ "nickname": "" }` or missing nickname THEN system SHALL return HTTP 400 with error message
3. WHEN JWT is decoded THEN payload SHALL contain `nickname` and `exp` (expiração de 2 horas)
4. WHEN request to any protected route without Authorization header THEN system SHALL return HTTP 401
5. WHEN request with expired or malformed JWT THEN system SHALL return HTTP 401

**Independent Test**: `curl -X POST localhost:3001/auth/login -H "Content-Type: application/json" -d '{"nickname":"Test"}' → 201 + token`

---

### P1: Inicializar Partida ⭐ MVP

**User Story**: As an authenticated player, I want to start a new game so that a match is created with my player and simulated opponents.

**Why P1**: Sem estado de jogo, não há partida para jogar.

**Acceptance Criteria**:

1. WHEN POST /game/start with valid JWT THEN system SHALL create game state with 1 human player + N simulated opponents (N from request, default 3, range 1-5)
2. WHEN game is created THEN all players SHALL start at hub central (position 0) with 0 wedges
3. WHEN game is created THEN system SHALL return game state: `{ gameId, players[], currentPlayer, status: "started" }`
4. WHEN POST /game/start with invalid number of opponents (0 or >5) THEN system SHALL return HTTP 400
5. WHEN POST /game/start without valid JWT THEN system SHALL return HTTP 401

**Independent Test**: Login → use token → POST /game/start → verify response contains players array with correct count

---

### P1: Rolar Dado ⭐ MVP

**User Story**: As a player in an active game, I want to roll the dice so that I get a random value to determine movement.

**Why P1**: O dado é o motor de cada turno.

**Acceptance Criteria**:

1. WHEN POST /game/roll-dice with valid JWT and active game THEN system SHALL return `{ value: 1-6 }` with random integer
2. WHEN it's not the human player's turn THEN system SHALL return HTTP 400 with "Not your turn"
3. WHEN no active game exists THEN system SHALL return HTTP 400 with "No active game"
4. WHEN roll-dice is called and player already rolled this turn THEN system SHALL return HTTP 400

**Independent Test**: Start game → POST /game/roll-dice → verify value is 1-6

---

### P1: Mover Peça ⭐ MVP

**User Story**: As a player who rolled the dice, I want to move my piece to a valid position so that the game progresses.

**Why P1**: Movimentação é a ação central do jogo.

**Acceptance Criteria**:

1. WHEN POST /game/move with `{ "targetPosition": N }` THEN system SHALL validate the position and update player position
2. WHEN move is valid THEN system SHALL return updated game state including: new position, tile type (color/category, HQ, rollAgain, hub)
3. WHEN targetPosition is not a valid destination for the dice roll THEN system SHALL return HTTP 400
4. WHEN player hasn't rolled dice yet THEN system SHALL return HTTP 400
5. WHEN tile type is "rollAgain" THEN game state SHALL indicate player rolls again

**Independent Test**: Roll dice → POST /game/move with valid position → verify position updated

---

### P1: Buscar Pergunta por Categoria ⭐ MVP

**User Story**: As the game system, I want to fetch a question by category so that the player can answer after landing on a tile.

**Why P1**: Perguntas são o core mechanic do jogo.

**Acceptance Criteria**:

1. WHEN GET /questions/:category with valid category THEN system SHALL return a random question with `{ id, category, question, answers[4] }` (without correctAnswer)
2. WHEN category is invalid THEN system SHALL return HTTP 400 with valid categories list
3. WHEN questions exist THEN system SHALL not repeat the same question for the same player in the same game (if enough questions available)
4. WHEN valid categories are requested THEN system SHALL support: geography, entertainment, history, art, science, sports

**Independent Test**: `GET /questions/geography` → verify question object with 4 answers, no correctAnswer exposed

---

### P1: Verificar Resposta ⭐ MVP

**User Story**: As a player, I want to submit my answer so that the system tells me if I'm correct.

**Why P1**: Sem verificação de resposta, o jogo não avança.

**Acceptance Criteria**:

1. WHEN POST /questions/:id/answer with `{ "answerId": "c" }` THEN system SHALL return `{ "correct": true/false, "correctAnswer": "c" }`
2. WHEN question id doesn't exist THEN system SHALL return HTTP 404
3. WHEN answerId is not one of [a, b, c, d] THEN system SHALL return HTTP 400
4. WHEN answer is correct and tile is HQ and player doesn't have that wedge THEN game state SHALL add wedge to player
5. WHEN answer is correct THEN game state SHALL allow player to roll again
6. WHEN answer is incorrect THEN game state SHALL advance to next player's turn

**Independent Test**: Get question → POST answer → verify correct/incorrect and game state update

---

### P2: JWT Guard Global

**User Story**: As the system, I want all routes except login to be protected by JWT so that unauthorized access is blocked.

**Why P2**: Segurança é importante mas funcional apenas se Auth funciona (P1).

**Acceptance Criteria**:

1. WHEN any route except POST /auth/login is called without JWT THEN system SHALL return HTTP 401
2. WHEN JWT secret is loaded THEN it SHALL come from environment variable `JWT_SECRET`
3. WHEN CORS is configured THEN system SHALL accept requests only from frontend origin (configurable via env)

**Independent Test**: Call any game/questions route without token → 401; with valid token → success

---

### P2: Validação de Input

**User Story**: As the system, I want to validate all incoming data so that invalid payloads don't corrupt game state.

**Why P2**: Previne erros difíceis de debugar, mas não bloqueia fluxo básico.

**Acceptance Criteria**:

1. WHEN nickname contains only whitespace THEN system SHALL reject with HTTP 400
2. WHEN nickname exceeds 30 characters THEN system SHALL reject with HTTP 400
3. WHEN request body is missing required fields THEN system SHALL return HTTP 400 with specific field errors
4. WHEN targetPosition is not a valid integer THEN system SHALL return HTTP 400

**Independent Test**: Send malformed payloads to each endpoint → verify 400 with descriptive errors

---

## Edge Cases

- WHEN server restarts THEN all game state SHALL be lost (accepted limitation — documented)
- WHEN player tries to start a second game while one is active THEN system SHALL return HTTP 400 "Game already in progress"
- WHEN all questions of a category have been used THEN system SHALL reset the pool for that category
- WHEN POST /questions/:id/answer is called for a question not currently active THEN system SHALL return HTTP 400

---

## Requirement Traceability

| Requirement ID | Story                                       | Phase   | Task(s)          | Status  |
| -------------- | ------------------------------------------- | ------- | ---------------- | ------- |
| AUTH-01        | P1: Autenticação — login endpoint           | Execute | T9               | Planned |
| AUTH-02        | P1: Autenticação — JWT generation           | Execute | T9               | Planned |
| AUTH-03        | P1: Autenticação — token validation         | Execute | T7               | Planned |
| AUTH-04        | P2: JWT Guard — global protection           | Execute | T5, T8           | Planned |
| AUTH-05        | P2: JWT Guard — env secret + CORS           | Execute | T2, T8           | Planned |
| GAME-01        | P1: Inicializar Partida — create state      | Execute | T10, T11, T16    | Planned |
| GAME-02        | P1: Inicializar Partida — player setup      | Execute | T10, T11         | Planned |
| GAME-03        | P1: Rolar Dado — random 1-6                 | Execute | T11, T16         | Planned |
| GAME-04        | P1: Rolar Dado — turn validation            | Execute | T11              | Planned |
| GAME-05        | P1: Mover Peça — position update            | Execute | T4, T11, T12, T16 | Planned |
| GAME-06        | P1: Mover Peça — tile type response         | Execute | T4, T11          | Planned |
| QUEST-01       | P1: Buscar Pergunta — by category           | Execute | T14, T15, T17    | Planned |
| QUEST-02       | P1: Buscar Pergunta — no repeat             | Execute | T13, T15         | Planned |
| QUEST-03       | P1: Verificar Resposta — correct/incorrect  | Execute | T15, T17         | Planned |
| QUEST-04       | P1: Verificar Resposta — wedge + turn logic | Execute | T15, T18         | Planned |
| VAL-01         | P2: Validação — nickname rules              | Execute | T6               | Planned |
| VAL-02         | P2: Validação — payload validation          | Execute | T2, T12          | Planned |

**Coverage:** 17/17 requirements mapped to tasks ✅

---

## Success Criteria

- [ ] Fluxo completo via curl/Postman: login → start → roll → move → question → answer funciona sem erros
- [ ] Todas as rotas (exceto login) retornam 401 sem token
- [ ] 6 categorias com ao menos 1 pergunta cada no JSON
- [ ] Respostas da API em ≤ 200ms
- [ ] Testes unitários cobrindo lógica de estado do jogo
