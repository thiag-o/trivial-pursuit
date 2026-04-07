# Spoke Diameter Navigation Rules — Design

**Feature ID:** SPOKE-NAV-RULES
**Spec:** `.specs/features/spoke-nav-rules/spec.md`
**Created:** 2026-03-30
**Status:** Approved

---

## Architecture Overview

A mudança é cirúrgica e simétrica: apenas o branch `idx + D > 5` (overshoot toward hub) da **CASE 2**
de `getValidDestinations` precisa ser adicionado. Nenhuma interface, nenhum tipo, nenhuma API muda.

```
Backend                                    Frontend
───────────────────────────────            ──────────────────────────────
board.config.ts                            turn-logic.ts
  getValidDestinations()                     getValidDestinations()
    CASE 2 (spoke tile)                        CASE 2 (spoke tile)
      toward-hub branch                          toward-hub branch
        [existente] idx+D ≤ 4 → own              [existente] idx+D ≤ 4 → own
        [existente] idx+D == 5                    [existente] idx+D == 5
                    → hub (canAccessHub)                      → hub (canAccessHub)
        [NOVO] idx+D > 5                          [NOVO] idx+D > 5
               → SPOKES[opp].tiles[5-k]                  → SPOKES[opp].tiles[5-k]

board.config.spec.ts                       (frontend: sem testes unitários de turn-logic.ts)
  [NOVO] testes para SDN-01
```

Nenhuma outra camada é afetada: `game.service.ts`, `GamePage.tsx`, `GameHUD`, tokens, HUD — inalterados.

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component                     | Location                            | How to Use                                                                              |
| ----------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `SPOKES` array                | `board.config.ts` / `board-data.ts` | Acessar `SPOKES[oppSpokeIndex].tiles[5-k]` diretamente                                  |
| `SPOKE_TILE_MAP`              | `board.config.ts` / `turn-logic.ts` | Já faz lookup de `{ spokeIndex, tileIndex }` — reusar `spokeIndex` para calcular oposto |
| `getValidDestinations` CASE 2 | ambos os arquivos                   | Adicionar apenas 3 linhas no branch toward-hub                                          |

### Integration Points

| System                              | Integration Method                                                      |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `game.service.ts` `.move()`         | Sem mudança — já chama `getValidDestinations(from, dice, canAccessHub)` |
| `game.service.ts` `.playBotTurns()` | Sem mudança — bots também se beneficiam do novo overshoot               |
| `GamePage.tsx` `handleRollDice`     | Sem mudança — já passa `canAccessHub` corretamente                      |

---

## Components

### board.config.ts (Backend)

- **Purpose:** Computar destinos válidos de movimentação para qualquer posição + dado
- **Location:** `backend/src/game/board.config.ts`
- **Change:** 3 linhas adicionadas ao branch toward-hub do CASE 2

```typescript
// ANTES — branch toward-hub (CASE 2 — spoke tile):
if (idx + D <= 4) {
  destinations.push(spoke.tiles[idx + D]);
} else if (idx + D === 5 && canAccessHub) {
  destinations.push(HUB_POSITION);
}
// idx + D > 5 → silenciosamente descartado (bug de UX)

// DEPOIS:
if (idx + D <= 4) {
  destinations.push(spoke.tiles[idx + D]);
} else if (idx + D === 5 && canAccessHub) {
  destinations.push(HUB_POSITION);
} else if (idx + D > 5) {
  const k = idx + D - 5; // passos além do hub (1..5 com d6)
  const oppSpokeIndex = (spokeIndex + 3) % 6; // raio oposto (180°)
  destinations.push(SPOKES[oppSpokeIndex].tiles[5 - k]);
}
```

- **Reuses:** `SPOKES`, `spokeIndex` (já disponível no escopo), `HUB_POSITION` (inalterado)

---

### turn-logic.ts (Frontend)

- **Purpose:** Espelho exato do `getValidDestinations` do backend para cálculo client-side
- **Location:** `frontend/src/game/turn-logic.ts`
- **Change:** Idêntica às 3 linhas do backend (espelhar)

```typescript
// Mesmas 3 linhas, mesmo import de SPOKES já existente:
} else if (idx + D > 5) {
  const k = idx + D - 5;
  const oppSpokeIndex = (spokeIndex + 3) % 6;
  destinations.push(SPOKES[oppSpokeIndex].tiles[5 - k]);
}
```

- **Reuses:** `SPOKES` (já importado de `./board-data`), `spokeIndex` (já disponível no escopo)

---

### board.config.spec.ts (Backend Tests)

- **Purpose:** Verificar o comportamento do novo overshoot + confirmar que SDN-02/03 ainda funcionam
- **Location:** `backend/src/game/board.config.spec.ts`
- **Testes a adicionar:**

