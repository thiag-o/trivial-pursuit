# MVP-4: Lógica de Turno — Tasks

**Design**: `.specs/features/logica-turno/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

Types, constants, API service layer, and frontend turn logic. Everything upstream depends on these.

```
T1 → T2 → T3 → T4
```

### Phase 2: Backend Changes (Parallel OK)

Backend modifications: bot-skip in advanceTurn and enhanced answer response. Independent of each other.

```
      ┌→ T5 [P] ─┐
T4 ──┤            ├──→ Phase 3
      └→ T6 [P] ─┘
```

### Phase 3: PixiJS Enhancements (Sequential)

BoardRenderer gets highlight layer + click events, TokenRenderer gets animation, BoardCanvas wires them to React.

```
T7 → T8 → T9
```

### Phase 4: UI Components (Parallel OK)

New React components and HUD enhancements. All independent — depend only on Phase 1 types/constants.

```
      ┌→ T10 [P] ─┐
      ├→ T11 [P] ─┤
T9 ──┤→ T12 [P] ─├──→ Phase 5
      ├→ T13 [P] ─┤
      └→ T14 [P] ─┘
```

### Phase 5: Integration (Sequential)

GamePage refactored into the turn orchestrator. Wires all components and manages the full turn cycle.

```
T15
```

### Phase 6: Validation (Sequential)

Full build and lint to ensure no regressions.

```
T16
```

---

## Task Breakdown

### T1: Add turn-related types to types.ts

**What**: Add `TurnPhase`, `PlayerData`, `QuestionData`, `AnswerResult`, `GamePageState`, and API response types to the frontend types file
**Where**: `frontend/src/game/types.ts`
**Depends on**: None
**Reuses**: Existing `types.ts` (extends with new interfaces)
**Requirement**: SYNC-01, SYNC-02, SYNC-03

**Steps**:

1. Add `TurnPhase` type union (`'waitingRoll' | 'waitingMove' | 'waitingAnswer'`)
2. Add `PlayerData` interface (nickname, position, wedges, isHuman)
3. Add `QuestionData` interface (id, category, question, answers[])
4. Add `AnswerResult` interface (correct, correctAnswer)
5. Add `GamePageState` interface (full state as per design Data Models)
6. Add `RollDiceResponse`, `MoveResponse`, `AnswerResponse` interfaces
7. Export all new types

**Done when**:

- [ ] All 7 types/interfaces defined and exported
- [ ] Existing types (`PlayerToken`, `TileDef`, etc.) unchanged
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add turn-related types`

---

### T2: Add CATEGORY_NAMES to constants.ts

**What**: Add a `CATEGORY_NAMES` record mapping Category enum values to display names in Portuguese, for use by QuestionModal, CategoryPickerModal, and GameHUD
**Where**: `frontend/src/game/constants.ts`
**Depends on**: T1
**Reuses**: Existing `constants.ts` (CATEGORY_COLORS already defined)
**Requirement**: QST-02, TILE-04

**Steps**:

1. Add `CATEGORY_NAMES: Record<string, string>` mapping each category to its Portuguese display name (e.g., `geography` → `"Geografia"`, `entertainment` → `"Entretenimento"`, etc.)
2. Export the constant

**Done when**:

- [ ] `CATEGORY_NAMES` exported with all 6 categories
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add CATEGORY_NAMES constant`

---

### T3: Create game-api.ts service

**What**: Create wrapper functions for all turn-related API calls (rollDice, moveToPosition, fetchQuestion, submitAnswer), using the existing Axios instance
**Where**: `frontend/src/services/game-api.ts`
**Depends on**: T1 (types for responses)
**Reuses**: `frontend/src/services/api.ts` (Axios instance with JWT interceptors)
**Requirement**: TURN-02, MOVE-02, QST-03, SYNC-01, SYNC-02, SYNC-03

**Steps**:

1. Import `api` from `./api`
2. Import response types from `../game/types`
3. Implement `rollDice(): Promise<RollDiceResponse>` — POST /game/roll-dice
4. Implement `moveToPosition(targetPosition: number): Promise<MoveResponse>` — POST /game/move
5. Implement `fetchQuestion(category: string): Promise<QuestionData>` — GET /questions/{category}
6. Implement `submitAnswer(questionId: string, answerId: string): Promise<AnswerResponse>` — POST /questions/{id}/answer
7. Export all functions

**Done when**:

- [ ] 4 exported async functions with correct types
- [ ] Each function calls the correct endpoint with correct method/body
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): create game-api service`

