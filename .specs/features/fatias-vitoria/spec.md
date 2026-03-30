# MVP-5: Fatias e Vitória — Specification

## Problem Statement

O fluxo de turno (MVP-4) permite rolar dado, mover, responder perguntas e receber feedback de acerto/erro, mas as consequências de longo prazo estão ausentes: acertar em casa HQ não conquista fatia visualmente, o Hub Central não diferencia jogador com ou sem 6 fatias, não existe Desafio Final, e o jogo nunca termina com vitória ou derrota. Sem fatias e condição de vitória, a partida é um loop infinito sem objetivo.

## Goals

- [ ] Jogador conquista fatia visual ao acertar em casa HQ (sem duplicata)
- [ ] Hub Central diferencia comportamento: sem 6 fatias → escolha de categoria; com 6 fatias → Desafio Final
- [ ] Desafio Final no Hub Central: categoria escolhida pelo sistema, acerto = vitória, erro = sair do hub
- [ ] Tela de vitória exibida ao vencer o Desafio Final
- [ ] Tela de derrota exibida se um oponente vencer (preparação para MVP-6)
- [ ] HUD exibe fatias conquistadas por cada jogador em tempo real

## Out of Scope

| Feature                                                       | Reason                                  |
| ------------------------------------------------------------- | --------------------------------------- |
| Oponentes simulados jogando turnos                            | Pertence ao MVP-6 (Oponentes Simulados) |
| Animação avançada de conquista de fatia (partículas, efeitos) | Pertence a Fase 2 (F2-2)                |
| Efeitos sonoros de vitória/derrota                            | Pertence a Fase 2 (F2-3)                |
| Timer de resposta no Desafio Final                            | Pertence a Fase 2 (F2-4)                |
| Ranking de jogadores na tela de vitória                       | Pode ser adicionado em Fase 2           |
| Navegação via spokes para chegar ao hub                       | AD-013: movimento é circular-only       |
| Persistência de partida (replay, histórico)                   | Fora do escopo do MVP                   |
| Múltiplos jogadores humanos                                   | Fora do escopo do projeto               |

---

## User Stories

### P1: Conquista de Fatia em Casa HQ ⭐ MVP

**User Story**: As a player, I want to earn a wedge when I answer correctly on an HQ tile so that I can progress toward winning the game.

**Why P1**: Fatias são o mecanismo central de progresso do Trivial Pursuit — sem elas, não há objetivo.

**Acceptance Criteria**:

1. WHEN the player answers correctly on an HQ tile AND does not already have the wedge for that category THEN system SHALL add the wedge to the player's collection and display a visual confirmation (e.g., "Fatia de Geografia conquistada!")
2. WHEN the player answers correctly on an HQ tile AND already has the wedge for that category THEN system SHALL NOT add a duplicate wedge and SHALL continue the turn normally (rolar dado novamente)
3. WHEN a wedge is earned THEN the backend `processAnswer` SHALL add the category to `player.wedges[]` (existing logic) and the frontend SHALL update the HUD immediately
4. WHEN a wedge is earned THEN the player's token on the PixiJS board SHALL visually reflect the new wedge (colored segment added to the token)
5. WHEN the player answers incorrectly on an HQ tile THEN system SHALL NOT grant a wedge and SHALL end the turn normally

**Independent Test**: Move to an HQ tile (e.g., Geography HQ), answer correctly, verify HUD shows new wedge, verify token shows colored segment. Answer incorrectly on another HQ → no wedge added. Return to same HQ and answer correctly → no duplicate.

---

### P1: Hub Central sem 6 Fatias — Escolha de Categoria ⭐ MVP

**User Story**: As a player, I want to choose any category when I land on the Hub Central (without all 6 wedges) so that I can answer a question of my choice.

**Why P1**: Hub Central é uma casa especial que requer tratamento diferenciado; sem isso, o comportamento está incorreto quando o jogador cai no hub sem ter todas as fatias.

**Acceptance Criteria**:

1. WHEN the player lands on Hub Central (position 0) AND has fewer than 6 wedges THEN system SHALL display the CategoryPickerModal allowing the player to choose any of the 6 categories
2. WHEN the player selects a category from the picker THEN system SHALL fetch a question of that category and display the QuestionModal
3. WHEN the player answers correctly on Hub Central (without 6 wedges) THEN system SHALL continue the turn (rolar dado novamente) — no wedge is earned (Hub is not an HQ tile)
4. WHEN the player answers incorrectly on Hub Central (without 6 wedges) THEN system SHALL end the turn normally

