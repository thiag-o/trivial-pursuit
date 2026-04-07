# Spoke Diameter Navigation Rules — Tasks

**Feature ID:** SPOKE-NAV-RULES
**Design:** `.specs/features/spoke-nav-rules/design.md`
**Created:** 2026-03-30
**Status:** Draft

---

## Execution Plan

```
T1 ──→ T3 (testes dependem do backend pronto)
T2 ──→          (independente de T1, pode rodar em paralelo)
```

### Phase 1: Implementação (T1 e T2 em paralelo)

```
T1 (backend board.config.ts)
T2 (frontend turn-logic.ts)
```

### Phase 2: Verificação (T3 após T1)

```
T1 → T3
```

---

## Task Breakdown

### T1 — Backend: board.config.ts — spoke overshoot toward opposite spoke

**What:** Adicionar o branch `else if (idx + D > 5)` na seção toward-hub do CASE 2 de `getValidDestinations`. Quando o dado ultrapassa o hub em direção a ele a partir de um tile de spoke, o destino passa a ser o tile correspondente no raio oposto.

**Where:** `backend/src/game/board.config.ts`

**Depends on:** —

**Reuses:** `SPOKES` (já declarado no arquivo), `spokeIndex` (já disponível no scope do CASE 2)

**Requirement:** SDN-01

**Tools:**

- MCP: NONE
- Skill: NONE

**Exact change:**

```typescript
// Localizar o bloco toward-hub no CASE 2 (spoke tile):
// ANTES:
if (idx + D <= 4) {
  destinations.push(spoke.tiles[idx + D]);
} else if (idx + D === 5 && canAccessHub) {
  destinations.push(HUB_POSITION);
}

// DEPOIS (adicionar else if ao final):
if (idx + D <= 4) {
  destinations.push(spoke.tiles[idx + D]);
} else if (idx + D === 5 && canAccessHub) {
  destinations.push(HUB_POSITION);
} else if (idx + D > 5) {
  const k = idx + D - 5;
  const oppSpokeIndex = (spokeIndex + 3) % 6;
  destinations.push(SPOKES[oppSpokeIndex].tiles[5 - k]);
}
```

**Done when:**

- [ ] Branch `else if (idx + D > 5)` adicionado ao bloco toward-hub
- [ ] `k = idx + D - 5` calculado corretamente
- [ ] `oppSpokeIndex = (spokeIndex + 3) % 6` correto
- [ ] `SPOKES[oppSpokeIndex].tiles[5 - k]` retornado
- [ ] Sem erros TypeScript (`npm run build` limpo no backend)

**Commit:** `feat(game): spoke overshoot → opposite spoke (diameter traversal)`

---

### T2 — Frontend: turn-logic.ts — espelhar overshoot toward opposite spoke

**What:** Aplicar a mudança idêntica ao T1 em `turn-logic.ts`, espelhando o comportamento do backend no cálculo client-side de destinos válidos.

**Where:** `frontend/src/game/turn-logic.ts`

**Depends on:** — (independente de T1)

**Reuses:** `SPOKES` (já importado de `./board-data`), `spokeIndex` (já disponível no scope)

**Requirement:** SDN-01

**Tools:**

- MCP: NONE
- Skill: NONE

**Exact change:**

```typescript
// Localizar o bloco toward-hub no CASE 2 (spoke tile):
// ANTES:
if (idx + D <= 4) {
  destinations.push(spoke.tiles[idx + D]);
} else if (idx + D === 5 && canAccessHub) {
  destinations.push(HUB_POSITION);
}

// DEPOIS:
if (idx + D <= 4) {
  destinations.push(spoke.tiles[idx + D]);
} else if (idx + D === 5 && canAccessHub) {
  destinations.push(HUB_POSITION);
} else if (idx + D > 5) {
  const k = idx + D - 5;
  const oppSpokeIndex = (spokeIndex + 3) % 6;
  destinations.push(SPOKES[oppSpokeIndex].tiles[5 - k]);
}
```

**Done when:**

- [ ] Branch `else if (idx + D > 5)` adicionado (idêntico ao T1)
- [ ] `SPOKES` já importado de `./board-data` (verificar import existente)
- [ ] Sem erros TypeScript (`npm run build` limpo no frontend)
- [ ] `getValidDestinations(47, 2, false)` retorna `[62, 45]` (verificação manual rápida)

**Commit:** `feat(turn-logic): spoke overshoot → opposite spoke (mirror backend)`

---

### T3 — Backend: board.config.spec.ts — testes SDN-01 + verificação SDN-02/03