---

### T4: Create turn-logic.ts

**What**: Frontend-side logic mirroring backend `BoardConfig.getValidDestinations`, plus helpers for human-turn detection and bot-skip list
**Where**: `frontend/src/game/turn-logic.ts`
**Depends on**: T1 (PlayerData type)
**Reuses**: `frontend/src/game/board-data.ts` (BOARD_TILES), `backend/src/game/board.config.ts` (logic reference)
**Requirement**: DEST-03, SYNC-06

**Steps**:

1. Import `BOARD_TILES` from `board-data`
2. Implement `getValidDestinations(from: number, diceValue: number): number[]` — same logic as backend: hub (position 0) → forward only; circular → forward + backward wrap-around on 72-tile ring
3. Implement `getTileInfo(position: number): TileDef` — lookup in BOARD_TILES
4. Implement `isHumanTurn(players: PlayerData[], currentPlayerNickname: string, humanNickname: string): boolean`
5. Implement `getBotsToSkip(players: PlayerData[], currentPlayerIndex: number): string[]` — returns nicknames of bots between currentPlayer and next human
6. Export all functions

**Done when**:

- [ ] `getValidDestinations(0, 3)` returns `[3]` (hub → forward only)
- [ ] `getValidDestinations(70, 4)` returns `[2, 66]` (wrap forward + backward)
- [ ] `isHumanTurn` returns true only when currentPlayer matches humanNickname
- [ ] `getBotsToSkip` returns correct bot names in order
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): create turn-logic utilities`

---

### T5: Modify advanceTurn to skip bot players

**What**: Modify the `advanceTurn` method in GameService to auto-skip bot players (do-while loop until human), as defined in AD-017
**Where**: `backend/src/game/game.service.ts`
**Depends on**: None (backend-only change)
**Reuses**: Existing `advanceTurn` method
**Requirement**: FLOW-04

**Steps**:

1. Replace the single increment with a `do { index++; } while (!player.isHuman)` loop
2. Ensure `turnPhase` is reset to `WAITING_ROLL` and `lastDiceRoll` to null
3. Run backend lint to verify

**Done when**:

- [ ] `advanceTurn` loops through bots until a human player is found
- [ ] Backend builds: `cd backend && npx nest build`
- [ ] Backend lint: `cd backend && npx eslint src/game/game.service.ts`

**Verify**: `cd backend && npx nest build && npx eslint src/game/game.service.ts`

**Commit**: `feat(backend): advanceTurn skips bot players`

---

### T6: Enhance answer response with full player data

**What**: Modify the answer endpoint to return full `players[]` array (with wedges) in the `gameState` response object
**Where**: `backend/src/questions/questions.controller.ts`
**Depends on**: None (backend-only change)
**Reuses**: Existing answer method structure
**Requirement**: SYNC-03, WEDGE-02

**Steps**:

1. In the answer method, after getting the updated game state, map players to include nickname, position, wedges, isHuman
2. Include the mapped `players` array in the returned `gameState` object
3. Ensure `currentPlayer`, `turnPhase`, `status` are still included

**Done when**:

- [ ] Answer response `gameState` includes `players[]` with wedges for each player
- [ ] Backend builds: `cd backend && npx nest build`
- [ ] Backend lint: `cd backend && npx eslint src/questions/questions.controller.ts`

**Verify**: `cd backend && npx nest build && npx eslint src/questions/questions.controller.ts`

**Commit**: `feat(backend): include players in answer response`

---

### T7: BoardRenderer — highlight layer and tile click events

**What**: Extend BoardRenderer to track tile Graphics, support highlight/clear of valid destinations (pulsing glow), and emit tile click events
**Where**: `frontend/src/game/pixi/BoardRenderer.ts`
**Depends on**: T1 (types)
**Reuses**: Existing BoardRenderer structure (container hierarchy, tile rendering)
**Requirement**: DEST-01, DEST-02, DEST-04, DEST-05, MOVE-01, MOVE-06

**Steps**:

1. Add `private tileGraphics: Map<number, Graphics>` — store reference to each tile's Graphics during rendering
2. During tile drawing, store each tile Graphics in the map (keyed by position index)
3. Add `private onTileClickCallback: ((position: number) => void) | null`
4. Implement `setOnTileClick(callback: (position: number) => void): void`
5. Implement `highlightTiles(positions: number[]): void`:
   - For each position, create a semi-transparent overlay circle behind the tile
   - Set `eventMode = 'static'` and `cursor = 'pointer'` on highlighted tiles
   - Add ticker-based pulsing animation (alpha oscillation 0.3↔0.7, 1s cycle)
   - Wire click handler to call `onTileClickCallback(position)`
6. Implement `clearHighlights(): void`:
   - Remove overlay graphics
   - Reset `eventMode = 'none'` on all tiles
   - Remove ticker animation

**Done when**:

- [ ] `highlightTiles([3, 5])` creates visible pulsing highlights on tiles 3 and 5
- [ ] Clicking a highlighted tile fires the registered callback with the position
- [ ] `clearHighlights()` removes all highlights and disables click events
- [ ] Non-highlighted tiles ignore clicks
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): BoardRenderer highlight layer and click events`

