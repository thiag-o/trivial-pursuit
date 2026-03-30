# MVP-4: Lógica de Turno — Specification

## Problem Statement

O tabuleiro PixiJS está renderizado (MVP-3), mas o jogador não pode interagir com ele — não há dado, movimentação, perguntas ou fluxo de turno. As APIs de turno já existem no backend (`POST /game/roll-dice`, `POST /game/move`, `GET /questions/:category`, `POST /questions/:id/answer`), mas o frontend não as consome. Sem a lógica de turno completa, o jogo é apenas um tabuleiro estático sem jogabilidade.

## Goals

- [ ] Jogador humano completa um ciclo de turno completo: rolar dado → escolher destino → responder pergunta → continuar ou passar turno
- [ ] Casas válidas destacadas visualmente no tabuleiro após rolagem do dado
- [ ] Peça animada do ponto de origem ao destino selecionado
- [ ] Modal de pergunta com 4 alternativas exibido para casas de categoria, HQ e Hub Central
- [ ] Feedback visual claro de acerto (turno continua) e erro (turno passa ao próximo)
- [ ] Casas Roll Again tratadas automaticamente (nova rolagem sem pergunta)

## Out of Scope

| Feature                                     | Reason                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Conquista de fatia visual no token          | Pertence ao MVP-5 (Fatias e Vitória)                                                           |
| Desafio Final no Hub Central (com 6 fatias) | Pertence ao MVP-5                                                                              |
| Tela de vitória / derrota                   | Pertence ao MVP-5                                                                              |
| Turnos automáticos de oponentes (bots)      | Pertence ao MVP-6 (Oponentes Simulados)                                                        |
| Animação avançada de dado (física simulada) | Pertence a Fase 2 (F2-2)                                                                       |
| Efeitos sonoros (rolagem, acerto, erro)     | Pertence a Fase 2 (F2-3)                                                                       |
| Timer de resposta com contagem regressiva   | Pertence a Fase 2 (F2-4)                                                                       |
| Seleção de número de oponentes pelo jogador | Pode ser adicionado no MVP-6; por ora usa default 3                                            |
| Navegação via spokes (raios) no movimento   | Backend atual usa anel circular simples (forward/backward); spokes são visuais apenas (AD-013) |

---

## User Stories

### P1: Rolagem de Dado ⭐ MVP

**User Story**: As a player, I want to roll a dice and see the result so that I know how many spaces I can move.

**Why P1**: Primeiro passo de qualquer turno — sem rolar o dado, nada acontece.

**Acceptance Criteria**:

1. WHEN it is the human player's turn AND turnPhase is `waitingRoll` THEN system SHALL display a "Rolar Dado" button
2. WHEN the player clicks "Rolar Dado" THEN system SHALL call `POST /game/roll-dice` and display a brief dice animation (≥ 0.5s)
3. WHEN the backend returns the dice value (1-6) THEN system SHALL show the result prominently on screen
4. WHEN the dice is rolling (API call in-flight) THEN the "Rolar Dado" button SHALL be disabled to prevent double-click
5. WHEN the dice result is displayed THEN system SHALL transition to showing valid destinations on the board

**Independent Test**: Start a game, verify "Rolar Dado" button appears, click it, see animation and a number 1-6 displayed, verify button becomes disabled during roll.

---

### P1: Destinos Válidos Destacados ⭐ MVP

**User Story**: As a player, I want to see which tiles I can move to after rolling the dice so that I can make a strategic decision.

**Why P1**: Sem destaque visual, o jogador não sabe onde pode ir — experiência quebrada.

**Acceptance Criteria**:

1. WHEN the dice result is shown AND turnPhase is `waitingMove` THEN system SHALL highlight all valid destination tiles on the board
2. WHEN valid destinations are highlighted THEN system SHALL use a visually distinct effect (glow, pulsing border, or bright overlay) clearly distinguishable from normal tiles
3. WHEN valid destinations are calculated THEN system SHALL use the same adjacency logic as the backend (`getValidDestinations`: from hub position 0 → dice value positions forward; from circular position → forward and backward wrap-around)
4. WHEN exactly one valid destination exists THEN system SHALL still highlight it and wait for player selection (no auto-move)
5. WHEN destinations are highlighted THEN non-valid tiles SHALL remain in their normal visual state (not clickable for movement)

**Independent Test**: Roll a dice value of 3 from position 0 (hub), verify tile at position 3 is highlighted. Roll a 4 from position 70, verify forward (position 2, wrapping) and backward (position 66) are highlighted.

---

### P1: Seleção de Destino e Movimentação ⭐ MVP

**User Story**: As a player, I want to click a highlighted tile to move my token there so that I can advance on the board.

**Why P1**: Ato central do turno — mover a peça é a jogada em si.

**Acceptance Criteria**:

