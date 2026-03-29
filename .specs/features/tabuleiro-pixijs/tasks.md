# MVP-3: Tabuleiro PixiJS — Tasks

**Design**: `.specs/features/tabuleiro-pixijs/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

Install PixiJS, define types and constants. Everything downstream depends on these.

```
T1 → T2 → T3
```

### Phase 2: Data Layer (Parallel OK)

Board tile definitions and geometry calculations — independent of each other, both depend on types.

```
      ┌→ T4 [P] ─┐
T3 ──┤            ├──→ Phase 3
      └→ T5 [P] ─┘
```

### Phase 3: PixiJS Renderers (Sequential)

Core rendering classes. BoardRenderer draws the board; TokenRenderer draws player tokens on top.

```
T6 → T7
```

### Phase 4: React Components (Parallel OK)

Hook and presentational components. Can be built in parallel since they don't depend on each other.

```
      ┌→ T8  [P] ─┐
T7 ──┤→ T9  [P] ─├──→ Phase 5
      └→ T10 [P] ─┘
```

### Phase 5: Assembly (Sequential)

Wire BoardCanvas, modify StartPage to pass game state, refactor GamePage to orchestrate everything.

```
T11 → T12 → T13
```

### Phase 6: Validation (Sequential)

Full build and lint check to ensure no regressions.

```
T14
```

---

## Task Breakdown

### T1: Install PixiJS dependency

**What**: Add `pixi.js` v8 as a runtime dependency in the frontend project
**Where**: `frontend/package.json`
**Depends on**: None
**Requirement**: PIXI-01

**Steps**:

1. `cd frontend && npm install pixi.js`
2. Verify `pixi.js` appears in `package.json` dependencies
3. Verify `npm run build` still succeeds (no conflicts)

**Done when**:

- [x] `pixi.js` listed in `frontend/package.json` dependencies
- [x] `npm run build` succeeds without errors

**Verify**:

```bash
cd frontend && grep pixi package.json && npm run build
```

**Commit**: `chore(frontend): install pixi.js v8`

---

### T2: Create game type definitions

**What**: Define all TypeScript types for the board feature: `TileType`, `Category`, `TileDef`, `PlayerColor`, `PlayerToken`, `TileLayout`, `BoardLayout`
**Where**: `frontend/src/game/types.ts`
**Depends on**: T1
**Reuses**: Mirrors `backend/src/common/enums/` and `backend/src/common/interfaces/tile.interface.ts`
**Requirement**: DATA-02, DATA-03

**Steps**:

1. Create `frontend/src/game/` directory
2. Define `TileType` as string union (`'hub' | 'category' | 'hq' | 'rollAgain'`)
3. Define `Category` as string union (6 categories)
4. Define `TileDef` interface (position, type, category)
5. Define `PlayerColor` as string union (6 player colors)
6. Define `PlayerToken` interface (nickname, position, color, isHuman)
7. Define `TileLayout` interface (position, x, y)
8. Define `BoardLayout` interface (centerX, centerY, ringRadius, tileRadius, hubRadius, tiles)
9. Export all types

**Done when**:

- [x] File `frontend/src/game/types.ts` exists with all 7 type/interface definitions
- [x] All types exported
- [x] No TypeScript errors (`npx tsc --noEmit`)

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): add game type definitions for board feature`

---

### T3: Create game constants

**What**: Define color maps (category → hex, playerColor → hex), board sizes, and player color list
**Where**: `frontend/src/game/constants.ts`
**Depends on**: T2
**Reuses**: Color palette from design.md
**Requirement**: BOARD-04, COLOR-02, AD-012

**Steps**:

1. Define `CATEGORY_COLORS: Record<Category, string>` mapping 6 categories to hex colors
2. Define `PLAYER_COLORS: Record<PlayerColor, string>` mapping 6 player colors to hex values
3. Define `PLAYER_COLOR_LIST: PlayerColor[]` ordered array of available player colors
4. Define board dimension constants: `CANVAS_SIZE`, `RING_RADIUS`, `HUB_RADIUS`, `TILE_RADIUS`, `HQ_TILE_RADIUS`, `TOKEN_RADIUS`
5. Export all constants

**Done when**:

- [x] File `frontend/src/game/constants.ts` exists with `CATEGORY_COLORS`, `PLAYER_COLORS`, `PLAYER_COLOR_LIST`, and dimension constants
- [x] All constants exported
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): add game constants (colors, dimensions)`

---

### T4: Create board tile data [P]

**What**: Define the static array of 73 `TileDef` objects mirroring `backend/src/game/board.config.ts` `buildTiles()`
**Where**: `frontend/src/game/board-data.ts`
**Depends on**: T2
**Reuses**: Logic from `backend/src/game/board.config.ts` `buildTiles()`
**Requirement**: DATA-02, DATA-03

**Steps**:

1. Define `CATEGORY_CYCLE` array (6 categories in cycle order)
2. Define `HQ_POSITIONS` map (position → category for positions 5,10,15,20,25,30)
3. Define `ROLL_AGAIN_POSITIONS` set (3,9,14,19,24,29,35,41,47,53,59,65)
4. Implement `buildTiles()` function mirroring backend logic exactly
5. Export `BOARD_TILES: TileDef[]` as the pre-built array (73 tiles)
6. Export `HQ_POSITIONS` and `ROLL_AGAIN_POSITIONS` for reuse in rendering

**Done when**:

- [x] File exports `BOARD_TILES` with exactly 73 entries
- [x] Tile 0 is type `'hub'`, tile 5 is type `'hq'` with category `'geography'`, tile 3 is type `'rollAgain'`
- [x] Category cycle matches backend: geography, entertainment, history, art, science, sports
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): add static board tile data (73 tiles)`

---

### T5: Create board layout calculator [P]

**What**: Implement `calculateBoardLayout()` that computes pixel positions for all 73 tiles given canvas dimensions
**Where**: `frontend/src/game/board-layout.ts`
**Depends on**: T2
**Requirement**: BOARD-01, BOARD-02, BOARD-03

**Steps**:

1. Implement `calculateTilePosition(tileIndex, ringRadius, center)` — polar coordinate to cartesian for ring tiles (1-72)
2. Implement `calculateBoardLayout(canvasSize)` → `BoardLayout` — computes center, radii, and all 73 tile positions
3. Position 0 (hub) → center of canvas
4. Positions 1-72 → evenly distributed on circle, starting at top (-π/2), clockwise
5. Export `calculateBoardLayout`

**Done when**:

- [x] `calculateBoardLayout(800)` returns a `BoardLayout` with 73 `TileLayout` entries
- [x] Tile 0 position is at (400, 400) — center
- [x] Tile 1 position is at top of circle (400, 80) approximately
- [x] All ring tiles are evenly spaced at 5° intervals
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): add board layout geometry calculator`

---

### T6: Create BoardRenderer (PixiJS)

**What**: Implement the PixiJS class that renders the complete board: background, spokes, hub hexagon, and 72 ring tiles with correct colors and visual indicators
**Where**: `frontend/src/game/pixi/BoardRenderer.ts`
**Depends on**: T3, T4, T5
**Requirement**: BOARD-01 through BOARD-07

**Steps**:

1. Create class `BoardRenderer` with constructor receiving PixiJS `Application`
2. Add `render(tiles: TileDef[], layout: BoardLayout)` method
3. Layer 0: background disc (dark gray circle filling canvas)
4. Layer 1: 6 spoke lines from center to each HQ tile position
5. Layer 2: hub hexagon at center using `Graphics.poly()`
6. Layer 3: 72 ring tiles as circles — color by `CATEGORY_COLORS[tile.category]`, HQ tiles 20% larger with gold border, Roll Again tiles with striped pattern or icon
7. Add `destroy()` method to clean up all containers
8. All drawing uses PixiJS v8 `Graphics` API

**Done when**:

- [x] Class exports `BoardRenderer` with `render()` and `destroy()` methods
- [x] Hub rendered as hexagon at center
- [x] 6 spokes drawn from center to HQ positions (5,10,15,20,25,30)
- [x] 72 ring tiles drawn with correct category colors
- [x] HQ tiles visually distinct (larger + gold border)
- [x] Roll Again tiles visually distinct
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): implement BoardRenderer (PixiJS board drawing)`

---

### T7: Create TokenRenderer (PixiJS)

**What**: Implement the PixiJS class that renders player tokens on the board with correct positioning and overlap handling
**Where**: `frontend/src/game/pixi/TokenRenderer.ts`
**Depends on**: T2, T3, T5
**Requirement**: TOKEN-01 through TOKEN-04

**Steps**:

1. Create class `TokenRenderer` with constructor receiving PixiJS `Application`
2. Add `renderTokens(players: PlayerToken[], layout: BoardLayout)` method
3. Each token drawn as a filled circle with `PLAYER_COLORS[player.color]`
4. Human player's token gets white border (2px) to distinguish
5. Implement overlap offset logic: 1 token → center, 2 → ±6px, 3 → triangle, 4+ → circular distribution
6. Add `updateTokenPositions(players: PlayerToken[], layout: BoardLayout)` method for future use (MVP-4)
7. Add `destroy()` method to clean up container

**Done when**:

- [x] Class exports `TokenRenderer` with `renderTokens()`, `updateTokenPositions()`, `destroy()`
- [x] Tokens rendered with correct player colors
- [x] Human token has white border
- [x] Multiple tokens on same tile are offset (not fully overlapping)
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): implement TokenRenderer (player token drawing)`

---

### T8: Create usePixiApp React hook [P]

**What**: Create a custom React hook that manages PixiJS Application lifecycle (create on mount, destroy on unmount, handle resize)
**Where**: `frontend/src/game/pixi/usePixiApp.ts`
**Depends on**: T1
**Requirement**: PIXI-01, PIXI-02, PIXI-03, PIXI-04

**Steps**:

1. Create hook `usePixiApp(containerRef: RefObject<HTMLDivElement>)`
2. On mount: create `new Application()` with `init({ width: 800, height: 800, background: ... })`
3. Append canvas to containerRef.current
4. Set up `ResizeObserver` on container → compute scale → apply CSS transform scale
5. On unmount: destroy PixiJS app (`app.destroy(true, { children: true })`), disconnect ResizeObserver
6. Try/catch around Application init for WebGL fallback — return `{ app, error }` tuple
7. Return `{ app: Application | null, error: string | null }`

**Done when**:

- [x] Hook creates PixiJS Application on mount
- [x] Hook destroys Application on unmount (no WebGL leak)
- [x] ResizeObserver scales canvas via CSS transform
- [x] Returns error string if WebGL init fails
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): add usePixiApp hook (PixiJS lifecycle management)`

---

### T9: Create ColorPicker component [P]

**What**: Build the color selection screen shown before the board renders, with 6 clickable color buttons
**Where**: `frontend/src/components/ColorPicker.tsx`
**Depends on**: T3
**Requirement**: COLOR-01 through COLOR-05

**Steps**:

1. Define props: `onSelect(color: PlayerColor): void`
2. Render 6 color buttons using `PLAYER_COLOR_LIST` and `PLAYER_COLORS` hex values
3. Each button shows the color as background, clickable
4. On click → call `onSelect(color)`
5. Style with Tailwind (dark theme, consistent with Login/Start pages)
6. Include heading text: "Escolha sua cor"

**Done when**:

- [x] Component renders 6 distinct color buttons
- [x] Clicking a button calls `onSelect` with the correct `PlayerColor`
- [x] Styled consistently with existing pages (dark theme, Tailwind)
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): add ColorPicker component`

---

### T10: Create GameHUD component [P]

**What**: Build the minimal game information panel showing player list, current turn, and human nickname
**Where**: `frontend/src/components/GameHUD.tsx`
**Depends on**: T2, T3
**Requirement**: HUD-01, HUD-02, HUD-03, LEG-01

**Steps**:

1. Define props: `players: PlayerToken[]`, `currentPlayerNickname: string`, `humanNickname: string`
2. Render human player's nickname prominently
3. Render player list with colored dot + nickname for each player
4. Highlight the current player's turn
5. Render category legend (6 colors with category names in Portuguese)
6. Style with Tailwind (dark panel, fits in 25% width sidebar)

**Done when**:

- [x] Displays human nickname
- [x] Lists all players with their token colors
- [x] Indicates current player's turn
- [x] Shows category color legend
- [x] Styled with Tailwind dark theme
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): add GameHUD component with player list and legend`

---

### T11: Create BoardCanvas component

**What**: Build the React component that integrates PixiJS: uses `usePixiApp`, instantiates `BoardRenderer` + `TokenRenderer`, handles WebGL fallback
**Where**: `frontend/src/components/BoardCanvas.tsx`
**Depends on**: T6, T7, T8
**Requirement**: PIXI-01 through PIXI-04, BOARD-01

**Steps**:

1. Define props: `players: PlayerToken[]`
2. Create `containerRef` for the PixiJS canvas container div
3. Use `usePixiApp(containerRef)` to get `{ app, error }`
4. If error → render fallback message ("Seu navegador não suporta WebGL...")
5. On `app` ready: instantiate `BoardRenderer`, call `render(BOARD_TILES, layout)`
6. Instantiate `TokenRenderer`, call `renderTokens(players, layout)`
7. Container div styled with `aspect-ratio: 1`, proper sizing
8. Cleanup handled by usePixiApp hook

**Done when**:

- [x] Component renders PixiJS canvas inside a container div
- [x] Board tiles, hub, spokes visible on mount
- [x] Player tokens visible on hub
- [x] Shows fallback message if WebGL unavailable
- [x] Canvas scales on container resize
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): add BoardCanvas component (PixiJS integration)`

---

### T12: Modify StartPage to pass game state

**What**: Update `StartPage` to pass the game state response from `POST /game/start` to `GamePage` via React Router navigate state
**Where**: `frontend/src/pages/StartPage.tsx` (modify)
**Depends on**: None (can be done anytime, but logically before T13)
**Reuses**: Existing `StartPage.tsx` code
**Requirement**: DATA-01, AD-011

**Steps**:

1. In `handleStart()`, capture the response: `const res = await api.post('/game/start')`
2. Pass response data to navigate: `navigate('/game', { state: res.data })`
3. No other changes to StartPage

**Done when**:

- [x] `navigate('/game', { state: res.data })` replaces `navigate('/game')`
- [x] Game state (players, gameId, etc.) is passed via location state
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): pass game state to GamePage via router state`

---

### T13: Refactor GamePage to orchestrate board

**What**: Replace the placeholder GamePage with full orchestration: redirect if no state, color selection flow, then board + HUD rendering
**Where**: `frontend/src/pages/GamePage.tsx` (modify)
**Depends on**: T9, T10, T11, T12
**Reuses**: `getNickname()` from `auth.ts`
**Requirement**: COLOR-01, COLOR-03, COLOR-04, COLOR-05, PIXI-01

**Steps**:

1. Read game state from `useLocation().state` — if null, `<Navigate to="/start" />`
2. State: `selectedColor: PlayerColor | null` (starts null)
3. If `selectedColor === null` → render `<ColorPicker onSelect={...} />`
4. On color select: assign chosen color to human, auto-assign distinct colors to opponents
5. Build `PlayerToken[]` from game state players + color assignments
6. Render layout: `<BoardCanvas players={tokens} />` (75%) + `<GameHUD ... />` (25%)
7. Use flex row layout matching design.md page layout

**Done when**:

- [x] Redirects to `/start` if no location state
- [x] Shows ColorPicker before board
- [x] After color selection, renders BoardCanvas + GameHUD side by side
- [x] Human player gets selected color, opponents get auto-assigned distinct colors
- [x] Flex layout: board 75%, HUD 25%
- [x] No TypeScript errors

**Verify**:

```bash
cd frontend && npx tsc --noEmit
```

**Commit**: `feat(frontend): refactor GamePage with color picker + board + HUD`

---

### T14: Full build validation

**What**: Run full TypeScript check and Vite build to ensure no compile errors across all new and modified files
**Where**: `frontend/`
**Depends on**: T13
**Requirement**: All

**Steps**:

1. `cd frontend && npx tsc --noEmit` — must pass with zero errors
2. `cd frontend && npm run build` — must produce dist/ successfully
3. `cd frontend && npm run lint` — must pass (or only pre-existing warnings)

**Done when**:

- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm run build` succeeds
- [x] `npm run lint` passes

**Verify**:

```bash
cd frontend && npx tsc --noEmit && npm run build && npm run lint
```

**Commit**: `chore(frontend): validate full build for tabuleiro-pixijs`

---

## Parallel Execution Map

```
Phase 1 (Sequential):      T1 → T2 → T3
Phase 2 (Parallel):              T4 [P]
                                  T5 [P]
Phase 3 (Sequential):       T6 → T7
Phase 4 (Parallel):              T8  [P]
                                  T9  [P]
                                  T10 [P]
Phase 5 (Sequential):  T11 → T12 → T13
Phase 6 (Validation):           T14
```

**Total**: 14 tasks, 6 phases
**Parallelizable**: T4‖T5, T8‖T9‖T10
**Critical path**: T1 → T2 → T3 → T4 → T6 → T7 → T11 → T13 → T14

---

## Requirement Coverage

| Requirement | Task(s) |
| --- | --- |
| BOARD-01 | T5, T6 |
| BOARD-02 | T5, T6 |
| BOARD-03 | T5, T6 |
| BOARD-04 | T3, T6 |
| BOARD-05 | T6 |
| BOARD-06 | T6 |
| BOARD-07 | T6 |
| TOKEN-01 | T7, T11 |
| TOKEN-02 | T7 |
| TOKEN-03 | T7 |
| TOKEN-04 | T7 |
| COLOR-01 | T9, T13 |
| COLOR-02 | T3, T9 |
| COLOR-03 | T13 |
| COLOR-04 | T13 |
| COLOR-05 | T13 |
| PIXI-01 | T1, T8, T11 |
| PIXI-02 | T8 |
| PIXI-03 | T8 |
| PIXI-04 | T8, T11 |
| DATA-01 | T12 |
| DATA-02 | T2, T4 |
| DATA-03 | T4 |
| HUD-01 | T10 |
| HUD-02 | T10 |
| HUD-03 | T10 |
| LEG-01 | T10 |

**Coverage**: 27/27 requirements mapped to tasks (0 unmapped)