---

### T8: TokenRenderer — animateToken method

**What**: Add `animateToken()` method to TokenRenderer for smooth linear interpolation of a player's token from one tile position to another using PixiJS Ticker
**Where**: `frontend/src/game/pixi/TokenRenderer.ts`
**Depends on**: T7 (BoardRenderer tile tracking pattern reference)
**Reuses**: Existing TokenRenderer (renderTokens logic, offset calculation)
**Requirement**: ANIM-01, MOVE-03

**Steps**:

1. Add `private tokenGraphics: Map<string, Graphics>` to track each player's token by nickname
2. During `renderTokens`, store each generated Graphics in the map
3. Implement `animateToken(nickname: string, fromPos: number, toPos: number, layout: TilePosition[], onComplete: () => void): void`:
   - Look up start and end pixel positions from layout
   - Use `app.ticker.add()` to interpolate x,y linearly over 500ms
   - Bring animated token to front (`parent.setChildIndex`)
   - On complete: snap to final position, call `onComplete()`

**Done when**:

- [ ] `animateToken("Player1", 0, 5, layout, callback)` smoothly moves the token over ~500ms
- [ ] `onComplete` callback is called after animation finishes
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): TokenRenderer animateToken method`

---

### T9: BoardCanvas — new props and imperative ref

**What**: Extend BoardCanvas to accept `onTileClick`, `validDestinations` props and expose `animateToken` via `useImperativeHandle`
**Where**: `frontend/src/components/BoardCanvas.tsx`
**Depends on**: T7 (BoardRenderer highlights), T8 (TokenRenderer animation)
**Reuses**: Existing BoardCanvas (mount/unmount/resize logic)
**Requirement**: DEST-01, MOVE-01, MOVE-03

**Steps**:

1. Add props: `onTileClick?: (position: number) => void`, `validDestinations?: number[]`
2. Use `useEffect` to call `boardRenderer.highlightTiles(validDestinations)` when validDestinations changes (and `clearHighlights()` when empty/undefined)
3. Use `useEffect` to call `boardRenderer.setOnTileClick(onTileClick)` when callback changes
4. Convert to `forwardRef` and use `useImperativeHandle` to expose `animateToken(nickname, from, to, onComplete)` — delegates to tokenRenderer
5. Ensure existing functionality (mount, unmount, resize) is unchanged

**Done when**:

- [ ] Passing `validDestinations={[3,5]}` highlights those tiles on the canvas
- [ ] Passing `onTileClick` receives click events from highlighted tiles
- [ ] `ref.current.animateToken(...)` triggers token animation
- [ ] Existing rendering (board + tokens) still works
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): BoardCanvas props and imperative ref`

---

### T10: Create DiceRoller component

**What**: React component with "Rolar Dado" button, brief number-cycling animation (500ms), and dice result display
**Where**: `frontend/src/components/DiceRoller.tsx`
**Depends on**: T1 (types)
**Reuses**: Tailwind dark theme pattern from existing components
**Requirement**: TURN-01, TURN-02, TURN-03, TURN-04, TURN-05

**Steps**:

1. Props: `onRoll: () => Promise<number>`, `disabled: boolean`, `diceValue: number | null`, `visible: boolean`
2. Internal state: `isRolling: boolean`
3. On click: set `isRolling=true`, start 500ms interval cycling random 1-6 display, call `onRoll()`, when resolved show final value, set `isRolling=false`
4. Button disabled when `isRolling || disabled`
5. When `!visible`, render nothing
6. Display dice value prominently (large text) after roll
7. Style with Tailwind (bg-indigo-600 hover:bg-indigo-700, text-white, rounded-lg)

