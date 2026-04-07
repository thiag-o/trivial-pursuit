# Board Redesign Specification

**Feature ID:** BOARD-REDESIGN
**Created:** 2026-03-30
**Status:** Approved

---

## Problem Statement

O tabuleiro atual possui 72 tiles na circunferência, com os 6 HQs concentrados nas posições 5–30 (primeira metade do anel) e raios (spokes) puramente decorativos. Isso cria uma distribuição desbalanceada e elimina a dimensão estratégica dos raios como atalhos navegáveis. O novo design reduz o anel para 42 tiles distribuídos uniformemente entre 6 HQs e adiciona 5 tiles navegáveis em cada raio, tornando o hub central acessível por múltiplos caminhos.

## Goals

- [x] Anel com 42 tiles (redução de 72), HQs distribuídos uniformemente a cada 7 tiles
- [x] 6 raios navegáveis com 5 tiles intermediários conectando cada HQ ao hub
- [x] Total de posições mantido em 73 (0–72): 1 hub + 42 anel + 30 spoke tiles
- [x] Backend e frontend sincronizados (mesma topologia, zero drift)

## Out of Scope

| Feature                               | Reason                                                     |
| ------------------------------------- | ---------------------------------------------------------- |
| Tiles "Roll Again"                    | Removidos no novo design — não mencionados na spec         |
| Visualização distinta dos spoke tiles | Spoke tiles são category tiles comuns, sem estilo especial |
| Responsividade mobile                 | Fora do escopo do MVP                                      |

---

## User Stories

### P1: Anel reduzido com HQs uniformes ⭐ MVP

**User Story:** Como jogador, eu quero que todas as 6 casas HQ estejam distribuídas uniformemente no anel para que haja equilíbrio estratégico entre categorias.

**Acceptance Criteria:**

1. WHEN o tabuleiro é renderizado THEN o anel SHALL ter exatamente 42 tiles (posições 1–42)
2. WHEN os HQs são posicionados THEN cada HQ SHALL estar na posição 7, 14, 21, 28, 35 e 42 (um por categoria)
3. WHEN between duas HQs consecutivas THEN SHALL existir exatamente 6 tiles regulares de categoria
4. WHEN o tile de posição é calculado THEN a categoria SHALL repetir o ciclo [geography, entertainment, history, art, science, sports]

### P1: Raios navegáveis com spoke tiles ⭐ MVP

**User Story:** Como jogador, eu quero poder navegar pelo raio de uma HQ até o hub central para ter um caminho estratégico alternativo ao anel.

**Acceptance Criteria:**

1. WHEN o jogador está em uma casa HQ THEN o sistema SHALL oferecer, além de forward/backward no anel, entrar no spoke como destino válido
2. WHEN o jogador entra no spoke com dado D (1–5) THEN o destino SHALL ser spoke_tile[D-1] (tile adjacente à HQ = índice 0, tile adjacente ao hub = índice 4)
3. WHEN o jogador entra no spoke com dado D = 6 THEN o destino SHALL ser o hub (posição 0)
4. WHEN o jogador está em um spoke tile (índice idx) THEN SHALL poder mover-se em direção ao hub (idx+D) ou em direção ao anel (idx-D)
5. WHEN a direção levaria além do hub ou além da HQ THEN esse destino SHALL ser omitido (sem overshoot)
6. WHEN o jogador está no hub THEN para cada spoke SHALL haver um destino: spoke_tile[5-D] se D≤5, HQ se D=6

### P1: Sincronização backend/frontend ⭐ MVP

**User Story:** Como desenvolvedor, eu quero que backend e frontend usem a mesma topologia para que o movimento nunca seja rejeitado por inconsistência.

**Acceptance Criteria:**

1. WHEN backend calcula getValidDestinations(from, dice) THEN frontend getTurnLogic(from, dice) SHALL retornar os mesmos destinos
2. WHEN uma posição de spoke tile (43–72) é retornada pelo backend THEN frontend SHALL renderizá-la corretamente no canvas
3. WHEN backend valida um movimento para posição P THEN isValidPosition(P) SHALL aceitar 0–72

---

## Board Topology

```
Total positions: 73 (0–72)

Position 0:     Hub (center)
Positions 1–42: Ring tiles
  - Category cycle: geography(0), entertainment(1), history(2), art(3), science(4), sports(5) → (pos-1) % 6
  - HQ positions: 7(geography), 14(entertainment), 21(history), 28(art), 35(science), 42(sports)

Positions 43–72: Spoke tiles (5 per spoke, 6 spokes)
  Spoke 0 (HQ=7,  geography):    tiles [43, 44, 45, 46, 47]  — 43=adj.HQ, 47=adj.hub
  Spoke 1 (HQ=14, entertainment): tiles [48, 49, 50, 51, 52]
  Spoke 2 (HQ=21, history):       tiles [53, 54, 55, 56, 57]
  Spoke 3 (HQ=28, art):           tiles [58, 59, 60, 61, 62]
  Spoke 4 (HQ=35, science):       tiles [63, 64, 65, 66, 67]
  Spoke 5 (HQ=42, sports):        tiles [68, 69, 70, 71, 72]

Navigation from HQ (pos H), dice D:
  - Ring forward:  ((H - 1 + D) % 42) + 1
  - Ring backward: ((H - 1 - D + 42) % 42) + 1
  - Spoke enter:   spoke.tiles[D-1]  if D ≤ 5
                   hub (0)           if D = 6

Navigation from spoke tile (idx), dice D:
  - Toward hub:  spoke.tiles[idx+D] if idx+D ≤ 4, hub if idx+D = 5
  - Toward ring: spoke.tiles[idx-D] if idx-D ≥ 0, HQ if idx-D = -1

Navigation from hub (0), dice D:
  - For each spoke: spoke.tiles[5-D] if D ≤ 5, spoke.hq if D = 6
  → Returns 6 destinations (one per spoke)
```
