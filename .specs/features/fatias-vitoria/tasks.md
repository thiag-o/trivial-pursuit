# MVP-5: Fatias e Vitória — Tasks

**Design**: `.specs/features/fatias-vitoria/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation — Types & Enums (Sequential)

Backend enums and interfaces, frontend types, and turn-logic helper. Everything downstream depends on these.

```
T1 → T2 → T3 → T4
```

### Phase 2: Backend Logic (Sequential)

Core backend changes: GameService move() Final Challenge logic, processAnswer() victory/defeat, QuestionsController phase validation, GameController response shape.

```
T5 → T6 → T7 → T8
```

### Phase 3: Frontend Components (Parallel OK)

New UI components that are independent of each other. All depend only on Phase 1 types.

```
       ┌→ T9  [P] ─┐
T8 ──┤→ T10 [P] ─├──→ Phase 4
       └→ T11 [P] ─┘
```

### Phase 4: Frontend Integration — GamePage (Sequential)

Wire Final Challenge flow, victory/defeat detection, and wedge notification into GamePage orchestrator.

```
T12 → T13
```

### Phase 5: P2/P3 Enhancements (Parallel OK)

Token wedge segments (P2), wedge notification (P2), HUD progress hints (P3). Independent of each other.

```
        ┌→ T14 [P] ─┐
T13 ──┤              ├──→ Phase 6
        └→ T15 [P] ─┘
```

### Phase 6: Validation (Sequential)

Full build and lint for both backend and frontend.

```
T16
```

---

## Task Breakdown

### T1: Add WAITING_FINAL_ANSWER to backend TurnPhase enum

**What**: Add `WAITING_FINAL_ANSWER = 'waitingFinalAnswer'` to the `TurnPhase` enum so backend can distinguish the Final Challenge answer phase from a normal answer phase
**Where**: `backend/src/common/enums/turn-phase.enum.ts`
**Depends on**: None
**Reuses**: Existing `TurnPhase` enum
**Requirement**: Backend — Lógica de Desafio Final AC-5

**Steps**:

1. Add `WAITING_FINAL_ANSWER = 'waitingFinalAnswer'` entry to the enum

**Done when**:

- [x] `TurnPhase.WAITING_FINAL_ANSWER` exists and equals `'waitingFinalAnswer'`
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): add WAITING_FINAL_ANSWER to TurnPhase enum`

---

### T2: Add mustLeaveHub to Player interface and finalChallengeCategory to GameState

**What**: Extend `Player` with `mustLeaveHub: boolean` and `GameState` with `finalChallengeCategory: string | null` fields as designed
**Where**: `backend/src/common/interfaces/player.interface.ts`, `backend/src/common/interfaces/game-state.interface.ts`
**Depends on**: T1
**Reuses**: Existing interfaces
**Requirement**: Backend — Lógica de Desafio Final AC-2, AC-3; Erro no Desafio Final AC-1

**Steps**:

1. Add `mustLeaveHub: boolean` to `Player` interface
2. Add `finalChallengeCategory: string | null` to `GameState` interface
3. Update `GameStateStore.createGame()` to initialize `mustLeaveHub: false` for all players
4. Update `GameStateStore.createGame()` to initialize `finalChallengeCategory: null`

**Done when**:

- [x] `Player.mustLeaveHub` field present in interface
- [x] `GameState.finalChallengeCategory` field present in interface
- [x] `createGame()` initializes both new fields
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): add mustLeaveHub and finalChallengeCategory to data models`

---

### T3: Add frontend types for MVP-5

**What**: Add `'waitingFinalAnswer'` to `TurnPhase` union, `GameOverState` interface, extend `PlayerToken` with `wedges`, extend `MoveResponse` with `isFinalChallenge`/`finalCategory`, extend `AnswerResponse` with `winner`, extend `GamePageState` with `isFinalChallenge`/`gameOverState`/`earnedWedgeCategory`
**Where**: `frontend/src/game/types.ts`
**Depends on**: T1 (for consistency with backend enum value)
**Reuses**: Existing types.ts definitions
**Requirement**: All P1 stories — frontend types are prerequisites

**Steps**:

1. Add `'waitingFinalAnswer'` to `TurnPhase` union type
2. Add `GameOverState` interface (`type: 'victory' | 'defeat'`, `winnerNickname`, `winnerWedges`)
3. Add `wedges: string[]` to `PlayerToken` interface
4. Add `isFinalChallenge: boolean` and `finalCategory: string | null` to `MoveResponse`
5. Add `winner: string | null` to `AnswerResponse.gameState`
6. Add `isFinalChallenge: boolean`, `gameOverState: GameOverState | null`, `earnedWedgeCategory: string | null` to `GamePageState`

**Done when**:

- [x] All new types/fields defined and exported
- [x] Existing types unchanged (except extensions)
- [x] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add MVP-5 types for wedges, victory, and final challenge`