1. WHEN a valid destination tile is highlighted THEN system SHALL make it clickable/tappable
2. WHEN the player clicks a valid destination THEN system SHALL call `POST /game/move { targetPosition }` with the selected position
3. WHEN the backend confirms the move THEN system SHALL animate the player's token moving from current position to the destination tile
4. WHEN the token animation completes THEN system SHALL evaluate the tile type from the move response (`tileType`, `tileCategory`)
5. WHEN the move API call is in-flight THEN system SHALL disable further tile clicks to prevent double-move
6. WHEN the player clicks a non-highlighted tile THEN system SHALL ignore the click (no error, no action)

**Independent Test**: After rolling, click a highlighted tile, see token animate to that position, verify backend position matches.

---

### P1: Avaliação de Tipo de Casa ⭐ MVP

**User Story**: As a player, I want the game to react correctly based on the tile I land on so that the rules are enforced.

**Why P1**: Cada tipo de casa desencadeia comportamento diferente — é a lógica central do jogo.

**Acceptance Criteria**:

1. WHEN the player lands on a **Category tile** (type `category`) THEN system SHALL automatically fetch a question of that category via `GET /questions/:category`
2. WHEN the player lands on an **HQ tile** (type `hq`) THEN system SHALL automatically fetch a question of that HQ's category via `GET /questions/:category`
3. WHEN the player lands on a **Roll Again tile** (type `rollAgain`) THEN system SHALL display a brief "Role Novamente!" notification and return to dice rolling phase (no question asked)
4. WHEN the player lands on the **Hub Central** (type `hub`, position 0) THEN system SHALL display a category picker allowing the player to choose any of the 6 categories
5. WHEN the player selects a category from the Hub Central picker THEN system SHALL fetch a question of that category via `GET /questions/:category`
6. WHEN a Roll Again occurs THEN system SHALL automatically transition to `waitingRoll` phase without requiring additional player input beyond re-clicking "Rolar Dado"

**Independent Test**: Move to a category tile → question modal appears. Move to Roll Again → "Role Novamente!" shows, dice phase restarts. Move to hub → category picker appears.

---

### P1: Modal de Pergunta com 4 Alternativas ⭐ MVP

**User Story**: As a player, I want to see a question with 4 answer options and get feedback on whether I answered correctly so that I can play the trivia game.

**Why P1**: Perguntas e respostas são o núcleo do Trivial Pursuit — sem isso, não é um jogo de trivia.

**Acceptance Criteria**:

1. WHEN a question is fetched THEN system SHALL display a modal overlay with the question text and 4 answer buttons
2. WHEN the question modal is displayed THEN system SHALL show the category name and color at the top of the modal
3. WHEN the player clicks an answer THEN system SHALL call `POST /questions/:id/answer { answerId }` to validate the answer
4. WHEN the answer is **correct** THEN system SHALL display a green success indicator with "Correto!" text for ≥ 1.5 seconds
5. WHEN the answer is **incorrect** THEN system SHALL display a red error indicator with "Incorreto!" text and reveal the correct answer for ≥ 2 seconds
6. WHEN feedback is displaying THEN answer buttons SHALL be disabled (prevent changing answer)
7. WHEN the answer API is in-flight THEN all answer buttons SHALL be disabled to prevent double-submit
8. WHEN the modal is open THEN the board SHALL remain visible behind the modal (semi-transparent overlay) but non-interactive

**Independent Test**: Land on a category tile, see modal with question + 4 answers, click one, see green/red feedback with correct answer shown on error.

---

### P1: Continuação ou Fim de Turno ⭐ MVP

**User Story**: As a player, I want the game to continue my turn if I answer correctly or pass to the next player if I answer incorrectly so that the turn flow matches Trivial Pursuit rules.

**Why P1**: Sem fluxo correto de acerto/erro, o jogo não segue as regras e trava.

**Acceptance Criteria**:

1. WHEN the player answers correctly THEN system SHALL close the question modal and return to dice rolling phase (turnPhase = `waitingRoll`, same player)
2. WHEN the player answers incorrectly THEN system SHALL close the question modal, update the current player indicator, and show a "Vez de {nextPlayer}" notification
3. WHEN the turn passes to a bot (non-human player) THEN system SHALL display "Vez de {botName}" and show the "Rolar Dado" button disabled (bot turns are not playable in this MVP — they will be implemented in MVP-6)
4. WHEN a bot's turn is reached THEN system SHALL skip it and advance to the next player until the human player's turn arrives (temporary until MVP-6 implements bot logic)
5. WHEN the turn returns to the human player after bot turns are skipped THEN system SHALL show "Sua vez!" notification and enable the "Rolar Dado" button

**Independent Test**: Answer correctly → dice roll phase reappears (same player). Answer incorrectly → turn indicator changes, bots are skipped, "Rolar Dado" re-enables for human.