**Done when**:

- [ ] Button shows "🎲 Rolar Dado" when visible
- [ ] Click triggers animation (cycling numbers) for ~500ms then shows result
- [ ] Button disabled during roll and when `disabled=true`
- [ ] Hidden when `visible=false`
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): create DiceRoller component`

---

### T11: Create QuestionModal component

**What**: Modal overlay with question text, 4 answer buttons, category theming, and correct/incorrect feedback display
**Where**: `frontend/src/components/QuestionModal.tsx`
**Depends on**: T1 (types), T2 (CATEGORY_NAMES, CATEGORY_COLORS)
**Reuses**: `constants.ts` (CATEGORY_COLORS, CATEGORY_NAMES)
**Requirement**: QST-01, QST-02, QST-03, QST-04, QST-05, QST-06, QST-07, QST-08

**Steps**:

1. Props: `question: QuestionData | null`, `category: string | null`, `onAnswer: (answerId: string) => void`, `answerResult: AnswerResult | null`, `isLoading: boolean`
2. When `question === null`, render nothing
3. Render semi-transparent overlay (bg-black/60) covering full screen
4. Centered card (max-w-lg, bg-gray-800, rounded-2xl)
5. Top bar: category name in CATEGORY_NAMES + background in CATEGORY_COLORS
6. Body: question text (text-white, text-lg)
7. 4 answer buttons (bg-gray-700, hover:bg-gray-600, rounded-lg, full-width, text-left)
8. When `answerResult !== null`:
   - Selected answer turns green (#22C55E) if correct, red (#EF4444) if incorrect
   - If incorrect, also highlight the correct answer in green
   - Show "Correto!" or "Incorreto!" text
   - All buttons disabled
9. When `isLoading`, all buttons disabled (prevent double-submit)

**Done when**:

- [ ] Modal renders question with 4 answer options
- [ ] Category name and color shown in header
- [ ] Clicking answer calls `onAnswer(answerId)`
- [ ] Correct answer shows green feedback
- [ ] Incorrect answer shows red + reveals correct
- [ ] Buttons disabled during loading and feedback
- [ ] Semi-transparent overlay visible
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): create QuestionModal component`

---

### T12: Create CategoryPickerModal component

**What**: Modal for choosing a category when landing on Hub Central (position 0), showing 6 colored category buttons
**Where**: `frontend/src/components/CategoryPickerModal.tsx`
**Depends on**: T1 (types), T2 (CATEGORY_NAMES, CATEGORY_COLORS)
**Reuses**: `constants.ts`, visual pattern from ColorPicker component
**Requirement**: TILE-04, TILE-05

**Steps**:

1. Props: `onSelect: (category: string) => void`, `visible: boolean`
2. When `!visible`, render nothing
3. Semi-transparent overlay (bg-black/60)
4. Centered card with title "Escolha uma Categoria"
5. Grid of 6 buttons, each with category name and background color from CATEGORY_COLORS
6. On click: call `onSelect(category)`

**Done when**:

- [ ] Shows 6 colored category buttons when visible
- [ ] Click calls `onSelect` with the selected category string
- [ ] Hidden when `visible=false`
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): create CategoryPickerModal component`

---

### T13: Create TurnNotification component

**What**: Brief auto-dismissing notification banner ("Role Novamente!", "Sua vez!", "Vez de Bot X")
**Where**: `frontend/src/components/TurnNotification.tsx`
**Depends on**: None (React + Tailwind only)
**Reuses**: None
**Requirement**: TILE-03, FLOW-02, FLOW-03, FLOW-05

**Steps**:

1. Props: `message: string | null`, `duration?: number` (default 1500ms)
2. When `message === null`, render nothing
3. Render banner at top-center of screen (fixed position), fade-in transition
4. Auto-dismiss: `useEffect` with `setTimeout` to set internal visibility to false after `duration`ms
5. Style: bg-gray-800/90, text-white, rounded-lg, shadow-lg, px-6 py-3

**Done when**:

- [ ] Shows message text when `message` is not null
- [ ] Auto-hides after `duration` milliseconds
- [ ] Renders nothing when `message === null`
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): create TurnNotification component`

---

### T14: Enhance GameHUD — turn phase indicator and wedge display

