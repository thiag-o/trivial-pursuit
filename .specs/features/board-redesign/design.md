# Board Redesign — Design

**Feature ID:** BOARD-REDESIGN
**Created:** 2026-03-30

---

## Architecture Overview

```
Backend                              Frontend
───────────────────────────────      ─────────────────────────────────────
board.config.ts                      board-data.ts
  ├─ CIRCULAR_END = 42               ├─ HQ_POSITIONS (7,14,21,28,35,42)
  ├─ HQ_POSITIONS (7,14,21,28,35,42) ├─ SPOKES (same topology)
  ├─ SPOKES (adjacency data)         └─ buildTiles() → 73 TileDef[]
  ├─ SPOKE_TILE_MAP (pos→idx)
  ├─ buildTiles() → 73 Tile[]        board-layout.ts
  └─ getValidDestinations()          └─ calculateBoardLayout()
       (ring + spoke logic)               ├─ ring: 42 tiles on circle
                                          └─ spoke: 5 tiles interpolated
game.service.ts (no change)               HQ→hub
  └─ calls board.getValidDestinations

                                     turn-logic.ts
                                     └─ getValidDestinations()
                                          (mirrors backend logic exactly)

                                     BoardRenderer.ts
                                     └─ drawRingTiles() → 1..42
                                          drawSpokeTiles() → 43..72
```

---

## Data Structures

### Shared Spoke Definition

Both backend and frontend use the same spoke topology:

```typescript
const SPOKES = [
  { hq: 7, tiles: [43, 44, 45, 46, 47], category: 'geography' },
  { hq: 14, tiles: [48, 49, 50, 51, 52], category: 'entertainment' },
  { hq: 21, tiles: [53, 54, 55, 56, 57], category: 'history' },
  { hq: 28, tiles: [58, 59, 60, 61, 62], category: 'art' },
  { hq: 35, tiles: [63, 64, 65, 66, 67], category: 'science' },
  { hq: 42, tiles: [68, 69, 70, 71, 72], category: 'sports' },
];
// tiles[0] = adjacent to HQ  (step 1 from HQ, step 5 from hub)
// tiles[4] = adjacent to hub (step 5 from HQ, step 1 from hub)
```

### SPOKE_TILE_MAP (backend only)

Reverse lookup for O(1) spoke identification:

```typescript
const SPOKE_TILE_MAP = new Map<number, { spokeIndex: number; tileIndex: number }>();
// e.g., 43 → { spokeIndex: 0, tileIndex: 0 }, 47 → { spokeIndex: 0, tileIndex: 4 }
```

---

## Movement Algorithm

```
getValidDestinations(from, diceValue) → number[]

CASE 1: from == 0 (hub)
  → For each spoke S (0..5):
      if diceValue <= 5: add SPOKES[S].tiles[5 - diceValue]
      if diceValue == 6: add SPOKES[S].hq
  → Return 6 destinations

CASE 2: from is a spoke tile (43..72)
  → Lookup spokeIndex (S) and tileIndex (idx) from SPOKE_TILE_MAP
  → Toward hub:
      if idx + D <= 4: add SPOKES[S].tiles[idx + D]
      if idx + D == 5: add hub (0)
  → Toward ring:
      if idx - D >= 0: add SPOKES[S].tiles[idx - D]
      if idx - D == -1: add SPOKES[S].hq
  → Return 0, 1 or 2 destinations

CASE 3: from is a ring tile (1..42, incl. HQ)
  → forward  = ((from - 1 + D) % 42) + 1
  → backward = ((from - 1 - D + 42*ceil(D/42)) % 42) + 1
  → Add forward, add backward (deduplicate if equal)
  → If from is an HQ tile:
      if D <= 5: also add SPOKES[spokeOf(from)].tiles[D - 1]
      if D == 6: also add hub (0)
  → Return 2 or 3 destinations
```

---

## Visual Layout (board-layout.ts)

Ring tiles: positioned at angles `(2π / 42)` apart, starting at -π/2 (top).

```
angle = -π/2 + (i - 1) * (2π / 42),  i = 1..42
x = centerX + ringRadius * cos(angle)
y = centerY + ringRadius * sin(angle)
```

Spoke tiles: linearly interpolated between HQ position and center hub.

```
frac = (tileIndex + 1) / 6   // 1/6, 2/6, 3/6, 4/6, 5/6
x = hqTile.x + (centerX - hqTile.x) * frac
y = hqTile.y + (centerY - hqTile.y) * frac
```

Spoke lines and sector fills: same as current (fromX/fromY = center, toX/toY = HQ tile position). The spoke tile circles sit on top of the spoke line naturally.

---

## Files Changed

| #   | File                                      | Change                                                        |
| --- | ----------------------------------------- | ------------------------------------------------------------- |
| T1  | `backend/src/game/board.config.ts`        | New topology, spoke adjacency, revised `getValidDestinations` |
| T2  | `backend/src/game/board.config.spec.ts`   | Updated assertions for 42-tile ring + spokes                  |
| T3  | `frontend/src/game/board-data.ts`         | New HQ positions, SPOKES export, 73-tile buildTiles           |
| T4  | `frontend/src/game/board-layout.ts`       | 42-tile ring angles, spoke tile interpolation                 |
| T5  | `frontend/src/game/turn-logic.ts`         | Spoke-aware movement mirroring backend                        |
| T6  | `frontend/src/game/pixi/BoardRenderer.ts` | drawRingTiles(1..42) + drawSpokeTiles(43..72)                 |

---

## Decisions

- **No Roll Again tiles**: removed in new design per spec. TileType `rollAgain` kept in types.ts but unused.
- **Spoke tiles are `category` type**: no new TileType needed. They inherit the spoke's category color.
- **TILE_RADIUS unchanged**: 14px. With 42-tile ring, arcs are wider (48px chord vs 28px), so tiles don't overlap.
- **Total positions = 73**: 1 hub + 42 ring + 30 spoke = 73. TOTAL_TILES constant stays 73.
- **HQ tile at position 42 is also an HQ**: adjacency for ring wrapping is the same as any other ring tile. When checking forward from 42 with dice=1 → (42-1+1)%42+1 = 1 (wraps to start).
