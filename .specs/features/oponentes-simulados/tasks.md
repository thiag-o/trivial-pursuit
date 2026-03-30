# MVP-6: Oponentes Simulados — Tasks

**Design**: `.specs/features/oponentes-simulados/design.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation — Types & Backend Core (Sequential)

Backend interface, advanceTurn fix, playBotTurns method.

```
T1 → T2 → T3
```

### Phase 2: Backend Integration (Sequential)

Wire playBotTurns into processAnswer and controller response.

```
T3 → T4 → T5
```

### Phase 3: Frontend Types & Animation (Sequential)

Frontend types, then animation logic.

```
T5 → T6 → T7
```

### Phase 4: Validation (Sequential)

Full build check.

```
T8
```

---

## Task Breakdown

### T1: Add BotTurnResult interface to backend

**What**: Create `BotTurnResult` interface for bot turn data returned by `playBotTurns`
**Where**: `backend/src/common/interfaces/game-state.interface.ts`
**Depends on**: None
**Reuses**: Existing interfaces file
**Requirement**: BOT-08

**Steps**:

1. Add `BotTurnResult` interface with fields: `botNickname: string`, `diceValue: number`, `fromPosition: number`, `toPosition: number`, `tileType: string`, `tileCategory: string | null`, `answerCorrect: boolean | null`, `wedgeEarned: string | null`, `isFinalChallenge: boolean`
2. Export from `index.ts`

**Done when**:

- [x] `BotTurnResult` interface exported
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): add BotTurnResult interface`

---

### T2: Modify advanceTurn to stop at next player (not skip bots)

**What**: Change `advanceTurn` from a do-while that skips bots to a simple single increment to next player
**Where**: `backend/src/game/game.service.ts`
**Depends on**: None
**Reuses**: Existing `advanceTurn` method
**Requirement**: BOT-01

**Steps**:

1. Replace the `do { ... } while (!game.players[...].isHuman)` loop with a single `game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length`
2. Keep `game.turnPhase = TurnPhase.WAITING_ROLL` and `game.lastDiceRoll = null`

**Done when**:

- [x] `advanceTurn` increments by exactly 1 player (no skip loop)
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): advanceTurn stops at next player instead of skipping bots`

---

### T3: Implement playBotTurns method on GameService

**What**: New method `playBotTurns(game: GameState): BotTurnResult[]` that executes all bot turns until a human player or game over
**Where**: `backend/src/game/game.service.ts`
**Depends on**: T1, T2
**Reuses**: `BoardConfig.getValidDestinations`, `BoardConfig.getTile`, wedge/Final Challenge logic patterns from `processAnswer`
**Requirement**: BOT-01, BOT-02, BOT-03, BOT-04, BOT-05

**Steps**:

1. Create `playBotTurns(game: GameState): BotTurnResult[]` method
2. Loop while current player `!isHuman` and `game.status !== FINISHED`:
   a. Get current bot player
   b. Inner loop (max 10 rolls per bot to prevent infinite Roll Again):
   - Roll d6
   - Get valid destinations, filter hub if mustLeaveHub
   - Pick random destination, move bot
   - Get tile info
   - If rollAgain: push result with `answerCorrect: null`, continue inner loop
   - If hub + 6 wedges: Final Challenge (50% correct). Correct → FINISHED + winner. Wrong → mustLeaveHub, break inner loop.
   - If hub + <6 wedges: 50% answer. Correct → continue. Wrong → break.
   - If category/hq: 50% answer. If HQ + correct + new category → push wedge. Correct → continue. Wrong → break.
     c. After inner loop: advance to next player
3. Set `game.turnPhase = WAITING_ROLL`, `game.lastDiceRoll = null`
4. Save game state

**Done when**:

- [x] Method executes bot turns correctly (roll, move, answer at 50%)
- [x] Roll Again tiles cause re-roll (max 10)
- [x] HQ correct awards wedge (no duplicate)
- [x] Final Challenge correct sets game finished + winner
- [x] Final Challenge incorrect sets mustLeaveHub
- [x] Loop stops at next human or game over
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): implement playBotTurns for simulated opponent turns`

---

### T4: Integrate playBotTurns into processAnswer return

**What**: Modify `processAnswer` to call `playBotTurns` after `advanceTurn` and return the results. Change return type to include `botTurns`.
**Where**: `backend/src/game/game.service.ts`
**Depends on**: T3
**Reuses**: Existing `processAnswer` flow
**Requirement**: BOT-08

**Steps**:

1. Change `processAnswer` return type to `{ game: GameState; botTurns: BotTurnResult[] }`
2. After each `advanceTurn(game)` call, run `const botTurns = this.playBotTurns(game)`
3. When no advanceTurn is called (correct answer, same player continues), set `botTurns = []`
4. Return `{ game, botTurns }`

**Done when**:

- [x] `processAnswer` returns `{ game, botTurns }` instead of just `GameState`
- [x] `botTurns` populated after wrong answers, empty after correct answers
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): return botTurns from processAnswer`

---

### T5: Update QuestionsController to include botTurns in response

**What**: Modify the `answer()` method in QuestionsController to destructure `{ game, botTurns }` from processAnswer and include `botTurns` in the response
**Where**: `backend/src/questions/questions.controller.ts`
**Depends on**: T4
**Reuses**: Existing answer endpoint
**Requirement**: BOT-08

**Steps**:

1. Destructure `const { game: updatedGame, botTurns } = this.gameService.processAnswer(...)`
2. Add `botTurns` to the response object

**Done when**:

- [x] Answer response includes `botTurns: BotTurnResult[]`
- [x] Existing response fields unchanged
- [x] No TypeScript errors: `cd backend && npx tsc --noEmit`

**Verify**: `cd backend && npx tsc --noEmit`

**Commit**: `feat(backend): include botTurns in answer endpoint response`

---

### T6: Add BotTurnResult type and update AnswerResponse in frontend

**What**: Add `BotTurnResult` type and extend `AnswerResponse` with `botTurns` field
**Where**: `frontend/src/game/types.ts`
**Depends on**: T5 (for consistency)
**Reuses**: Existing types file
**Requirement**: BOT-08

**Steps**:

1. Add `BotTurnResult` interface matching backend shape
2. Add `botTurns: BotTurnResult[]` to `AnswerResponse`

**Done when**:

- [x] `BotTurnResult` type exported
- [x] `AnswerResponse` includes `botTurns`
- [x] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): add BotTurnResult type and extend AnswerResponse`

---

### T7: Replace runBotSkipSequence with runBotTurnSequence in GamePage

**What**: Replace the bot-skip visual sequence with a full bot-turn animation that reads from `botTurns[]` in the answer response: for each bot action, show notification, animate token movement, show result
**Where**: `frontend/src/pages/GamePage.tsx`
**Depends on**: T6
**Reuses**: Existing `showNotification`, `boardRef.current.animateToken`, `buildPlayerTokens`
**Requirement**: BOT-06, BOT-07

**Steps**:

1. Rename/replace `runBotSkipSequence` with `runBotTurnSequence(botTurns: BotTurnResult[], updatedPlayers: PlayerData[], newCurrentPlayer: string, updatedTokens: PlayerToken[])`
2. For each `BotTurnResult` in the array:
   a. Show "Vez de {botNickname}" notification (pause 500ms)
   b. Show "🎲 {botNickname} tirou {diceValue}" (pause 500ms)
   c. Animate token from `fromPosition` to `toPosition` (500ms)
   d. Update tokens state to reflect new position
   e. If `answerCorrect === null` (rollAgain): show "🎲 Joga novamente!" (300ms)
   f. If `answerCorrect === true`: show "✅ {botNickname} acertou!" (500ms)
   g. If `answerCorrect === false`: show "❌ {botNickname} errou!" (500ms)
   h. If `wedgeEarned`: briefly note it (500ms)
3. After all bot turns: check if game is over (from gameState in the original answer response)
   - If over and winner !== human: set gameOverState for DefeatScreen
4. If game continues: show "Sua vez!" (1000ms), then set waitingRoll state
5. In `handleAnswer`: pass `res.botTurns` (or `[]` if undefined) to `runBotTurnSequence` instead of calling `runBotSkipSequence`
6. Also call `runBotTurnSequence` for failed Final Challenge wrong answer path

**Done when**:

- [x] Bot turns animate with notifications, token movement, and result feedback
- [x] Bot wedge earned is visible (notification or token update)
- [x] Bot victory triggers DefeatScreen
- [x] Normal wrong answer flows through bot turn sequence
- [x] Failed Final Challenge flows through bot turn sequence
- [x] Game continues correctly after bot sequence (human gets waitingRoll)
- [x] No TypeScript errors: `cd frontend && npx tsc --noEmit`

**Verify**: `cd frontend && npx tsc --noEmit`

**Commit**: `feat(frontend): replace bot skip with full bot turn animation sequence`

---

### T8: Full build and lint validation

**What**: Run full TypeScript compilation and lint for both backend and frontend
**Where**: Entire project
**Depends on**: T1–T7

**Steps**:

1. `cd backend && npx tsc --noEmit`
2. `cd backend && npx eslint .`
3. `cd frontend && npx tsc --noEmit`
4. `cd frontend && npx eslint .`
5. `cd frontend && npx vite build`

**Done when**:

- [x] Backend TypeScript compilation passes
- [x] Backend lint passes
- [x] Frontend TypeScript compilation passes
- [x] Frontend lint passes
- [x] Frontend Vite build succeeds

**Verify**: All 5 commands exit code 0

**Commit**: `chore: validate full build after MVP-6 implementation`

---

## Parallel Execution Map

```
Phase 1 (Sequential — Foundation):
  T1 ──→ T2 ──→ T3

Phase 2 (Sequential — Backend Integration):
  T4 ──→ T5

Phase 3 (Sequential — Frontend):
  T6 ──→ T7

Phase 4 (Sequential — Validation):
  T8
```

---

## Task Granularity Check

| Task                                | Scope                             | Status                                |
| ----------------------------------- | --------------------------------- | ------------------------------------- |
| T1: Add BotTurnResult interface     | 1 interface + export              | ✅ Granular                           |
| T2: Modify advanceTurn              | 1 method, ~3 lines changed        | ✅ Granular                           |
| T3: Implement playBotTurns          | 1 new method (~60-80 lines)       | ✅ Granular (one method, one concern) |
| T4: Integrate into processAnswer    | 1 method, return type change      | ✅ Granular                           |
| T5: Update QuestionsController      | 1 method, ~3 lines changed        | ✅ Granular                           |
| T6: Add frontend types              | 1 types file                      | ✅ Granular                           |
| T7: Replace bot skip with bot turns | 1 page, replace function + caller | ⚠️ Largest task but single concern    |
| T8: Validation                      | Build check                       | ✅ Granular                           |
