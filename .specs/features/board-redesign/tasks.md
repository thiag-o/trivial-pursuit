# Board Redesign — Tasks

**Feature ID:** BOARD-REDESIGN
**Created:** 2026-03-30

---

## Task List

### T1 — Backend: board.config.ts — nova topologia e movimento

**What:** Reescrever `board.config.ts` com anel de 42 tiles, 6 HQs nas posições 7/14/21/28/35/42, 30 spoke tiles (43–72) e novo `getValidDestinations` spoke-aware.
**Files:** `backend/src/game/board.config.ts`
**Depends on:** —
**Done when:**

- [ ] CIRCULAR_END = 42
- [ ] HQ_POSITIONS = {7, 14, 21, 28, 35, 42}
- [ ] SPOKES array com tiles 43-72
- [ ] SPOKE_TILE_MAP para O(1) lookup
- [ ] buildTiles() gera 73 tiles (hub + 42 anel + 30 spoke)
- [ ] getValidDestinations(0, D) retorna 6 destinos (um por spoke)
- [ ] getValidDestinations(spokePos, D) retorna direções toward-hub e toward-ring
- [ ] getValidDestinations(ringPos, D) retorna forward/backward + spoke entry se HQ
- [ ] isValidPosition aceita 0–72
      **Commit:** `feat(game): redesign board — 42-tile ring + navigable spokes`

---

### T2 — Backend: board.config.spec.ts — novos testes

**What:** Atualizar todos os testes para refletir o novo layout (42 tiles, novas posições HQ, navegação de spokes).
**Files:** `backend/src/game/board.config.spec.ts`
**Depends on:** T1
**Done when:**

- [ ] Testes verificam HQ nas posições 7, 14, 21, 28, 35, 42
- [ ] Testes verificam spoke tiles (43–72) com categoria correta
- [ ] Testes verificam getValidDestinations do hub (6 destinos)
- [ ] Testes verificam navegação forward/backward/spoke de HQ ring tile
- [ ] Testes verificam navegação bi-direcional de spoke tile
- [ ] Testes verificam wrap-around do anel de 42 tiles
- [ ] `npm run test` passa sem erros
      **Commit:** `test(game): update board specs for 42-tile ring + spoke navigation`

---

### T3 — Frontend: board-data.ts — new tile definitions

**What:** Atualizar `board-data.ts` com novos HQ_POSITIONS, exportar SPOKES e gerar 73 TileDef[] (hub + 42 anel + 30 spoke tiles).
**Files:** `frontend/src/game/board-data.ts`
**Depends on:** —
**Done when:**

- [ ] HQ_POSITIONS = {7, 14, 21, 28, 35, 42}
- [ ] ROLL_AGAIN_POSITIONS removido (set vazio ou constante eliminada)
- [ ] SPOKES exportado com mesma topologia do backend
- [ ] buildTiles() gera: hub(0), ring(1-42), spoke tiles(43-72) como TileDef[]
- [ ] Spoke tiles têm type='category' e category = category do spoke
      **Commit:** `feat(board): update board-data for 42-tile ring + spoke tiles`

---

### T4 — Frontend: board-layout.ts — spoke tile positions

**What:** Atualizar `calculateBoardLayout` para 42-tile ring (angleStep = 2π/42) e adicionar posições visuais dos 30 spoke tiles.
**Files:** `frontend/src/game/board-layout.ts`
**Depends on:** T3
**Done when:**

- [ ] angleStep = (2 \* Math.PI) / 42
- [ ] Ring loop: i = 1..42
- [ ] Spoke tiles adicionados ao array tiles[] com posições interpoladas entre HQ e center
- [ ] Spoke angular sector corretamente calculado para 6 HQs espaçados uniformemente
      **Commit:** `feat(board): update layout for 42-tile ring + spoke tile positions`

---

### T5 — Frontend: turn-logic.ts — spoke-aware movement

**What:** Atualizar `getValidDestinations` para espelhar exatamente o algoritmo do backend: ring (42 tiles), hub (6 spoke destinos), spoke tiles (toward-hub/toward-ring), HQ ring (ring + spoke entry).
**Files:** `frontend/src/game/turn-logic.ts`
**Depends on:** T3
**Done when:**

- [ ] CIRCULAR_END = 42
- [ ] SPOKE_TILE_MAP construído a partir de SPOKES
- [ ] getValidDestinations(0, D) retorna 6 destinos
- [ ] getValidDestinations(spokeTile, D) retorna movimentação bidirecional
- [ ] getValidDestinations(hqTile, D) retorna ring + spoke entry
- [ ] getValidDestinations(regularRing, D) retorna apenas forward/backward
      **Commit:** `feat(turn): spoke-aware movement logic (42-tile ring)`

---

### T6 — Frontend: BoardRenderer.ts — render spoke tiles

**What:** Atualizar `drawRingTiles` para iterar 1..42, remover referência a ROLL_AGAIN_POSITIONS, e adicionar `drawSpokeTiles` para renderizar os 30 spoke tiles (43–72) sobre as linhas de raio.
**Files:** `frontend/src/game/pixi/BoardRenderer.ts`
**Depends on:** T3, T4
**Done when:**

- [ ] drawRingTiles itera i = 1..42 (não mais 1..72)
- [ ] Nenhuma referência a ROLL_AGAIN_POSITIONS
- [ ] drawSpokeTiles renderiza tiles 43–72 como category tiles coloridos com a cor do spoke
- [ ] render() chama drawSpokeTiles após drawRingTiles
- [ ] Highlights funcionam para spoke tiles (mesma lógica existente, baseia em position)
      **Commit:** `feat(board): render spoke tiles in BoardRenderer`