**What**: Add turn phase badge and wedge (fatias) dots display to the existing GameHUD component
**Where**: `frontend/src/components/GameHUD.tsx`
**Depends on**: T1 (TurnPhase type), T2 (CATEGORY_NAMES, CATEGORY_COLORS)
**Reuses**: Existing GameHUD structure and styling
**Requirement**: HUD-P01, HUD-P02, HUD-P03, WEDGE-01, WEDGE-02

**Steps**:

1. Add props: `turnPhase?: TurnPhase`, `diceValue?: number | null`, `playerWedges?: Record<string, string[]>`
2. Add turn phase badge section:
   - `waitingRoll` → "🎲 Rolar Dado" (blue badge)
   - `waitingMove` → "📍 Escolher Destino (X)" with dice value (yellow badge)
   - `waitingAnswer` → "❓ Responder Pergunta" (purple badge)
3. Add wedge dots below each player in the player list:
   - Colored dots (width 12px, circular) matching CATEGORY_COLORS for each wedge
   - Empty border-only dots for categories not yet won (human player section only)
4. Keep existing HUD content unchanged (player list, current player, category legend)

**Done when**:

- [ ] Phase badge displays correct text/emoji for each turnPhase value
- [ ] Dice value shown in badge during waitingMove
- [ ] Wedge dots displayed per player (color-coded)
- [ ] Existing HUD layout and styling preserved
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): GameHUD turn phase and wedge display`

---

### T15: Refactor GamePage into turn orchestrator

**What**: Refactor GamePage to manage `GamePageState`, orchestrate the full turn cycle (roll → move → evaluate → question → feedback → next turn), wire all sub-components, and handle API errors
**Where**: `frontend/src/pages/GamePage.tsx`
**Depends on**: T3 (game-api), T4 (turn-logic), T9 (BoardCanvas enhanced), T10 (DiceRoller), T11 (QuestionModal), T12 (CategoryPickerModal), T13 (TurnNotification), T14 (GameHUD enhanced)
**Reuses**: Existing GamePage (layout, color assignment, location.state)
**Requirement**: TURN-01..05, DEST-01..05, MOVE-01..06, TILE-01..06, QST-01..08, FLOW-01..05, SYNC-01..06

**Steps**:

1. Add `useState<GamePageState>` with initial state derived from `location.state`
2. Implement `handleRollDice`:
   - Call `rollDice()` from game-api
   - Store dice value, compute `validDestinations` via `getValidDestinations()`
   - Update turnPhase to `waitingMove`
3. Implement `handleTileClick(position: number)`:
   - Set `isLoading=true`, call `moveToPosition(position)`
   - On response: clear highlights, trigger `boardCanvasRef.current.animateToken()`
   - After animation: evaluate tile type from response
   - `rollAgain` → notify "Role Novamente!", set waitingRoll
   - `category`/`hq` → call `fetchQuestion(tileCategory)`, show QuestionModal
   - `hub` → show CategoryPickerModal
4. Implement `handleCategorySelect(category)`:
   - Hide picker, call `fetchQuestion(category)`, show QuestionModal
5. Implement `handleAnswer(answerId)`:
   - Call `submitAnswer()`, show feedback in QuestionModal
   - After delay (1.5s correct / 2s incorrect): close modal
   - If correct: set waitingRoll (same player continues)
   - If incorrect: run bot-skip sequence (TurnNotification shows bot names), then enable roll
6. Implement bot-skip sequence:
   - Use `getBotsToSkip()` to get bot names
   - Show each bot name via TurnNotification (0.5s per bot)
   - Then show "Sua vez!" (1s)
   - Enable DiceRoller
7. Wire error handling: catch 400/network errors, show TurnNotification with error message, no state change
8. Render: <BoardCanvas>, <GameHUD>, <DiceRoller>, <QuestionModal>, <CategoryPickerModal>, <TurnNotification>

**Done when**:

- [ ] Full turn cycle works: roll → pick destination → token animates → question appears → answer → feedback → next roll (or pass turn)
- [ ] Roll Again tiles skip question and return to roll phase
- [ ] Hub Central shows category picker before question
- [ ] Bot turns are skipped with visual notification sequence
- [ ] API errors show notification without breaking state
- [ ] Double-click prevention works (buttons/tiles disabled during loading)
- [ ] HUD shows current phase and wedges
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): GamePage turn orchestrator`

---

### T16: Full build and lint validation

**What**: Run full build and lint on both frontend and backend to ensure no regressions
**Where**: `frontend/` and `backend/`
**Depends on**: T15

