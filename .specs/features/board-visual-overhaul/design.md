# Board Visual Overhaul — Design

**Spec**: `.specs/features/board-visual-overhaul/spec.md`
**Status**: Draft

---

## Architecture Overview

All changes are isolated to the **frontend PixiJS rendering layer**. No backend changes. Three components are touched:

```
BoardCanvas.tsx  (React wrapper)
    │
    ├── BoardRenderer.ts   ← REDESIGN: new board geometry + visuals
    ├── TokenRenderer.ts   ← FIX: animation bug + hexagonal token shape
    ├── board-layout.ts    ← UPDATE: spoke geometry, HQ positions, tile coords
    └── board-data.ts      ← VERIFY/ADJUST: HQ positions match new layout
```

**PixiJS render layers (z-order, bottom to top)**:

```
[Container: board]
  ├── Background circle (dark)
  ├── Sector fills (colored fans)        ← NEW
  ├── Spoke lines (colored, thick)       ← UPDATE
  ├── Ring tiles (60 category circles)
  ├── HQ tiles (6 larger squares)        ← UPDATE: squares, not circles
  ├── Roll Again tiles (markers)         ← UPDATE: star/marker
  └── Hub hexagon (prominent)            ← UPDATE

[Container: tokens]
  └── Token graphics (hexagonal)         ← REDESIGN

[Container: highlights]
  └── Highlight overlays (existing, keep)
```

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component                      | Location                         | How to Use                                                                                   |
| ------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------- |
| `BoardRenderer`                | `src/game/pixi/BoardRenderer.ts` | Redesign in-place; keep interface (`render`, `highlightTiles`, `clearHighlights`, `destroy`) |
| `TokenRenderer`                | `src/game/pixi/TokenRenderer.ts` | Fix `animateToken`; redesign token shape drawing                                             |
| `calculateBoardLayout`         | `src/game/board-layout.ts`       | Update to add spoke coords and HQ positions in layout                                        |
| `BOARD_TILES` / `HQ_POSITIONS` | `src/game/board-data.ts`         | Keep data, verify HQ positions align with board                                              |
| `usePixiApp`                   | `src/game/pixi/usePixiApp.ts`    | No changes needed                                                                            |
| `BoardCanvas`                  | `src/components/BoardCanvas.tsx` | No interface changes needed                                                                  |
| `CATEGORY_COLORS`              | `src/game/constants.ts`          | Reuse for spoke/sector/tile colors                                                           |

### Integration Points

| System                      | Integration Method                                                   |
| --------------------------- | -------------------------------------------------------------------- |
| PixiJS v8 Graphics API      | `Graphics.poly()`, `Graphics.fill()`, `Graphics.stroke()` for shapes |
| PixiJS v8 Ticker            | `app.ticker.add/remove` for animation — already used                 |
| React `useImperativeHandle` | Unchanged — `animateToken` exposed via `boardRef`                    |

---

## Bug Fix: Animation — Root Cause & Solution

### Root Cause

In `TokenRenderer.renderTokens()`, tokens are drawn using **absolute canvas coordinates**:

```ts
const g = new Graphics();
const x = tileLayout.x + offset.dx; // e.g., x = 450
const y = tileLayout.y + offset.dy;
g.circle(x, y, radius); // circle drawn AT (450, 380) in world space
g.fill({ color });
// g.x is 0, g.y is 0 — the container position is untouched
```

Then in `animateToken()`:

```ts
const startX = g.x; // startX = 0, NOT 450
const startY = g.y; // startY = 0, NOT 380
const dx = toTile.x - fromTile.x;
const dy = toTile.y - fromTile.y;
// Animates FROM (0, 0) by dx/dy — wrong origin
g.x = startX + dx * t; // Sets g.x on Graphics that has world-space drawing
```

This causes the shape to jump to (0,0) and then animate incorrectly. The "Cannot set properties of null" error likely stems from `g` being `null` when `tokenGraphics.get(nickname)` returns `undefined` because `renderTokens` was called between the token click and animation, clearing `tokenGraphics`.

### Fix Strategy

Draw each token shape centered at **(0, 0)** inside its `Graphics` object. Position the `Graphics` container using `g.x` / `g.y` = tile position. This makes `g.x` the source of truth for the token's position, so animation is correct.

```ts
// FIXED approach:
const g = new Graphics();
g.x = tileLayout.x + offset.dx; // position the CONTAINER
g.y = tileLayout.y + offset.dy;
g.circle(0, 0, radius); // draw shape at LOCAL origin (0,0)
g.fill({ color });
```

And in `animateToken()`:

```ts
const startX = g.x; // correct — is the actual container position
const startY = g.y;
```

---

## Board Geometry Design

### Official Board Structure (from reference image + game-doc.md)

- **72 ring tiles** distributed evenly on a circle (5° spacing = 360°/72)
- **6 spokes**: evenly spaced at 60° intervals, each colored with a category color
- **6 HQ tiles**: at the end of each spoke (outermost position on each spoke)
- **Hub**: center hexagon, each wedge-sector colored per category
- **12 Roll Again tiles**: positioned at fixed intervals on the ring (approx every 6 tiles)

### Coordinate System