---

### T4: Add filterHubIfMustLeave to turn-logic.ts

**What**: New function `filterHubIfMustLeave(destinations: number[], mustLeaveHub: boolean): number[]` that filters out position 0 when `mustLeaveHub` is true
**Where**: `frontend/src/game/turn-logic.ts`
**Depends on**: T3
**Reuses**: Existing `turn-logic.ts` module
**Requirement**: Erro no Desafio Final AC-2

**Steps**:

1. Add `filterHubIfMustLeave` function: return `destinations.filter(d => !(mustLeaveHub && d === 0))`
2. Export the function

**Done when**:

- [x] Function exported and filters position 0 when `mustLeaveHub=true`
- [x] Returns destinations unchanged when `mustLeaveHub=false`
- [x] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add filterHubIfMustLeave to turn-logic`

---

### T5: Extend GameService.move() with Final Challenge detection and mustLeaveHub enforcement

**What**: When player lands on hub (pos 0) with 6 wedges → set `turnPhase = WAITING_FINAL_ANSWER`, pick random category, store in `finalChallengeCategory`. When `mustLeaveHub = true` → exclude pos 0 from valid destinations. After moving away from hub → reset `mustLeaveHub = false`.
**Where**: `backend/src/game/game.service.ts`
**Depends on**: T1, T2
**Reuses**: Existing `move()` method logic
**Requirement**: Hub Central com 6 Fatias AC-1/AC-2; Erro no Desafio Final AC-2/AC-3/AC-4; Backend AC-3/AC-4

**Steps**:

1. In `move()`, after updating position: if player landed on hub (pos 0) and `player.wedges.length === 6`, set `game.turnPhase = TurnPhase.WAITING_FINAL_ANSWER`, pick random category from `CATEGORY_CYCLE`, store in `game.finalChallengeCategory`
2. In `getValidDestinations` or `move()` validation: if `currentPlayer.mustLeaveHub === true`, filter out position 0 from valid destinations
3. After a successful move: if player was on position 0 and `mustLeaveHub` was true, reset `mustLeaveHub = false`

**Done when**:

- [x] Landing on hub with 6 wedges sets `WAITING_FINAL_ANSWER` and picks random `finalChallengeCategory`
- [x] `mustLeaveHub = true` excludes position 0 from valid destinations
- [x] Moving away from hub resets `mustLeaveHub = false`
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): add Final Challenge detection and mustLeaveHub to move()`

---

### T6: Extend GameService.processAnswer() with victory and mustLeaveHub logic

**What**: When `turnPhase === WAITING_FINAL_ANSWER` and answer is correct → set `status = FINISHED`, `winner = player.nickname`. When incorrect → set `mustLeaveHub = true`, advance turn.
**Where**: `backend/src/game/game.service.ts`
**Depends on**: T5
**Reuses**: Existing `processAnswer()` flow
**Requirement**: Hub Central com 6 Fatias AC-4/AC-5; Backend AC-1/AC-2

**Steps**:

1. In `processAnswer()`, add a branch for `WAITING_FINAL_ANSWER`:
   - If correct: `game.status = GameStatus.FINISHED`, `game.winner = currentPlayer.nickname`, clear `finalChallengeCategory`
   - If incorrect: `currentPlayer.mustLeaveHub = true`, clear `finalChallengeCategory`, advance turn (call `advanceTurn`)
2. Ensure normal HQ wedge logic remains unchanged (already existing)

**Done when**:

- [x] Correct Final Challenge answer → `status=FINISHED`, `winner` set
- [x] Incorrect Final Challenge answer → `mustLeaveHub = true`, turn advanced
- [x] Normal HQ wedge flow unaffected
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): add victory and failed Final Challenge logic to processAnswer()`

---

### T7: Extend QuestionsController to accept WAITING_FINAL_ANSWER phase

**What**: Allow `GET /questions/:category` endpoint to serve questions when turn phase is `WAITING_FINAL_ANSWER` (currently only allows `WAITING_ANSWER`)
**Where**: `backend/src/questions/questions.controller.ts`
**Depends on**: T1
**Reuses**: Existing phase validation logic
**Requirement**: Hub Central com 6 Fatias AC-3; Backend AC-5

**Steps**:

1. Find the phase validation check in `getByCategory()` or equivalent
2. Expand it to accept both `WAITING_ANSWER` and `WAITING_FINAL_ANSWER`

**Done when**:

- [x] Questions can be fetched during `WAITING_FINAL_ANSWER` phase
- [x] `WAITING_ANSWER` still works as before
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): allow question fetch during WAITING_FINAL_ANSWER phase`

---

### T8: Extend GameController.move() response with isFinalChallenge and finalCategory

**What**: Add `isFinalChallenge` and `finalCategory` fields to the move endpoint response
**Where**: `backend/src/game/game.controller.ts`
**Depends on**: T5
**Reuses**: Existing move() controller
**Requirement**: Backend response enhancement (design API Changes)

**Steps**:

1. After calling `gameService.move()`, read `game.turnPhase` and `game.finalChallengeCategory`
2. Add to response: `isFinalChallenge: game.turnPhase === TurnPhase.WAITING_FINAL_ANSWER`, `finalCategory: game.finalChallengeCategory`

**Done when**:

- [x] Move response includes `isFinalChallenge: boolean`
- [x] Move response includes `finalCategory: string | null`
- [x] Normal moves return `isFinalChallenge: false`, `finalCategory: null`
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): add isFinalChallenge and finalCategory to move response`

---

### T9: Create VictoryScreen component

**What**: New React component showing a semi-transparent overlay with congratulations message, 6 wedge icons, and "Jogar Novamente" button
**Where**: `frontend/src/components/VictoryScreen.tsx`
**Depends on**: T3
**Reuses**: `constants.ts` (CATEGORY_COLORS, CATEGORY_NAMES), overlay pattern from QuestionModal
**Requirement**: Tela de Vitória AC-1/AC-2/AC-3/AC-4

**Steps**:

1. Create `VictoryScreen` component with props: `nickname: string`, `wedges: string[]`, `onPlayAgain: () => void`
2. Render semi-transparent overlay (fixed position, z-50+)
3. Show "Parabéns, {nickname}! Você venceu!" heading
4. Show 6 colored wedge circles (using CATEGORY_COLORS)
5. "Jogar Novamente" button calling `onPlayAgain`

**Done when**:

- [x] Component renders overlay with nickname, wedges, and button
- [x] Semi-transparent background, board visible behind
- [x] "Jogar Novamente" button fires `onPlayAgain` callback
- [x] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): create VictoryScreen component`

---

### T10: Create DefeatScreen component

**What**: New React component showing a semi-transparent overlay with defeat message, winner's wedges, and "Jogar Novamente" button
**Where**: `frontend/src/components/DefeatScreen.tsx`
**Depends on**: T3
**Reuses**: `constants.ts`, same overlay pattern as VictoryScreen
**Requirement**: Tela de Derrota AC-1/AC-2/AC-3/AC-4

**Steps**:

1. Create `DefeatScreen` component with props: `winnerNickname: string`, `winnerWedges: string[]`, `onPlayAgain: () => void`
2. Render semi-transparent overlay
3. Show "{winnerNickname} venceu a partida!" heading
4. Show winner's wedge icons
5. "Jogar Novamente" button calling `onPlayAgain`

**Done when**:

- [x] Component renders overlay with winner info and button
- [x] Semi-transparent background, board visible behind
- [x] "Jogar Novamente" button fires `onPlayAgain` callback
- [x] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): create DefeatScreen component`

---

### T11: Extend QuestionModal with isFinalChallenge gold theme

**What**: Add `isFinalChallenge` prop to `QuestionModal`. When true, show "🏆 DESAFIO FINAL" header and gold border/glow styling
**Where**: `frontend/src/components/QuestionModal.tsx`
**Depends on**: T3
**Reuses**: Existing QuestionModal component
**Requirement**: Hub Central com 6 Fatias AC-3

**Steps**:

1. Add optional prop `isFinalChallenge?: boolean`
2. When true: add gold border (`border-yellow-400`), change header to "🏆 DESAFIO FINAL"
3. Normal mode remains unchanged

**Done when**:

- [x] `isFinalChallenge` prop accepted
- [x] Gold theme renders when prop is true
- [x] Normal theme unchanged when prop is false/undefined
- [x] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add Final Challenge gold theme to QuestionModal`

