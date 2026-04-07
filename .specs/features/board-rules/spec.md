# Board Rules — Specification

**Feature ID:** BOARD-RULES
**Created:** 2026-03-30
**Status:** Approved

---

## Problem Statement

O tabuleiro redesenhado (BOARD-REDESIGN) estabeleceu a topologia de 42 tiles + 30 spoke tiles + hub central. Agora três regras de jogo precisam ser refinadas:

1. **Categorias nos raios**: todos os 5 tiles de cada raio são da mesma categoria da HQ do raio, o que torna os raios redundantes estrategicamente e visualmente repetitivos.
2. **Acesso irrestrito ao hub**: o hub central (posição 0) é acessível a qualquer momento, mesmo sem as 6 fatias, removendo qualquer progressão de jogo.
3. **Desconexão raio ↔ circunferência**: o movimento não flui suavemente entre raios e anel — overshoots são simplesmente descartados, reduzindo as opções estratégicas.

## Goals

- [ ] Spoke tiles com categorias variadas (não repetindo a categoria da HQ)
- [ ] Hub bloqueado até o jogador ter 6 fatias
- [ ] Movimento bidirecional fluido entre raio e anel (overshoot permite continuar no anel)
- [ ] Backend e frontend sincronizados para as 3 novas regras

## Out of Scope

| Feature                                     | Reason                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Movimento passo-a-passo (step-by-step)      | Mudança arquitetural muito grande; modelo "jump to destination" é mantido |
| Mais de 1 HQ passada por jogada             | Impossível com D≤6 e HQs a cada 7 tiles                                   |
| Animação de caminho completo (spoke → anel) | Animação apenas no destino final                                          |

---

## User Stories

### BR-1: Spoke tiles com categorias variadas ⭐ MVP

**User Story:** Como jogador, eu quero que as casas nos raios tenham categorias diferentes para ter variedade estratégica ao navegar pelos raios.

**Acceptance Criteria:**

1. WHEN um spoke tile é renderizado THEN sua categoria SHALL ser diferente da categoria da HQ do mesmo raio (exceto se coincidência no ciclo)
2. WHEN os 5 spoke tiles de um raio são listados THEN SHALL existir pelo menos 4 categorias distintas entre eles
3. WHEN o ciclo de categorias é aplicado THEN spoke S, tile T SHALL ter categoria `CATEGORY_CYCLE[(S + T + 1) % 6]`
4. WHEN a cor do raio (linha visual) é renderizada THEN SHALL usar a cor da HQ (categoria do raio), não dos tiles individuais

### BR-2: Hub bloqueado até 6 fatias ⭐ MVP

**User Story:** Como jogador, eu quero que o hub central seja acessível apenas quando tiver as 6 fatias para que haja um objetivo claro de progressão.

**Acceptance Criteria:**

1. WHEN o jogador tem menos de 6 fatias THEN hub (posição 0) SHALL ser excluído de todos os destinos válidos
2. WHEN o jogador tem exatamente 6 fatias E `mustLeaveHub = false` THEN hub SHALL ser incluído como destino válido quando o dado permite
3. WHEN o jogador está em uma HQ com dado=6 E tem menos de 6 fatias THEN hub SHALL NOT ser incluído como destino
4. WHEN o jogador está em um spoke tile com `idx + D = 5` E tem menos de 6 fatias THEN hub SHALL NOT ser incluído
5. WHEN o jogador falha o Desafio Final (`mustLeaveHub = true`) THEN hub SHALL ser excluído mesmo com 6 fatias, até o jogador deixar o hub
6. WHEN `mustLeaveHub = true` E o jogador move para posição ≠ 0 THEN `mustLeaveHub` SHALL ser resetado para `false`
7. WHEN um bot tem menos de 6 fatias THEN hub SHALL ser excluído dos destinos do bot

### BR-3: Movimento raio ↔ anel com extensão ⭐ MVP

**User Story:** Como jogador, eu quero que o movimento entre raio e anel continue naturalmente quando o dado ultrapassa a HQ para ter mais opções estratégicas de posicionamento.

**Acceptance Criteria (spoke → anel, overshoot):**

1. WHEN o jogador está em spoke tile no índice `idx` E rola `D` THEN se `idx - D < -1` (overshoot além da HQ) THEN SHALL ser oferecidos destinos no anel a `remaining = D - idx - 1` passos da HQ (forward e backward)
2. WHEN `remaining` é calculado THEN destinos SHALL ser `((hq - 1 + remaining) % 42) + 1` (forward) E `((hq - 1 - remaining + 42) % 42) + 1` (backward)
3. WHEN os dois destinos de anel são iguais (ex: anel de 2 tiles, impossível aqui) THEN SHALL ser deduplicado para 1 destino