```
Canvas: 800 × 800
Center: (400, 400)
Ring tiles: radius = 320px from center
Hub radius: 60px
HQ tile size: 24px square (vs 14px circle for regular tiles)
Spoke color: matches category color
```

### Spoke-to-HQ Mapping (aligning board-data.ts HQ positions)

Current `HQ_POSITIONS` = `{5, 10, 15, 20, 25, 30}` — every 6th tile starting from tile 5.

Board redesign keeps these positions but maps them to spokes:
| Position | Category | Color | Spoke angle |
|---|---|---|---|
| 6 | geography | #4FC3F7 | -60° (top-right) |
| 12 | entertainment | #F48FB1 | 0° (right) |
| 18 | history | #FFF176 | 60° (bottom-right) |
| 24 | art | #CE93D8 | 120° (bottom-left) |
| 30 | science | #81C784 | 180° (left) |
| 36 | sports | #FFB74D | 240° (top-left) |

> **Note**: The current HQ positions (5,10,15,20,25,30) do not align with every-6th-tile spacing. After discussion with the board layout, we will keep the existing `board-data.ts` HQ positions unchanged (they define game logic) but render the HQ tiles at those positions with the correct visual treatment. The spokes will visually connect hub to each HQ position.

### HQ tile visual: Square, not circle

In the reference image, HQ locations appear as distinctly colored squares with a thick border. Implementation: draw a rotated square (45° diamond) or axis-aligned square centered at the tile position.

---

## Token Design: Hexagonal Wedge Token

### Shape

- **Outer polygon**: Regular hexagon, radius = 12px (scaled)
- **Border**: 2px stroke in player color
- **Background**: 50% opacity dark fill (#111) so wedges are visible against it

### Wedge Filling

- 6 wedge sectors (pie slices) in the hexagon interior
- Each wedge = 60° arc, drawn with `Graphics.arc()` from center at inner radius to outer radius
- **Empty wedge**: dark gray fill (#333)
- **Earned wedge**: category color fill

### Wedge Drawing (PixiJS v8 approach)

Use filled polygon triangles or pie-sector fills using `Graphics.moveTo/lineTo/arc` approach:

```ts
// For each of 6 wedges (0–5), at local origin (0,0):
const angleStart = (i * Math.PI * 2) / 6 - Math.PI / 2;
const angleEnd = angleStart + (Math.PI * 2) / 6;
const wedgeR = hexRadius * 0.9; // slightly smaller than hexagon
g.moveTo(0, 0);
g.arc(0, 0, wedgeR, angleStart, angleEnd);
g.lineTo(0, 0);
g.fill({ color: isEarned ? categoryColor : 0x333333 });
```

---

## Components

### BoardRenderer (redesign)

- **Purpose**: Render the full Trivial Pursuit board: background, sector fills, spokes, ring tiles, HQ tiles, Roll Again markers, hub.
- **Location**: `src/game/pixi/BoardRenderer.ts` (edit in place)
- **Public interface** (unchanged):
  - `render(tiles: TileDef[], layout: BoardLayout): void`
  - `highlightTiles(positions: number[]): void`
  - `clearHighlights(): void`
  - `setOnTileClick(cb): void`
  - `destroy(): void`
- **New private methods**:
  - `drawSectorFills(layout, scale)` — colored fan sectors
  - `drawHQTile(pos, layout, category, scale)` — square HQ tiles
  - `drawRollAgainTile(pos, layout, scale)` — star/marker tile

### TokenRenderer (bug fix + redesign)

- **Purpose**: Render hexagonal player tokens at correct tile positions; animate movement.
- **Location**: `src/game/pixi/TokenRenderer.ts` (edit in place)
- **Key fix**: Draw all Graphics at local origin `(0,0)`; position via `g.x/g.y`.
- **Public interface** (unchanged):
  - `renderTokens(players, layout): void`
  - `animateToken(nickname, from, to, layout, onComplete): void`
  - `updateTokenPositions(players, layout): void`
  - `destroy(): void`

### board-layout.ts (update)

- **Purpose**: Return layout including spoke metadata for renderer use
- **Update**: No change to tile positions needed. The renderer computes spoke lines directly from HQ tile positions in the layout.

---

## Data Models

No new data models. Existing `BoardLayout`, `TileDef`, `PlayerToken` types are sufficient.

---

## Risk Notes

- **PixiJS v8 Graphics API**: `poly()`, `arc()`, `fill()`, `stroke()` all confirmed available in v8.12.0 (from Context7 research). `Graphics` in v8 uses a retained-mode draw-list approach (path commands + fill/stroke calls).
- **Animation race condition**: If `renderTokens` is called (re-clears `tokenGraphics`) while an animation is in progress, `animateToken` will fail silently. `BoardCanvas.tsx` currently calls `renderTokens` in the `players` effect — the animation is triggered via `boardRef.current.animateToken` which accesses the _old_ Graphics object. Fix: after the move API call, delay `setState` for players/tokens until _after_ animation completes (already handled in `GamePage.tsx` via the `await new Promise` around `animateToken`). However, the `useEffect` on `[app, players]` in `BoardCanvas` re-renders tokens whenever `players` changes — and the `setState` in `handleTileClick` updates `players` before animation. We must update `players` state AFTER the animation or keep the Graphics object alive. **Solution**: update `playerTokens` (visual only) after animation; keep `players` (logical) update deferred.