**What:** Adicionar suite de testes para cobrir o overshoot spoke→raio oposto (SDN-01) e verificar que o hub gate (SDN-02) e hub excluído (SDN-03) continuam funcionando.

**Where:** `backend/src/game/board.config.spec.ts`

**Depends on:** T1

**Requirement:** SDN-01, SDN-02 (verificação), SDN-03 (verificação)

**Tools:**

- MCP: NONE
- Skill: NONE

**Testes a adicionar:**

```typescript
describe('SDN-01: spoke overshoot → raio oposto', () => {
  // Spoke 0 (Geography), idx=4 (pos 47), D=2
  // k=1, oppSpoke=3, tiles[4]=62
  it('should land on opposite spoke tile when overshoot (idx=4, D=2)', () => {
    const result = board.getValidDestinations(47, 2, false);
    expect(result).toContain(62); // SPOKES[3].tiles[4] — oposto de Spoke 0
  });

  // Spoke 0, idx=4 (pos 47), D=6
  // k=5, oppSpoke=3, tiles[0]=58
  it('should land on opposite spoke idx=0 tile when max overshoot (idx=4, D=6)', () => {
    const result = board.getValidDestinations(47, 6, false);
    expect(result).toContain(58); // SPOKES[3].tiles[0]
  });

  // Spoke 0, idx=0 (pos 43), D=6
  // k=1, oppSpoke=3, tiles[4]=62
  it('should land on opposite spoke when overshoot from idx=0 with D=6', () => {
    const result = board.getValidDestinations(43, 6, false);
    expect(result).toContain(62); // SPOKES[3].tiles[4]
  });

  // Raio 1 (Entertainment), idx=4 (pos 52), D=2
  // k=1, oppSpoke=4, tiles[4]=67
  it('should use correct opposite for spoke 1 → spoke 4', () => {
    const result = board.getValidDestinations(52, 2, false);
    expect(result).toContain(67); // SPOKES[4].tiles[4]
  });

  // Nenhum raio lateral deve aparecer
  it('should NOT include lateral spoke tiles when overshooting', () => {
    const result = board.getValidDestinations(47, 2, false);
    // raios laterais de Spoke 0: 1,2,4,5 → tiles: 48-52, 53-57, 63-67, 68-72
    const lateralTiles = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72];
    for (const tile of lateralTiles) {
      expect(result).not.toContain(tile);
    }
  });
});

describe('SDN-02/03 verification: hub gate', () => {
  // Hub bloqueado sem fatias (spoke tile adjacente ao hub)
  it('should NOT include hub when canAccessHub=false (exact hub roll)', () => {
    // Spoke 0, idx=4 (pos 47), D=1 → idx+D=5 → exact hub
    const result = board.getValidDestinations(47, 1, false);
    expect(result).not.toContain(0);
  });

  // Hub liberado com fatias
  it('should include hub when canAccessHub=true (exact hub roll)', () => {
    const result = board.getValidDestinations(47, 1, true);
    expect(result).toContain(0);
  });

  // Hub bloqueado → ainda há destinos alternativos
  it('should have at least 1 alternative destination when hub is blocked', () => {
    // Spoke 0, idx=4 (pos 47), D=1 (exact hub), canAccessHub=false
    const result = board.getValidDestinations(47, 1, false);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result).not.toContain(0);
  });
});
```

**Done when:**

- [ ] Suite `SDN-01` adicionada com ≥ 5 testes
- [ ] Suite `SDN-02/03 verification` adicionada com ≥ 3 testes
- [ ] `npm run test` passa sem erros
- [ ] Nenhum teste existente quebrado

**Commit:** `test(game): SDN-01 spoke overshoot tests + SDN-02/03 hub gate verification`

---

## Verification Checklist (pós-implementação)

- [ ] `getValidDestinations(47, 2, false)` → contém `62`, contém `45` (toward ring)
- [ ] `getValidDestinations(47, 1, false)` → NÃO contém `0`, contém `46` (toward ring idx=3)
- [ ] `getValidDestinations(47, 1, true)` → contém `0` (hub liberado)
- [ ] `getValidDestinations(43, 6, false)` → contém `62` (S0,idx=0,D=6 → k=1 → oppSpoke tiles[4]=62)
- [ ] Backend e Frontend retornam os mesmos resultados para todas as entradas acima
- [ ] `npm run test` no backend: todos os testes passam
- [ ] `npm run build` no backend: sem erros
- [ ] `npm run build` no frontend: sem erros