---

### P1: Integração com Estado do Jogo ⭐ MVP

**User Story**: As a developer, I want the frontend to stay synchronized with the backend game state so that all moves and answers are validated server-side.

**Why P1**: Sem sincronização, o frontend pode divergir do backend, causando erros e estado inconsistente.

**Acceptance Criteria**:

1. WHEN `POST /game/roll-dice` returns THEN frontend SHALL store the dice value and update turnPhase to `waitingMove`
2. WHEN `POST /game/move` returns THEN frontend SHALL update all player positions, currentPlayer, turnPhase, and tile info from the response
3. WHEN `POST /questions/:id/answer` returns THEN frontend SHALL update currentPlayer and turnPhase from `gameState` in the response
4. WHEN any API call returns a 400 error THEN frontend SHALL display the error message briefly and NOT change local state
5. WHEN the game state from backend indicates a different currentPlayerIndex THEN frontend SHALL update the HUD's current player indicator
6. WHEN the frontend calculates valid destinations locally THEN the set SHALL match what the backend would accept (mirroring `BoardConfig.getValidDestinations`)

**Independent Test**: Make moves via UI, verify backend state via direct API calls matches what the frontend displays.

---

### P2: Indicador de Fase do Turno no HUD

**User Story**: As a player, I want to see which phase of the turn I'm in (roll, move, answer) so that I know what to do next.

**Why P2**: Melhora UX mas o jogo funciona sem — o botão/modal já indicam a fase implicitamente.

**Acceptance Criteria**:

1. WHEN turnPhase is `waitingRoll` THEN HUD SHALL display "Fase: Rolar Dado" or equivalent indicator
2. WHEN turnPhase is `waitingMove` THEN HUD SHALL display "Fase: Escolher Destino" with the dice value shown
3. WHEN turnPhase is `waitingAnswer` THEN HUD SHALL display "Fase: Responder Pergunta" with the category name

**Independent Test**: Progress through a turn, verify HUD indicator changes at each phase.

---

### P2: Exibição de Fatias no HUD

**User Story**: As a player, I want to see which wedges I've collected so that I can track my progress toward winning.

**Why P2**: Fatias conquistadas são informação importante, mas a lógica de conquista visual no token é MVP-5. O HUD pode antecipar o tracking textual.

**Acceptance Criteria**:

1. WHEN the game state includes wedges for any player THEN HUD SHALL display the wedges collected by each player (as colored dots/icons matching category colors)
2. WHEN a player gains a new wedge (correct answer on HQ tile) THEN HUD SHALL update to reflect the new wedge immediately after answer feedback

**Independent Test**: Answer correctly on an HQ tile, verify HUD shows the new wedge for that player.

---

### P3: Animação Suave de Token

**User Story**: As a player, I want my token to move smoothly across the board (not teleport) so that the game feels polished.

**Why P3**: Nice-to-have polish. A peça pode "pular" instantaneamente e o jogo ainda funciona.

**Acceptance Criteria**:

1. WHEN the token moves to a new position THEN system SHALL animate it along a path (linear interpolation over ~0.5s) rather than instant teleport

**Independent Test**: Move a token, verify it visually travels from origin to destination (not instant).

---

## Edge Cases

- WHEN the player rolls a value that results in only 1 valid destination (e.g., from hub) THEN system SHALL still highlight that tile and wait for click (no auto-move)
- WHEN the roll-dice API fails (network error) THEN system SHALL show an error toast and keep the "Rolar Dado" button enabled for retry
- WHEN the move API returns 400 (invalid position) THEN system SHALL show the error message and keep destinations highlighted for re-selection
- WHEN the questions API returns no question for a category (empty pool) THEN backend resets the pool and returns a question — frontend handles this transparently
- WHEN the player refreshes the page during a turn THEN game state is lost (location.state cleared) and player is redirected to `/start` (existing behavior from MVP-3)
- WHEN multiple valid destinations include the same position (deduplication edge case) THEN system SHALL show it only once
- WHEN landing on an HQ tile for a category the player already has the wedge for THEN system SHALL still ask the question (acerto = rola de novo, but no new wedge — backend handles this logic)
- WHEN the answer response indicates a wedge was gained THEN system SHALL update the player's wedges list in local state (visual update on token deferred to MVP-5)
- WHEN all bot turns are skipped (MVP-4 temporary behavior) THEN system SHALL ensure the human player's turn resumes without extra delay (< 0.5s per bot skip)

---

## Requirement Traceability