---

### T12: Integrate Final Challenge flow into GamePage

**What**: Extend `GamePage` to handle: (1) Final Challenge detection from move response → fetch question with system-chosen category → show gold QuestionModal; (2) Victory detection from answer response → show VictoryScreen; (3) Defeat detection → show DefeatScreen; (4) mustLeaveHub enforcement in destination filtering
**Where**: `frontend/src/pages/GamePage.tsx`
**Depends on**: T3, T4, T8, T9, T10, T11
**Reuses**: Existing `handleTileClick`, `handleAnswer`, turn flow
**Requirement**: All P1 stories — frontend integration

**Steps**:

1. Add `isFinalChallenge`, `gameOverState`, `earnedWedgeCategory` to `GamePageState` initialization
2. In `handleTileClick()`: after move API, check `isFinalChallenge` from response → if true, set state, fetch question using `finalCategory`, show QuestionModal with `isFinalChallenge=true`
3. In `handleAnswer()`: after answer API, check `gameState.status === 'finished'` → determine victory or defeat → set `gameOverState`
4. In `handleAnswer()`: detect wedge change by comparing player wedges before/after → set `earnedWedgeCategory`
5. In destination computation: apply `filterHubIfMustLeave` using `mustLeaveHub` from game state
6. Render `VictoryScreen` when `gameOverState?.type === 'victory'`
7. Render `DefeatScreen` when `gameOverState?.type === 'defeat'`
8. Pass `isFinalChallenge` prop to `QuestionModal`
9. "Jogar Novamente" handler: `navigate('/start')`

**Done when**:

- [ ] Final Challenge flow works: hub + 6 wedges → system category → gold QuestionModal
- [ ] Victory triggers VictoryScreen overlay
- [ ] Defeat triggers DefeatScreen overlay (testable via manual state)
- [ ] mustLeaveHub filters hub from destinations
- [ ] Wedge changes detected for notification
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): integrate Final Challenge, victory, defeat into GamePage`

---

### T13: Add WedgeNotification component and integrate into GamePage

**What**: Create `WedgeNotification` toast component and wire it into GamePage via `earnedWedgeCategory` state
**Where**: `frontend/src/components/WedgeNotification.tsx`, `frontend/src/pages/GamePage.tsx`
**Depends on**: T12
**Reuses**: `TurnNotification` pattern, `constants.ts` CATEGORY_COLORS/CATEGORY_NAMES
**Requirement**: Notificação de Fatia Conquistada AC-1/AC-2/AC-3; Conquista de Fatia AC-3

**Steps**:

1. Create `WedgeNotification` component with props: `category: string | null`, `onDismiss: () => void`
2. When `category !== null`: render banner "Fatia de {CATEGORY_NAMES[category]} conquistada! 🎉" with category color background
3. Auto-dismiss after 2000ms via `useEffect` + `setTimeout` calling `onDismiss`
4. `category === null` → render nothing
5. In GamePage: render `<WedgeNotification category={state.earnedWedgeCategory} onDismiss={...} />`
6. `onDismiss` resets `earnedWedgeCategory` to null

**Done when**:

- [ ] Notification renders with correct category name and color
- [ ] Auto-dismisses after 2 seconds
- [ ] Renders nothing when `category === null`
- [ ] Integrated into GamePage
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add WedgeNotification component with GamePage integration`

---

### T14: Add wedge segments to TokenRenderer (P2)

**What**: Draw colored pie-slice arcs on each player token representing collected wedges
**Where**: `frontend/src/game/pixi/TokenRenderer.ts`
**Depends on**: T3 (PlayerToken.wedges field)
**Reuses**: Existing `renderTokens()` flow, CATEGORY_COLORS from constants
**Requirement**: Fatia Visual no Token PixiJS AC-1/AC-2/AC-3

**Steps**:

1. Add numeric hex color map for PixiJS (e.g., `0x3B82F6` for geography blue)
2. In `renderTokens()`, after drawing main token circle, iterate `token.wedges`
3. For each wedge: draw a 60° filled arc segment around the token using `Graphics.arc()`
4. Category order: geography=0°, entertainment=60°, history=120°, art=180°, science=240°, sports=300°
5. In GamePage `buildPlayerTokens()`: map player wedges to `PlayerToken.wedges`

**Done when**:

- [ ] Tokens with wedges show colored arc segments
- [ ] 0 wedges → plain token; 6 wedges → full ring
- [ ] Colors match category colors
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add wedge segments to TokenRenderer`

---

### T15: Add progress hints to GameHUD (P3)

**What**: Show contextual hints based on human player's wedge count: at 5 wedges "Falta 1 fatia!", at 6 wedges "Todas as fatias! Vá ao Hub Central"
**Where**: `frontend/src/components/GameHUD.tsx`
**Depends on**: T3 (types)
**Reuses**: Existing GameHUD structure and props
**Requirement**: Indicador de Progresso para Desafio Final AC-1/AC-2

**Steps**:

1. Compute human player wedge count from existing `playerWedges` prop
2. At 5 wedges: render hint "Falta 1 fatia! Conquiste e volte ao Hub Central."
3. At 6 wedges: render hint "Todas as fatias! Vá ao Hub Central para o Desafio Final."
4. At < 5 wedges: no hint

**Done when**:

- [ ] 5 wedges shows "Falta 1 fatia!" hint
- [ ] 6 wedges shows "go to hub" hint
- [ ] < 5 wedges shows no hint
- [ ] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add progress hints to GameHUD`

---

### T16: Full build and lint validation

**What**: Run full TypeScript compilation and lint for both backend and frontend to ensure no regressions
**Where**: Entire project
**Depends on**: T1–T15
**Reuses**: Existing build/lint configs

**Steps**:

1. `cd backend && npx tsc --noEmit`
2. `cd backend && npx eslint .`
3. `cd frontend && npx tsc --noEmit`
4. `cd frontend && npx eslint .`
5. `cd frontend && npx vite build`

**Done when**:

- [ ] Backend TypeScript compilation passes
- [ ] Backend lint passes
- [ ] Frontend TypeScript compilation passes
- [ ] Frontend lint passes
- [ ] Frontend Vite build succeeds

**Verify**: Run all 5 commands above — all exit code 0

**Commit**: `chore: validate full build after MVP-5 implementation`

---

## Parallel Execution Map

```
Phase 1 (Sequential — Foundation):
  T1 ──→ T2 ──→ T3 ──→ T4

Phase 2 (Sequential — Backend Logic):
  T5 ──→ T6
  T7 (parallel with T5-T6, depends only on T1)
  T8 (depends on T5)

Phase 3 (Parallel — Frontend Components):
  T9  [P] ─┐
  T10 [P] ─┤ All depend on T3 + Phase 2 complete
  T11 [P] ─┘

Phase 4 (Sequential — Integration):
  T12 ──→ T13

Phase 5 (Parallel — Enhancements):
  T14 [P] ─┐
  T15 [P] ─┘

Phase 6 (Sequential — Validation):
  T16
```

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1: Add enum value | 1 enum | ✅ Granular |
| T2: Add interface fields + init | 2 interfaces + 1 store | ✅ Granular (cohesive) |
| T3: Add frontend types | 1 types file | ✅ Granular |
| T4: Add filter function | 1 function | ✅ Granular |
| T5: Extend move() | 1 method | ✅ Granular |
| T6: Extend processAnswer() | 1 method | ✅ Granular |
| T7: Extend QuestionsController | 1 validation check | ✅ Granular |
| T8: Extend GameController response | 1 response shape | ✅ Granular |
| T9: Create VictoryScreen | 1 component | ✅ Granular |
| T10: Create DefeatScreen | 1 component | ✅ Granular |
| T11: Extend QuestionModal | 1 prop + conditional styling | ✅ Granular |
| T12: Integrate GamePage | 1 orchestrator | ⚠️ Larger (necessary — orchestrator ties everything) |
| T13: Create WedgeNotification + integrate | 1 component + 1 integration | ✅ Granular |
| T14: Extend TokenRenderer | 1 rendering addition | ✅ Granular |
| T15: Extend GameHUD | 1 UI hint | ✅ Granular |
| T16: Full validation | Build/lint | ✅ Granular |