**Steps**:

1. `cd backend && npx nest build`
2. `cd backend && npx eslint src/`
3. `cd frontend && npx tsc --noEmit`
4. `cd frontend && npm run build`
5. `cd frontend && npx eslint src/`
6. Fix any errors found

**Done when**:

- [ ] Backend builds without errors
- [ ] Backend lint passes
- [ ] Frontend TypeScript check passes
- [ ] Frontend Vite build succeeds
- [ ] Frontend lint passes

**Verify**: `cd backend && npx nest build && npx eslint src/ && cd ../frontend && npx tsc --noEmit && npm run build && npx eslint src/`

**Commit**: `chore: fix lint and build issues` (only if fixes needed)

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3 ──→ T4

Phase 2 (Parallel):
  T4 complete, then:
    ├── T5 [P]  (backend: advanceTurn)
    └── T6 [P]  (backend: answer response)

Phase 3 (Sequential):
  T5, T6 complete, then:
    T7 ──→ T8 ──→ T9

Phase 4 (Parallel):
  T9 complete, then:
    ├── T10 [P]  (DiceRoller)
    ├── T11 [P]  (QuestionModal)
    ├── T12 [P]  (CategoryPickerModal)
    ├── T13 [P]  (TurnNotification)
    └── T14 [P]  (GameHUD)

Phase 5 (Sequential):
  T10..T14 complete, then:
    T15

Phase 6 (Sequential):
  T15 complete, then:
    T16
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Add types to types.ts | 1 file, type definitions | ✅ Granular |
| T2: Add CATEGORY_NAMES | 1 constant in 1 file | ✅ Granular |
| T3: Create game-api.ts | 1 new service file, 4 functions | ✅ Granular |
| T4: Create turn-logic.ts | 1 new file, 4 functions | ✅ Granular |
| T5: Modify advanceTurn | 1 method in 1 file | ✅ Granular |
| T6: Enhance answer response | 1 method in 1 file | ✅ Granular |
| T7: BoardRenderer highlights | 1 class, add 3 methods | ✅ Granular |
| T8: TokenRenderer animation | 1 class, add 1 method | ✅ Granular |
| T9: BoardCanvas props/ref | 1 component, add props + ref | ✅ Granular |
| T10: DiceRoller component | 1 new component | ✅ Granular |
| T11: QuestionModal component | 1 new component | ✅ Granular |
| T12: CategoryPickerModal | 1 new component | ✅ Granular |
| T13: TurnNotification | 1 new component | ✅ Granular |
| T14: GameHUD enhancements | 1 component, add 2 sections | ✅ Granular |
| T15: GamePage orchestrator | 1 component, full refactor | ⚠️ Large but cohesive — all pieces are wired in one component |
| T16: Build validation | Build + lint commands | ✅ Granular |

**Note on T15**: This is the largest task — it wires all 6+ sub-components and manages the full state machine. Splitting further would create artificial boundaries within a single component's logic. The steps are well-defined and sequential.

---

## Requirement Traceability

| Requirement | Tasks | Coverage |
| --- | --- | --- |
| TURN-01..05 (Rolagem de Dado) | T1, T3, T10, T15 | Types → API → Component → Orchestration |
| DEST-01..05 (Destinos Válidos) | T1, T4, T7, T9, T15 | Types → Logic → Render → Canvas → Orchestration |
| MOVE-01..06 (Seleção e Movimentação) | T1, T3, T7, T8, T9, T15 | Types → API → Click → Animate → Canvas → Orchestration |
| TILE-01..06 (Avaliação de Tipo) | T2, T3, T4, T12, T15 | Constants → API → Logic → Picker → Orchestration |
| QST-01..08 (Modal de Pergunta) | T1, T2, T3, T11, T15 | Types → Constants → API → Modal → Orchestration |
| FLOW-01..05 (Continuação/Fim) | T5, T13, T15 | Backend skip → Notification → Orchestration |
| SYNC-01..06 (Integração Estado) | T1, T3, T4, T6, T15 | Types → API → Logic → Backend → Orchestration |
| HUD-P01..03 (Fase no HUD) | T1, T2, T14 | Types → Constants → HUD |
| WEDGE-01..02 (Fatias no HUD) | T1, T6, T14 | Types → Backend → HUD |
| ANIM-01 (Animação Token) | T8, T9, T15 | Renderer → Canvas → Orchestration |