**Independent Test**: Move to position 0 with 0-5 wedges → category picker appears. Select a category → question modal appears. Answer correctly → turn continues. Answer incorrectly → turn ends.

---

### P1: Hub Central com 6 Fatias — Desafio Final ⭐ MVP

**User Story**: As a player with all 6 wedges, I want to face a Final Challenge when I land on the Hub Central so that I can win the game.

**Why P1**: O Desafio Final é a condição de vitória — sem ele, o jogo não pode terminar.

**Acceptance Criteria**:

1. WHEN the player lands on Hub Central (position 0) AND has exactly 6 wedges THEN system SHALL initiate the Final Challenge (Desafio Final)
2. WHEN the Final Challenge begins THEN system SHALL automatically select a random category (chosen by the system per AD-002/S4) and display a notification indicating the chosen category (e.g., "Desafio Final! Categoria: História")
3. WHEN the Final Challenge category is selected THEN system SHALL fetch a question of that category and display the QuestionModal with a distinct visual theme (e.g., gold border or "DESAFIO FINAL" label)
4. WHEN the player answers correctly in the Final Challenge THEN system SHALL declare the player the winner, set `GameStatus.FINISHED`, populate `GameState.winner`, and transition to the Victory Screen
5. WHEN the player answers incorrectly in the Final Challenge THEN system SHALL display "Incorreto! Você deve sair do hub." feedback and force the player to leave the Hub Central on the next turn

**Independent Test**: Manually set 6 wedges (or earn them), move to hub → Final Challenge initiates with system-chosen category. Answer correctly → victory screen. Answer incorrectly → turn ends, player must leave hub next turn.

---

### P1: Erro no Desafio Final — Sair do Hub ⭐ MVP

**User Story**: As a player who failed the Final Challenge, I want to be forced to leave the Hub Central so that I must return and try again in a future turn.

**Why P1**: Regra oficial do Trivial Pursuit — errar no desafio final obriga o jogador a sair do centro.

**Acceptance Criteria**:

1. WHEN the player fails the Final Challenge THEN system SHALL mark the player as needing to leave the hub (backend state)
2. WHEN the player's next turn begins AND they are on Hub Central after a failed Final Challenge THEN system SHALL proceed to dice roll and valid destinations as normal — but the player MUST move away from the hub (position 0 is NOT a valid destination)
3. WHEN the player subsequently returns to Hub Central (in a later turn) THEN system SHALL initiate the Final Challenge again (same rules as first attempt)
4. WHEN the player leaves the hub after a failed challenge THEN the hub exclusion constraint SHALL be lifted (they can return normally)

**Independent Test**: Fail Final Challenge → turn ends. Next turn, roll dice → valid destinations do NOT include position 0. Move away. Future turn, reach hub again → Final Challenge triggers again.

---

### P1: Tela de Vitória ⭐ MVP

**User Story**: As a player, I want to see a Victory Screen when I win so that the game has a satisfying conclusion.

**Why P1**: Sem tela de vitória, o jogo não comunica que terminou — experiência incompleta.

**Acceptance Criteria**:

1. WHEN the player wins the game (correct answer in Final Challenge) THEN system SHALL display a Victory Screen overlay
2. WHEN the Victory Screen is displayed THEN it SHALL show: congratulatory message (e.g., "Parabéns, {nickname}! Você venceu!"), the player's 6 wedges, and a "Jogar Novamente" button
3. WHEN the player clicks "Jogar Novamente" THEN system SHALL navigate to the Start Page (`/start`) to begin a new game
4. WHEN the Victory Screen is displayed THEN the board and HUD SHALL be visible behind it (semi-transparent overlay) but non-interactive

**Independent Test**: Win the game → Victory Screen appears with nickname, 6 wedges, and "Jogar Novamente" button. Click button → navigate to /start.

---

### P1: Tela de Derrota ⭐ MVP

**User Story**: As a player, I want to see a Defeat Screen when an opponent wins so that I know the game is over.

**Why P1**: Prepara o fluxo para MVP-6 quando oponentes podem vencer. A tela precisa existir mesmo que, por ora, oponentes não joguem ativamente.

**Acceptance Criteria**:

1. WHEN an opponent wins the game (game state `status = finished` AND `winner !== current human player`) THEN system SHALL display a Defeat Screen overlay
2. WHEN the Defeat Screen is displayed THEN it SHALL show: defeat message (e.g., "{winner} venceu a partida!"), the winner's wedges, and a "Jogar Novamente" button
3. WHEN the player clicks "Jogar Novamente" THEN system SHALL navigate to the Start Page (`/start`)
4. WHEN the Defeat Screen is displayed THEN the board and HUD SHALL be visible behind it (semi-transparent overlay) but non-interactive

**Independent Test**: Manually set game state to `finished` with a bot as winner → Defeat Screen appears with bot name for MVP-6 integration readiness.

---

### P1: Backend — Lógica de Desafio Final ⭐ MVP

**User Story**: As a developer, I want the backend to handle Final Challenge logic so that victory conditions are enforced server-side.

**Why P1**: Backend é fonte da verdade — toda lógica de vitória deve ser validada no servidor.

**Acceptance Criteria**:

1. WHEN `processAnswer` is called AND the player is on Hub Central (position 0) AND has 6 wedges AND answers correctly THEN backend SHALL set `game.status = GameStatus.FINISHED` and `game.winner = player.nickname`
2. WHEN `processAnswer` is called AND the player is on Hub Central (position 0) AND has 6 wedges AND answers incorrectly THEN backend SHALL mark the player as `mustLeaveHub = true` and advance the turn
3. WHEN `move()` is called AND the player has `mustLeaveHub = true` THEN backend SHALL exclude position 0 from valid destinations
4. WHEN the player successfully moves away from Hub Central THEN backend SHALL reset `mustLeaveHub = false`
5. WHEN `TurnPhase` is evaluated for a player on Hub Central with 6 wedges THEN backend SHALL use a new phase `WAITING_FINAL_ANSWER` (or equivalent) to distinguish from normal `WAITING_ANSWER`

**Independent Test**: Call `processAnswer` with player at position 0 with 6 wedges + correct → game status `finished`, winner set. Same with incorrect → `mustLeaveHub` set. Call `move()` with `mustLeaveHub` → position 0 excluded.

---

### P2: Fatia Visual no Token PixiJS

**User Story**: As a player, I want to see wedge segments on my token in the PixiJS board so that my progress is visible directly on the board.

**Why P2**: Melhora significativamente a UX visual, mas a informação já está no HUD (P1). Token visual é enhancement.

**Acceptance Criteria**:

1. WHEN a player has wedges THEN the player's token on the board SHALL display colored segments (pie slices) corresponding to collected wedge categories
2. WHEN a new wedge is earned THEN the token SHALL visually add the new segment with a brief highlight animation (e.g., brief flash or scale pulse)
3. WHEN the token has 6 wedges THEN it SHALL display a complete "pie" with all 6 colored segments

**Independent Test**: Earn wedges progressively, verify token on board shows 1, 2, ... 6 colored segments.

---

### P2: Notificação de Fatia Conquistada

**User Story**: As a player, I want a clear notification when I earn a wedge so that the achievement feels rewarding.

**Why P2**: Melhora feedback, mas a atualização no HUD (P1) já comunica a conquista.

**Acceptance Criteria**:

1. WHEN a wedge is earned THEN system SHALL display a prominent notification (e.g., banner or toast) with the category name and color: "Fatia de {categoria} conquistada! 🎉"
2. WHEN the notification is displayed THEN it SHALL auto-dismiss after 2 seconds
3. WHEN the player already has the wedge and answers correctly on same-category HQ THEN system SHALL NOT show a wedge notification (only normal "Correto!" feedback)

**Independent Test**: Earn a wedge → notification banner appears. Earn duplicate → no notification.

---

### P3: Indicador de Progresso para Desafio Final

**User Story**: As a player, I want to know how many wedges I still need and when I should head to the Hub so that I have strategic awareness.

**Why P3**: Nice-to-have — jogador pode contar fatias no HUD, mas um indicator explícito é mais conveniente.

**Acceptance Criteria**:

1. WHEN the player has 5 wedges THEN HUD SHALL display a hint: "Falta 1 fatia! Conquiste e volte ao Hub Central."
2. WHEN the player has 6 wedges THEN HUD SHALL display: "Todas as fatias! Vá ao Hub Central para o Desafio Final."

**Independent Test**: At 5 wedges → hint visible. At 6 wedges → "go to hub" message visible.

---

## Edge Cases

