# Board Visual Overhaul Specification

**Feature**: `board-visual-overhaul`
**Created**: 2026-03-29
**Status**: Draft

---

## Problem Statement

The current Trivial Pursuit digital board has three critical issues:

1. **Visual fidelity is low** — the board doesn't resemble the official Trivial Pursuit board (circular ring with 6 radial spokes, color-coded sectors, distinct HQ squares at spoke ends, Roll Again markers, and a hexagonal center hub).
2. **Movement is broken** — clicking a destination tile throws a JS error `"Cannot set properties of null (setting 'x')"`, meaning tokens never animate and the player is stuck.
3. **Token design is wrong** — player tokens are simple circles. They should be hexagonal "pie" tokens with 6 wedge slots (one per category) that visually fill in as wedges are earned.

---

## Goals

- [ ] Fix the movement animation bug so tokens always reach their destination.
- [ ] Redesign the board renderer to faithfully reproduce the official Trivial Pursuit board layout: 72 tiles in a circular ring with 6 colored spokes, HQ squares, Roll Again markers, and a hexagonal hub.
- [ ] Redesign player tokens to be hexagonal with 6 empty wedge slots that fill with category colors as wedges are won.

## Out of Scope

| Feature               | Reason                                            |
| --------------------- | ------------------------------------------------- |
| Sound effects         | Separate feature, not requested                   |
| Animated dice         | Not part of board/token redesign                  |
| Mobile layout changes | CSS/responsive concerns, separate effort          |
| Backend changes       | All fixes are frontend-only (PixiJS/Canvas layer) |

---

## User Stories

### P1: Fix Token Movement Bug ⭐ MVP

**User Story**: As a player, I want my token to smoothly move to my chosen destination tile so that game flow is not broken after selecting a move.

**Why P1**: The game is unplayable until this is fixed — the animation completely fails with a JS crash.

**Root Cause (verified)**: `TokenRenderer.animateToken()` sets `g.x` / `g.y` on a `Graphics` object whose shape was drawn at **absolute canvas coordinates** (not at origin). The Graphics container position (`g.x`, `g.y`) starts at 0, and the delta calculation uses `toTile.x - fromTile.x` as offset, but then reads `g.x` (which is 0, not the actual rendered position). The fix requires drawing each token's shape relative to its local origin (0, 0) and using `g.x = tileLayout.x` / `g.y = tileLayout.y` to position the container.

**Acceptance Criteria**:

1. WHEN a player clicks a valid highlighted destination tile THEN the token SHALL animate smoothly from its current position to the target position without any JS errors.
2. WHEN the animation completes THEN the game state SHALL advance to the next phase (question, rollAgain, etc.).
3. WHEN multiple players share a position THEN all tokens SHALL render offset from each other without collision.

**Independent Test**: Start a game, roll dice, click a highlighted destination — token moves, no console error, question appears or next phase proceeds.

---

### P1: Accurate Board Layout ⭐ MVP

**User Story**: As a player, I want the board to look like the official Trivial Pursuit board so that I can recognize the game and intuitively understand the board layout.

**Why P1**: The board is the central UI element; its fidelity affects the entire gameplay experience and is explicitly requested.

**Reference**: `references/trivia-pursuit-tabuleiro.jpg` — official board with:

- 72 colored tiles on the outer ring (tiles 1–72), each colored after its category (6 colors cycling)
- 6 radial spokes connecting hub to HQ tiles at positions [6, 12, 18, 24, 30, 36] (or equivalent)
- HQ tiles: larger squares (not circles) at spoke ends — one per category color
- Roll Again tiles: distinctly marked (white star or "?" indicator) at 12 fixed positions
- Center hexagonal hub: white/cream, large, clearly distinguished
- Board background: dark circular border, cream/parchment inner colors per sector
- Spoke lines: thick, colored lines matching each category color

**Acceptance Criteria**:

1. WHEN the board renders THEN it SHALL display 72 evenly spaced tiles on a circular ring.
2. WHEN the board renders THEN each of the 6 spokes SHALL be drawn as a thick colored line connecting the hub to its HQ tile, using that category's color.
3. WHEN the board renders THEN HQ tiles SHALL be visually distinct from regular ring tiles (larger, square shape, bright color, bold border).
4. WHEN the board renders THEN Roll Again tiles SHALL have a distinct visual marker (e.g., a white/bright inner circle or star symbol).
5. WHEN the board renders THEN the hub SHALL be a prominent hexagon with the category colors radiating from it.
6. WHEN the board renders THEN sector backgrounds between spokes SHALL be tinted with the category color of that sector.