**Acceptance Criteria (anel → raio, passagem por HQ):**

4. WHEN o jogador está em tile do anel (não HQ) E o movimento (forward ou backward) PASSA por uma HQ sem parar nela THEN SHALL ser oferecido também entrar no spoke daquela HQ com `remaining = D - distância_até_HQ` passos
5. WHEN `remaining ≤ 5` THEN destino adicional SHALL ser `SPOKES[s].tiles[remaining - 1]`
6. WHEN `remaining = 6` E `canAccessHub = true` THEN destino adicional SHALL ser hub (posição 0)
7. WHEN a jogada passa por múltiplas HQs (impossível com D≤6 e HQs a 7 tiles de distância) THEN não se aplica

### BR-3b: Sincronização backend/frontend ⭐ MVP

**Acceptance Criteria:**

1. WHEN `getValidDestinations(from, dice, canAccessHub)` é chamado no backend THEN frontend com os mesmos parâmetros SHALL retornar os mesmos destinos
2. WHEN `canAccessHub = false` THEN hub jamais aparece em qualquer lista de destinos retornada por ambos

---

## Movement Algorithm (updated)

```
getValidDestinations(from, D, canAccessHub) → number[]

CASE 1: from == 0 (hub) — player is already at hub, moves OUT
  → For each spoke S:
      if D ≤ 5: add SPOKES[S].tiles[5 - D]
      if D == 6: add SPOKES[S].hq
  → Return 6 destinations  (hub as origin is always valid — player is there)

CASE 2: from is a spoke tile (43..72)
  → Lookup idx (tileIndex) and spoke S
  → Toward hub:
      if idx + D ≤ 4: add SPOKES[S].tiles[idx + D]
      if idx + D == 5 AND canAccessHub: add hub (0)
      (if idx + D > 5: no destination toward hub — overshoot discarded)
  → Toward ring:
      if idx - D ≥ 0: add SPOKES[S].tiles[idx - D]
      if idx - D == -1: add SPOKES[S].hq  (exact landing on HQ)
      NEW: if idx - D < -1:  (overshoot past HQ into ring)
          remaining = D - idx - 1
          fwd = ((hq - 1 + remaining) % 42) + 1
          bwd = ((hq - 1 - remaining + 42) % 42) + 1
          add fwd, add bwd (deduplicate if equal)
  → Return 0..4 destinations

CASE 3: from is a ring tile (1..42)
  → forward  = ((from - 1 + D) % 42) + 1
  → backward = ((from - 1 - D + 42) % 42) + 1  [D ≤ 6, so +42 is enough]
  → Add forward, add backward (deduplicate if equal)
  → If from is an HQ tile (spoke entry from start):
      if D ≤ 5: add SPOKES[s].tiles[D - 1]
      if D == 6 AND canAccessHub: add hub (0)
  → NEW: For each direction (forward, backward), find in-path HQs:
      For forward: HQ H where 0 < distForward(from, H) < D
          remaining = D - distForward(from, H)
          add SPOKES[hqSpoke(H)].tiles[remaining - 1]  (remaining is always 1..5)
      For backward: HQ H where 0 < distBackward(from, H) < D
          remaining = D - distBackward(from, H)
          add SPOKES[hqSpoke(H)].tiles[remaining - 1]
  → Return deduplicated destinations
```

Where:

- `distForward(P, H) = ((H - P + 42) % 42)` — forward distance from P to H on ring
- `distBackward(P, H) = ((P - H + 42) % 42)` — backward distance from P to H on ring
- `canAccessHub = player.wedges.length === 6 && !player.mustLeaveHub`

---

## Spoke Tile Category Pattern

```
// Spoke S (0..5), Tile T (0..4):
category = CATEGORY_CYCLE[(S + T + 1) % 6]

// Result per spoke:
Spoke 0 (geography,    HQ=7):  [entertainment, history, art, science, sports]
Spoke 1 (entertainment,HQ=14): [history, art, science, sports, geography]
Spoke 2 (history,      HQ=21): [art, science, sports, geography, entertainment]
Spoke 3 (art,          HQ=28): [science, sports, geography, entertainment, history]
Spoke 4 (science,      HQ=35): [sports, geography, entertainment, history, art]
Spoke 5 (sports,       HQ=42): [geography, entertainment, history, art, science]
```

Each spoke has exactly 5 distinct categories (all categories except its own HQ category).