- WHEN the player lands on Hub Central with 6 wedges via Roll Again chain THEN system SHALL still trigger Desafio Final (the path doesn't matter, only the final position)
- WHEN the player has `mustLeaveHub = true` and rolls a value that only reaches position 0 THEN system SHALL show no valid destinations and allow re-rolling (OR the game re-rolls automatically — see AD decision below)
- WHEN the game is already `FINISHED` and the player tries to roll dice or move THEN backend SHALL reject with a 400 error
- WHEN the Victory/Defeat Screen is showing and the player navigates away (browser back) THEN system SHALL handle gracefully (redirect to /start)
- WHEN the player reloads the page during a game THEN location state is lost; system redirects to /start (existing behavior, per AD-011)
- WHEN `processAnswer` is called on Hub Central with 6 wedges AND the question category was chosen by the system THEN the category SHALL be included in the API request (frontend sends it)

---

## Requirement Traceability

| Requirement ID | Story                                            | Phase  | Status  |
| -------------- | ------------------------------------------------ | ------ | ------- |
| WEDGE-01       | P1: Conquista de Fatia em Casa HQ                | Design | Pending |
| WEDGE-02       | P1: Conquista de Fatia em Casa HQ (duplicata)    | Design | Pending |
| WEDGE-03       | P1: Conquista de Fatia em Casa HQ (visual HUD)   | Design | Pending |
| WEDGE-04       | P1: Conquista de Fatia em Casa HQ (visual token) | Design | Pending |
| HUB-01         | P1: Hub Central sem 6 Fatias                     | Design | Pending |
| HUB-02         | P1: Hub Central sem 6 Fatias (resposta)          | Design | Pending |
| FINAL-01       | P1: Hub Central com 6 Fatias — Desafio Final     | Design | Pending |
| FINAL-02       | P1: Desafio Final — categoria sistema            | Design | Pending |
| FINAL-03       | P1: Desafio Final — acerto = vitória             | Design | Pending |
| FINAL-04       | P1: Desafio Final — erro = sair hub              | Design | Pending |
| FINAL-05       | P1: Erro no Desafio Final — exclusão hub         | Design | Pending |
| FINAL-06       | P1: Erro no Desafio Final — retorno futuro       | Design | Pending |
| WIN-01         | P1: Tela de Vitória                              | Design | Pending |
| WIN-02         | P1: Tela de Vitória — jogar novamente            | Design | Pending |
| LOSE-01        | P1: Tela de Derrota                              | Design | Pending |
| LOSE-02        | P1: Tela de Derrota — jogar novamente            | Design | Pending |
| BACK-01        | P1: Backend — processAnswer vitória              | Design | Pending |
| BACK-02        | P1: Backend — processAnswer erro final           | Design | Pending |
| BACK-03        | P1: Backend — move excluir hub                   | Design | Pending |
| BACK-04        | P1: Backend — fase desafio final                 | Design | Pending |
| TOKEN-01       | P2: Fatia Visual no Token PixiJS                 | -      | Pending |
| TOKEN-02       | P2: Fatia Visual — animação                      | -      | Pending |
| NOTIF-01       | P2: Notificação de Fatia Conquistada             | -      | Pending |
| NOTIF-02       | P2: Notificação — sem duplicata                  | -      | Pending |
| PROG-01        | P3: Indicador de Progresso                       | -      | Pending |
| PROG-02        | P3: Indicador — 6 fatias                         | -      | Pending |

**ID format:** `WEDGE-NN`, `HUB-NN`, `FINAL-NN`, `WIN-NN`, `LOSE-NN`, `BACK-NN`, `TOKEN-NN`, `NOTIF-NN`, `PROG-NN`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 26 total, 0 mapped to tasks, 26 unmapped ⚠️

---

## Success Criteria

- [ ] Jogador conquista as 6 fatias ao acertar em casas HQ distintas e vê progresso no HUD
- [ ] Hub Central sem 6 fatias permite escolha de categoria (comportamento já parcialmente existente no MVP-4)
- [ ] Hub Central com 6 fatias exibe Desafio Final com categoria aleatória
- [ ] Acerto no Desafio Final → tela de vitória com "Jogar Novamente"
- [ ] Erro no Desafio Final → jogador obrigado a sair do hub, pode retornar depois
- [ ] Tela de derrota funcional (pronta para MVP-6 quando bots podem vencer)
- [ ] Backend valida toda lógica de vitória/derrota server-side
- [ ] Zero erros bloqueantes ao completar uma partida de ponta a ponta (login → vitória)