**Independent Test**: Load the game page — the rendered board visually matches the reference image in structure, colors, and tile types.

---

### P1: Hexagonal Player Tokens with Wedge Slots ⭐ MVP

**User Story**: As a player, I want my token to look like a hexagonal Trivial Pursuit pie piece with 6 color-coded wedge slots so that I can see my category progress at a glance.

**Why P1**: Directly requested feature; the visual representation of wedges is core to the game's UX (knowing what you've collected).

**Game Rule Reference** (from `references/game-doc.md`): 6 categories — Geography (blue), Entertainment (pink), History (yellow), Art/Literature (purple), Science (green), Sports (orange). Tokens have 6 compartments; each filled compartment shows the category color.

**Acceptance Criteria**:

1. WHEN a token is rendered THEN it SHALL be hexagonal in shape (6-sided polygon).
2. WHEN a token is rendered THEN it SHALL display 6 wedge segments around its center, one per category.
3. WHEN a player has NOT won a wedge for a category THEN that wedge slot SHALL appear empty (dark/unfilled).
4. WHEN a player HAS won a wedge for a category THEN that wedge slot SHALL appear filled with the category's color.
5. WHEN multiple players share a tile THEN each hexagonal token SHALL be offset so all are visible.
6. WHEN a wedge is earned THEN the token SHALL update to show the newly filled wedge on the next render.

**Independent Test**: Start a game; inspect a player token and verify it's hexagonal with 6 visible wedge sections; win a wedge and verify the correct sector fills with the right color.

---

### P2: Board Sector Color Backgrounds

**User Story**: As a player, I want each of the 6 sectors between spokes to be subtly tinted with the category color so the board feels more vibrant and easier to read.

**Why P2**: Enhances visual fidelity; not strictly blocking gameplay but improves board readability.

**Acceptance Criteria**:

1. WHEN the board renders THEN the area between each pair of spokes SHALL be filled with a semi-transparent tint of the adjacent category color.
2. WHEN rendered THEN sector fills SHALL be drawn behind tiles and spokes but in front of the board background.

**Independent Test**: Load the game — visible colored fan-shaped sectors between each pair of spokes.

---

## Technical Constraints

- **Library**: PixiJS v8.17.x (`pixi.js` package) — use `Graphics`, `Container`, `Ticker` APIs from v8.
- **No additional packages**: Do not add new npm dependencies.
- **Canvas size**: 800×800 logical pixels, CSS-scaled by `ResizeObserver`.
- **Performance**: Board renders once; only token positions update on moves. Avoid per-frame full re-renders.
- **Positions**: Hub = position 0, ring = positions 1–72. HQ positions per `board-data.ts`: `{5:'geography', 10:'entertainment', 15:'history', 20:'art', 25:'science', 30:'sports'}` — these must be reconciled with the actual spoke layout if the board redesign changes them.

---

## Req Traceability

| ID     | Story            | Acceptance Criterion                                |
| ------ | ---------------- | --------------------------------------------------- |
| REQ-01 | Fix Movement Bug | Token animates without JS error                     |
| REQ-02 | Fix Movement Bug | Game phase advances after animation                 |
| REQ-03 | Board Layout     | 72 tiles on circular ring                           |
| REQ-04 | Board Layout     | 6 colored spokes                                    |
| REQ-05 | Board Layout     | HQ tiles visually distinct (square, larger)         |
| REQ-06 | Board Layout     | Roll Again tiles distinctly marked                  |
| REQ-07 | Board Layout     | Hub is a prominent hexagon                          |
| REQ-08 | Board Layout     | Sector backgrounds tinted                           |
| REQ-09 | Hex Token        | Token is hexagonal                                  |
| REQ-10 | Hex Token        | 6 wedge segments visible on token                   |
| REQ-11 | Hex Token        | Empty wedges = dark; earned wedges = category color |
| REQ-12 | Hex Token        | Multiple tokens on same tile are offset             |
