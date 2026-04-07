# Board Rules — Tasks

**Feature ID:** BOARD-RULES
**Created:** 2026-03-30

---

## Task List

### T1 — Backend: board.config.ts — spoke categories + hub guard + ring-spoke extension

**What:** Três mudanças em `board.config.ts`:

1. `buildTiles()` — spoke tiles usam `CATEGORY_CYCLE[(spokeIndex + tileIndex + 1) % 6]`
2. `getValidDestinations(from, dice, canAccessHub=false)` — novo parâmetro, hub excluído se `!canAccessHub`
3. Lógica de extensão: spoke overshoot → anel (BR-3a) e anel passando por HQ → spoke (BR-3b)

**Files:** `backend/src/game/board.config.ts`
**Depends on:** —
**Done when:**

- [ ] `buildTiles()` gera spoke tiles com `CATEGORY_CYCLE[(s + t + 1) % 6]`
- [ ] `getValidDestinations` aceita `canAccessHub = false` como 3º parâmetro
- [ ] Hub (posição 0) excluído de todos os destinos quando `!canAccessHub`
- [ ] Spoke → anel overshoot: `idx - D < -1` → `remaining` → fwd/bwd no anel
- [ ] Anel → spoke via HQ em caminho: `distFwd < D` ou `distBwd < D` → spoke dest
- [ ] Todos os retornos deduplicados via `Set`
      **Commit:** `feat(game): board rules — spoke categories, hub lock, ring-spoke extension`

---

### T2 — Backend: game.service.ts — canAccessHub + mustLeaveHub reset fix

**What:** Dois ajustes em `game.service.ts`:

1. `move()` e `playBotTurns()` calculam `canAccessHub = wedges === 6 && !mustLeaveHub` e passam para `getValidDestinations`
2. Corrigir bug: `mustLeaveHub` resetado corretamente quando jogador/bot sai do hub

**Files:** `backend/src/game/game.service.ts`
**Depends on:** T1
**Done when:**

- [ ] `move()`: `canAccessHub` computado e passado para `getValidDestinations`
- [ ] `move()`: filtro `mustLeaveHub` manual removido (substituído por `canAccessHub`)
- [ ] `move()`: bug do reset de `mustLeaveHub` corrigido (`wasAtHub` check)
- [ ] `playBotTurns()`: `canAccessHub` computado e passado
- [ ] `playBotTurns()`: filtro manual removido
- [ ] `playBotTurns()`: `mustLeaveHub` resetado após bot mover do hub
      **Commit:** `fix(game): canAccessHub param + mustLeaveHub reset bug`

---

### T3 — Backend: board.config.spec.ts — testes para as 3 novas regras

**What:** Adicionar/atualizar testes em `board.config.spec.ts` para cobrir as mudanças de BR-1, BR-2, BR-3.

**Files:** `backend/src/game/board.config.spec.ts`
**Depends on:** T1
**Done when:**

- [ ] **BR-1**: Testes verificam que spoke tile de cada raio não é da categoria da HQ (exceto coincidência de ciclo)
- [ ] **BR-1**: Testes verificam 5 categorias distintas nos 5 tiles de pelo menos um spoke
- [ ] **BR-2**: Teste: `getValidDestinations(HQ, 6, false)` NÃO inclui hub
- [ ] **BR-2**: Teste: `getValidDestinations(HQ, 6, true)` INCLUI hub
- [ ] **BR-2**: Teste: `getValidDestinations(spokeTile_idx4, 1, false)` NÃO inclui hub
- [ ] **BR-2**: Teste: `getValidDestinations(spokeTile_idx4, 1, true)` INCLUI hub
- [ ] **BR-3a**: Teste spoke overshoot: `getValidDestinations(43, 3, false)` inclui destinos de anel (idx=0, D=3, remaining=2, HQ=7, fwd=9, bwd=5)
- [ ] **BR-3b**: Teste ring passagem por HQ: tile entre duas HQs com D suficiente deve incluir spoke dest
- [ ] `npm run test` passa sem erros
      **Commit:** `test(game): add board rules tests — spoke categories, hub lock, ring-spoke extension`

---

### T4 — Frontend: board-data.ts — spoke tile categories

**What:** Mesma mudança do T1 no frontend: spoke tiles com `CATEGORY_CYCLE[(s + t + 1) % 6]`.

**Files:** `frontend/src/game/board-data.ts`
**Depends on:** —
**Done when:**

- [ ] `buildTiles()` gera spoke tiles usando o padrão rotacional
- [ ] Os 5 tiles de cada spoke têm categorias distintas
- [ ] `SPOKES[s].category` inalterado (ainda é a categoria da HQ)
      **Commit:** `feat(board): spoke tile categories — rotating cycle pattern`

---

### T5 — Frontend: turn-logic.ts — hub guard + ring-spoke extension

**What:** Espelhar exatamente as mudanças do T1 em `turn-logic.ts`: parâmetro `canAccessHub`, hub excluído se `!canAccessHub`, overshoot spoke→anel, anel passando por HQ→spoke.

**Files:** `frontend/src/game/turn-logic.ts`
**Depends on:** T4
**Done when:**

- [ ] `getValidDestinations(from, dice, canAccessHub=false)` — parâmetro adicionado
- [ ] Hub excluído nos mesmos casos que backend
- [ ] Overshoot spoke→anel implementado (idêntico ao backend)
- [ ] Anel passagem por HQ implementado (idêntico ao backend)
- [ ] `filterHubIfMustLeave` mantido (não removido — basta não chamar)
      **Commit:** `feat(turn): hub guard + ring-spoke extension (mirror backend)`

---

### T6 — Frontend: GamePage.tsx — passar canAccessHub para getValidDestinations

**What:** Em `handleRollDice`, calcular `canAccessHub` e passar para `getValidDestinations`. Remover chamada de `filterHubIfMustLeave`.

**Files:** `frontend/src/pages/GamePage.tsx`
**Depends on:** T5
**Done when:**

- [ ] `canAccessHub = currentPlayer.wedges.length === 6 && !state.mustLeaveHub`
- [ ] `getValidDestinations(from, res.value, canAccessHub)` chamado
- [ ] `filterHubIfMustLeave` não mais chamado (import pode ser mantido ou removido)
      **Commit:** `feat(game-page): use canAccessHub for valid destinations`