| Requirement ID | Story                                    | Phase  | Status  |
| -------------- | ---------------------------------------- | ------ | ------- |
| TURN-01        | P1: Rolagem de Dado                      | Design | Pending |
| TURN-02        | P1: Rolagem de Dado                      | Design | Pending |
| TURN-03        | P1: Rolagem de Dado                      | Design | Pending |
| TURN-04        | P1: Rolagem de Dado                      | Design | Pending |
| TURN-05        | P1: Rolagem de Dado                      | Design | Pending |
| DEST-01        | P1: Destinos Válidos Destacados          | Design | Pending |
| DEST-02        | P1: Destinos Válidos Destacados          | Design | Pending |
| DEST-03        | P1: Destinos Válidos Destacados          | Design | Pending |
| DEST-04        | P1: Destinos Válidos Destacados          | Design | Pending |
| DEST-05        | P1: Destinos Válidos Destacados          | Design | Pending |
| MOVE-01        | P1: Seleção de Destino e Movimentação    | Design | Pending |
| MOVE-02        | P1: Seleção de Destino e Movimentação    | Design | Pending |
| MOVE-03        | P1: Seleção de Destino e Movimentação    | Design | Pending |
| MOVE-04        | P1: Seleção de Destino e Movimentação    | Design | Pending |
| MOVE-05        | P1: Seleção de Destino e Movimentação    | Design | Pending |
| MOVE-06        | P1: Seleção de Destino e Movimentação    | Design | Pending |
| TILE-01        | P1: Avaliação de Tipo de Casa            | Design | Pending |
| TILE-02        | P1: Avaliação de Tipo de Casa            | Design | Pending |
| TILE-03        | P1: Avaliação de Tipo de Casa            | Design | Pending |
| TILE-04        | P1: Avaliação de Tipo de Casa            | Design | Pending |
| TILE-05        | P1: Avaliação de Tipo de Casa            | Design | Pending |
| TILE-06        | P1: Avaliação de Tipo de Casa            | Design | Pending |
| QST-01         | P1: Modal de Pergunta com 4 Alternativas | Design | Pending |
| QST-02         | P1: Modal de Pergunta com 4 Alternativas | Design | Pending |
| QST-03         | P1: Modal de Pergunta com 4 Alternativas | Design | Pending |
| QST-04         | P1: Modal de Pergunta com 4 Alternativas | Design | Pending |
| QST-05         | P1: Modal de Pergunta com 4 Alternativas | Design | Pending |
| QST-06         | P1: Modal de Pergunta com 4 Alternativas | Design | Pending |
| QST-07         | P1: Modal de Pergunta com 4 Alternativas | Design | Pending |
| QST-08         | P1: Modal de Pergunta com 4 Alternativas | Design | Pending |
| FLOW-01        | P1: Continuação ou Fim de Turno          | Design | Pending |
| FLOW-02        | P1: Continuação ou Fim de Turno          | Design | Pending |
| FLOW-03        | P1: Continuação ou Fim de Turno          | Design | Pending |
| FLOW-04        | P1: Continuação ou Fim de Turno          | Design | Pending |
| FLOW-05        | P1: Continuação ou Fim de Turno          | Design | Pending |
| SYNC-01        | P1: Integração com Estado do Jogo        | Design | Pending |
| SYNC-02        | P1: Integração com Estado do Jogo        | Design | Pending |
| SYNC-03        | P1: Integração com Estado do Jogo        | Design | Pending |
| SYNC-04        | P1: Integração com Estado do Jogo        | Design | Pending |
| SYNC-05        | P1: Integração com Estado do Jogo        | Design | Pending |
| SYNC-06        | P1: Integração com Estado do Jogo        | Design | Pending |
| HUD-P01        | P2: Indicador de Fase do Turno no HUD    | -      | Pending |
| HUD-P02        | P2: Indicador de Fase do Turno no HUD    | -      | Pending |
| HUD-P03        | P2: Indicador de Fase do Turno no HUD    | -      | Pending |
| WEDGE-01       | P2: Exibição de Fatias no HUD            | -      | Pending |
| WEDGE-02       | P2: Exibição de Fatias no HUD            | -      | Pending |
| ANIM-01        | P3: Animação Suave de Token              | -      | Pending |

**ID format:** `TURN/DEST/MOVE/TILE/QST/FLOW/SYNC/HUD-P/WEDGE/ANIM-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 46 total, 0 mapped to tasks, 46 unmapped

---

## Success Criteria

- [ ] Jogador humano completa pelo menos 3 turnos consecutivos (rolar → mover → responder) sem erros ou travamentos
- [ ] Turno após resposta incorreta passa corretamente para o próximo jogador (bots skipped, volta ao humano)
- [ ] Turno após resposta correta permite rolar o dado novamente (mesmo jogador)
- [ ] Casa Roll Again redireciona para nova rolagem sem pergunta
- [ ] Hub Central exibe picker de categoria e pergunta funciona corretamente
- [ ] Modal de pergunta exibe 4 alternativas, feedback claro de acerto/erro, sem double-submit
- [ ] Estado do frontend permanece sincronizado com backend ao longo de 10+ turnos