| Cenário                                      | Input                        | Expected Output (inclui)       |
| -------------------------------------------- | ---------------------------- | ------------------------------ |
| SDN-01: overshoot mínimo (idx=4, D=2)        | `getValidDest(47, 2, false)` | `62` (SPOKES[3].tiles[4])      |
| SDN-01: overshoot máximo (idx=0, D=6)        | `getValidDest(43, 6, false)` | `58` (SPOKES[3].tiles[4])      |
| SDN-01: raio 1→4 overshoot (idx=4, D=2)      | `getValidDest(52, 2, false)` | `67` (SPOKES[4].tiles[4])      |
| SDN-01: overshoot intermediário (idx=2, D=4) | `getValidDest(45, 4, false)` | `61` (SPOKES[3].tiles[2])      |
| SDN-02: hub bloqueado sem fatias             | `getValidDest(47, 1, false)` | não inclui `0`                 |
| SDN-02: hub liberado com fatias              | `getValidDest(47, 1, true)`  | inclui `0`                     |
| SDN-03: exact hub roll sem fatias            | `getValidDest(43, 5, false)` | não inclui `0`, inclui ≥1 dest |

---

## Math Verification

```
Spoke 0 (idx=4) + D=2:
  idx + D = 6 > 5 → overshoot
  k = 6 - 5 = 1
  oppSpokeIndex = (0+3)%6 = 3
  SPOKES[3].tiles[5-1] = SPOKES[3].tiles[4] = 62  ✓

Spoke 0 (idx=0) + D=6:
  idx + D = 6 > 5 → overshoot
  k = 6 - 5 = 1  (idx=0 → k = 0+6-5 = 1)
  oppSpokeIndex = 3
  SPOKES[3].tiles[4] = 62
  Toward ring: idx-D = -6 < -1, remaining = 6-0-1=5, HQ=7
    fwd = ((7-1+5)%42)+1 = 12, bwd = ((7-1-5+42)%42)+1 = 2
  Result: [62, 12, 2]  ✓

Spoke 0 (idx=2) + D=4:
  idx + D = 6 > 5 → overshoot
  k = 2+4-5 = 1
  SPOKES[3].tiles[4] = 62
  Toward ring: idx-D = -2 < -1, remaining = 4-2-1=1, HQ=7
    fwd = ((7-1+1)%42)+1 = 8, bwd = ((7-1-1+42)%42)+1 = 6
  Result: [62, 8, 6]  (correto — mas spec diz SPOKES[3].tiles[2]=60 para idx=2, D=4... deixe-me refazer)

Spoke 0 (idx=2) + D=4:
  idx + D = 6 > 5 → k = 2+4-5 = 1 → SPOKES[3].tiles[4] = 62

Spoke 0 (idx=2) + D=5:
  idx + D = 7 > 5 → k = 2+5-5 = 2 → SPOKES[3].tiles[3] = 61

Spoke 0 (idx=3) + D=4:
  idx + D = 7 > 5 → k = 3+4-5 = 2 → SPOKES[3].tiles[3] = 61

Spoke 0 (idx=2) + D=6:
  idx + D = 8 > 5 → k = 2+6-5 = 3 → SPOKES[3].tiles[2] = 60  ✓ (para tabela acima)
```

Tabela corrigida de testes:

| Cenário | Posição (Spoke,idx) | D   | k   | oppTile                          |
| ------- | ------------------- | --- | --- | -------------------------------- |
| min k   | pos 47 (S0,idx=4)   | 2   | 1   | SPOKES[3].tiles[4] = 62          |
| max k   | pos 43 (S0,idx=0)   | 6   | 1   | SPOKES[3].tiles[4] = 62          |
| k=2     | pos 46 (S0,idx=3)   | 4   | 2   | SPOKES[3].tiles[3] = 61          |
| k=3     | pos 45 (S0,idx=2)   | 6   | 3   | SPOKES[3].tiles[2] = 60          |
| k=4     | pos 43 (S0,idx=0)   | …   | …   | — (precisaria D>5 com idx=4 min) |
| k=5     | pos 47 (S0,idx=4)   | 6   | 5   | SPOKES[3].tiles[0] = 58          |

---

## Error Handling Strategy

| Error Scenario                 | Handling                                              | User Impact                   |
| ------------------------------ | ----------------------------------------------------- | ----------------------------- |
| `5 - k < 0` (k > 5)            | Impossível com d6: max k = (4+6-5)=5                  | — (defensive assert optional) |
| `oppSpokeIndex` fora de [0..5] | Impossível: `(x+3)%6` sempre ∈ [0..5]                 | —                             |
| Nenhum destino gerado          | Impossível: sempre há direção toward-ring com destino | —                             |

---

## Tech Decisions

- **Opposite spoke = `(spokeIndex + 3) % 6`**: Com 6 raios uniformemente distribuídos 60° cada, o oposto (180°) está sempre 3 posições adiante no array.
- **Transit sem bloqueio de `canAccessHub`**: O hub é somente o tile de _pouso_. Overshoot = hub é waypoint, não destino. `canAccessHub` controla apenas o pouso em posição 0.
- **k sempre ∈ [1..5] com d6**: `idx ∈ [0..4]`, `D ∈ [1..6]`, overshoot exige `idx+D>5`. Max k = 4+6-5=5, min k = 0+6-5=1. Índice `5-k` ∈ [0..4] → sempre tile válido.
