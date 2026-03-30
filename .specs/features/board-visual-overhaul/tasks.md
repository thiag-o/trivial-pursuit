# Board Visual Overhaul — Tasks

**Design**: `.specs/features/board-visual-overhaul/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3
```

T1 (fix animation bug) is highest priority — game is unplayable without it.
T2 (update board layout geometry) provides the coordinate layer.
T3 (redesign board renderer) depends on T2 for correct tile positions.

### Phase 2: Token Redesign (after T1 fix)

```
T1 → T4
```

T4 (hexagonal token renderer) depends on the animation fix being in place (T1).

### Phase 3: Final Integration & Validation

```
T2 + T3 + T4 → T5
```

T5: verify all changes integrate correctly, no TS errors, board looks right.

---

## Task Breakdown

---

### T1: Fix TokenRenderer animation bug

**What**: Refactor `TokenRenderer.renderTokens()` to draw all token shapes at local origin `(0,0)` and position each `Graphics` container via `g.x / g.y`. Fix `animateToken()` to correctly read starting position from `g.x / g.y`.

**Where**: `frontend/src/game/pixi/TokenRenderer.ts`

**Depends on**: None

**Reuses**: Existing `TokenRenderer` class, `PLAYER_COLORS`, `TOKEN_RADIUS`, `CATEGORY_ORDER`, `WEDGE_COLORS`

**Requirements**: REQ-01, REQ-02, REQ-03

**Root cause details** (from design.md):

- Currently: `g.circle(tileLayout.x + offset.dx, tileLayout.y + offset.dy, radius)` — shape at world coords, `g.x = 0`.
- Fix: `g.x = tileLayout.x + offset.dx; g.y = tileLayout.y + offset.dy; g.circle(0, 0, radius)` — shape at local origin, container positioned correctly.
- `animateToken()` then correctly reads `g.x`/`g.y` as the starting position.

**Done when**:

- [ ] All `g.circle()`, `g.arc()`, and wedge drawing calls use `(0, 0)` as center (local origin)
- [ ] `g.x` and `g.y` are set to the correct tile position + offset for each token
- [ ] `animateToken()` reads `startX = g.x`, `startY = g.y` (unchanged) and correctly computes delta
- [ ] No JS error `"Cannot set properties of null (setting 'x')"` when clicking a destination
- [ ] Token visually moves from old tile to new tile
- [ ] No TypeScript errors

**Commit**: `fix(token-renderer): draw tokens at local origin to fix animation bug`

---

### T2: Update BoardLayout to support spoke metadata

**What**: Update `calculateBoardLayout()` in `board-layout.ts` to include spoke angle and category information in the returned `BoardLayout`, so the renderer can draw spoke lines and sector fills without re-computing geometry.

**Where**: `frontend/src/game/board-layout.ts`, `frontend/src/game/types.ts`

**Depends on**: None (can be done in parallel with T1)

**Reuses**: `HQ_POSITIONS` from `board-data.ts`, `CATEGORY_COLORS` from `constants.ts`

**Requirements**: REQ-03, REQ-04, REQ-05

**Changes**:

1. In `types.ts`, add `spokes: SpokeDef[]` to `BoardLayout`:
   ```ts
   export interface SpokeDef {
     hqPosition: number; // tile index of the HQ (5, 10, 15, 20, 25, 30)
     category: Category;
     fromX: number; // hub center X
     fromY: number; // hub center Y
     toX: number; // HQ tile X
     toY: number; // HQ tile Y
     sectorAngleStart: number; // angle in radians for sector fill
     sectorAngleEnd: number;
   }
   ```
2. In `board-layout.ts`, after computing tile positions, compute `spokes` by reading HQ tile positions from `tiles` array and building `SpokeDef` for each.

**Done when**:

- [ ] `BoardLayout` type includes `spokes: SpokeDef[]`
- [ ] `calculateBoardLayout()` returns correct `spokes` for all 6 HQ positions
- [ ] Each `SpokeDef` has correct `fromX/Y` (hub center), `toX/Y` (HQ tile coords), `category`, sector angles
- [ ] TypeScript compiles without errors
- [ ] `BoardRenderer` and `TokenRenderer` (which receive `layout`) continue to compile

**Commit**: `feat(board-layout): add spoke metadata to BoardLayout for renderer use`

---

### T3: Redesign BoardRenderer to match official Trivial Pursuit board

**What**: Fully redesign `BoardRenderer.ts` to render:

1. Dark circular board background
2. Colored sector fan fills (one per category, between spokes)
3. Thick colored spoke lines (hub to HQ, each in category color)
4. Distinct HQ tiles: larger square (rotated 45°) with category fill and gold border
5. Ring tiles: colored circles per category (small)
6. Roll Again tiles: white circle with bright inner dot or "✦" marker
7. Hub: large hexagon, each vertex-sector colored per category

**Where**: `frontend/src/game/pixi/BoardRenderer.ts` (full redesign in-place)

**Depends on**: T2 (for `spokes` in `BoardLayout`)

**Reuses**: `CATEGORY_COLORS`, `HQ_POSITIONS`, `ROLL_AGAIN_POSITIONS`, `tileGraphics` map (for highlight support)

**PixiJS v8 API to use**:

- `Graphics.circle(x, y, r)` → `fill({ color })` for circular tiles
- `Graphics.poly(points, true)` → `fill()` for hexagon hub and HQ squares
- `Graphics.moveTo / lineTo` → `stroke()` for spoke lines
- `Graphics.arc(cx, cy, r, startAngle, endAngle)` for sector fills (using `moveTo(cx,cy)` + `arc` + `lineTo(cx,cy)` for pie sectors)

**Key visual decisions**:

- Board background: dark circle (`0x1a1a2e`), large enough to frame all tiles
- Sector fills: semi-transparent category color (`alpha: 0.15`) drawn as pie sectors between spoke angles
- Spoke lines: `width: 4*scale`, color = category color
- HQ tiles: rotated square (`Graphics.poly` with 4 points rotated 45°), size = `HQ_TILE_RADIUS * scale * 2`, gold border `0xffd700`
- Regular tiles: `TILE_RADIUS * scale` circle
- Roll Again tiles: white circle with inner bright ring
- Hub hexagon: each of 6 triangular segments filled with adjacent category color

**Done when**:

- [ ] Board background is a dark circle
- [ ] 6 sector fills are visible between spokes (semi-transparent tints)
- [ ] 6 spoke lines rendered, each in correct category color
- [ ] 6 HQ tiles rendered as squares larger than regular tiles, correct category color
- [ ] 60+ regular ring tiles rendered as appropriately colored circles
- [ ] 12 Roll Again tiles have distinct visual marker
- [ ] Hub hexagon is prominently colored with 6 category wedges
- [ ] `tileGraphics` map populated for all ring positions (for highlight support)
- [ ] `highlightTiles()` still works correctly on top
- [ ] No TypeScript errors

**Commit**: `feat(board-renderer): redesign board to match official Trivial Pursuit layout`

---

### T4: Redesign TokenRenderer to hexagonal wedge tokens

**What**: Redesign the token drawing in `TokenRenderer.renderTokens()` to render each player token as a hexagonal shape with 6 pie-wedge sectors (one per category) that are colored when earned or dark when empty.

**Where**: `frontend/src/game/pixi/TokenRenderer.ts`

**Depends on**: T1 (must have local-origin fix in place first)

**Reuses**: `PLAYER_COLORS`, `TOKEN_RADIUS`, `CATEGORY_ORDER`, `WEDGE_COLORS`

**Shape specification**:

```
Hexagon: regular 6-sided polygon, pointy-top orientation
  - radius = TOKEN_RADIUS * scale (e.g., 12px)
  - drawn as 6 triangular pie sectors from center
  - each sector: 60° arc starting at -90° (top)
  - earned sector: filled with category color, alpha: 1
  - empty sector: filled with 0x222222, alpha: 1
Hex outline: stroke in player color, width 2*scale
```

**PixiJS v8 drawing approach per wedge sector `i` (0–5)**:

```ts
const anglePerSlice = (Math.PI * 2) / 6;
const startAngle = i * anglePerSlice - Math.PI / 2;
const endAngle = startAngle + anglePerSlice;
const innerR = hexRadius * 0.25; // small empty center
const outerR = hexRadius;

// Draw filled wedge
g.moveTo(innerR * Math.cos(startAngle), innerR * Math.sin(startAngle));
g.arc(0, 0, outerR, startAngle, endAngle, false);
// Wait — use poly for sectors (more reliable in PixiJS v8):
// Build polygon points for the wedge sector
const pts: number[] = [0, 0];
const steps = 8;
for (let s = 0; s <= steps; s++) {
  const a = startAngle + (s / steps) * anglePerSlice;
  pts.push(outerR * Math.cos(a), outerR * Math.sin(a));
}
g.poly(pts, true);
g.fill({ color: isEarned ? wedgeColor : 0x222222 });
```

**Done when**:

- [ ] Each player token renders as a hexagon
- [ ] 6 wedge sectors are visible on each token
- [ ] Empty wedges are dark (#222), earned wedges show category color
- [ ] Player color is shown as hex outline
- [ ] Multiple tokens on the same tile are offset and all visible
- [ ] `animateToken()` continues to work correctly (inherits T1 fix)
- [ ] No TypeScript errors

**Commit**: `feat(token-renderer): redesign tokens as hexagonal wedge pieces`

---

### T5: Integration validation

**What**: Run TypeScript compilation, check browser renders correctly, verify full game flow (roll → move → question) works end-to-end.

**Where**: `frontend/` (build check), browser (manual)

**Depends on**: T1, T2, T3, T4

**Done when**:

- [ ] `npm run build` (or `tsc -b`) completes with 0 errors
- [ ] Board loads and visually matches the reference image structure
- [ ] Token is hexagonal with 6 visible wedge sections
- [ ] Clicking a destination tile animates token correctly, no JS errors
- [ ] Winning a wedge shows it filled on the token

**Commit**: `chore(board-overhaul): integration validation complete`

---

## Parallel Execution Map

```
        ┌── T2 (layout metadata) ──────┐
        │                              ↓
Start ──┤                         T3 (board renderer) ──┐
        │                                               ├──→ T5 (validate)
        └── T1 (animation fix) ──→ T4 (hex tokens) ────┘
```

T1 and T2 have no dependencies — they can be done in parallel.
T3 depends on T2 (needs spoke data in layout).
T4 depends on T1 (needs animation fix to test correctly).
T5 depends on all prior tasks.
