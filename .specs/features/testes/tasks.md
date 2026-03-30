# MVP-7: Testes — Tasks

**Design**: Skipped (auto-sized — test infrastructure already exists)
**Status**: Complete

---

## Execution Plan

### Phase 1: Backend Unit Tests (Parallel OK)

Independent test files for each service.

```
     ┌→ T1 [P] ─┐
  ──┤→ T2 [P] ─├──→ Phase 2
     └→ T3 [P] ─┘
```

### Phase 2: Integration Test (Sequential)

```
T4
```

### Phase 3: Validation

```
T5
```

---

## Task Breakdown

### T1: GameService unit tests

**What**: Comprehensive unit tests for GameService covering startGame, rollDice, move, processAnswer, and playBotTurns
**Where**: `backend/src/game/game.service.spec.ts`
**Depends on**: None
**Requirement**: P1: Backend Game Logic Tests

**Steps**:

1. Create test file with NestJS testing module setup (GameService, GameStateStore, BoardConfig)
2. Test `startGame`: creates game with correct player count, initial positions, initial state
3. Test `rollDice`: returns value 1-6, sets turnPhase to WAITING_MOVE, rejects if not WAITING_ROLL
4. Test `move`: valid move updates position, sets WAITING_ANSWER for category tiles, sets WAITING_ROLL for rollAgain, rejects invalid position
5. Test `move` Final Challenge: hub + 6 wedges → WAITING_FINAL_ANSWER + finalChallengeCategory set
6. Test `move` mustLeaveHub: excludes position 0 from valid destinations
7. Test `processAnswer` correct: HQ tile awards wedge, no duplicate wedge, turnPhase → WAITING_ROLL
8. Test `processAnswer` incorrect: advances turn
9. Test `processAnswer` Final Challenge correct: game FINISHED + winner set
10. Test `processAnswer` Final Challenge incorrect: mustLeaveHub set
11. Test `playBotTurns`: bots execute turns, returns BotTurnResult array, stops at human

**Done when**:

- [x] All GameService tests pass
- [x] Covers startGame, rollDice, move, processAnswer, playBotTurns
- [x] `cd backend && npx jest game.service.spec --no-coverage` passes

**Verify**: `cd backend && npx jest game.service.spec`

**Commit**: `test(backend): add GameService unit tests`

---

### T2: BoardConfig unit tests

**What**: Unit tests for BoardConfig covering tile generation, valid destinations, and position validation
**Where**: `backend/src/game/board.config.spec.ts`
**Depends on**: None
**Requirement**: P1: Backend Board Config Tests

**Steps**:

1. Test `getTile(0)`: returns hub tile
2. Test `getTile` for known HQ positions (5, 10, 15, 20, 25, 30)
3. Test `getTile` for known rollAgain positions
4. Test `getValidDestinations` from hub: single destination
5. Test `getValidDestinations` from ring: forward + backward
6. Test `getValidDestinations` wrap-around: forward past 72, backward past 1
7. Test `isValidPosition`: valid and invalid values

**Done when**:

- [x] All BoardConfig tests pass
- [x] Covers getTile, getValidDestinations, isValidPosition
- [x] `cd backend && npx jest board.config.spec --no-coverage` passes

**Verify**: `cd backend && npx jest board.config.spec`

**Commit**: `test(backend): add BoardConfig unit tests`

---

### T3: QuestionsService unit tests

**What**: Unit tests for QuestionsService covering question retrieval and answer checking
**Where**: `backend/src/questions/questions.service.spec.ts`
**Depends on**: None
**Requirement**: P1: Backend Questions Tests

**Steps**:

1. Test `getByCategory`: returns question for valid category, tracks used questions per game
2. Test `checkAnswer`: returns correct=true for right answer, correct=false for wrong answer

**Done when**:

- [x] All QuestionsService tests pass
- [x] Covers getByCategory, checkAnswer
- [x] `cd backend && npx jest questions.service.spec --no-coverage` passes

**Verify**: `cd backend && npx jest questions.service.spec`

**Commit**: `test(backend): add QuestionsService unit tests`

---

### T4: Auth integration test (E2E)

**What**: E2E test for auth flow: login returns token, protected route with token works, 401 without token
**Where**: `backend/test/auth.e2e-spec.ts`
**Depends on**: None
**Requirement**: P1: Auth Integration Test

**Steps**:

1. Create E2E test using NestJS testing + supertest
2. Test POST /auth/login with valid nickname → returns token
3. Test POST /auth/login with empty nickname → returns 400
4. Test protected route (e.g., POST /game/roll-dice) with valid token → not 401
5. Test protected route without token → returns 401

**Done when**:

- [x] Auth E2E tests pass
- [x] Covers login success, login failure, protected route with/without token
- [x] `cd backend && npx jest --config test/jest-e2e.json auth.e2e-spec` passes

**Verify**: `cd backend && npx jest --config test/jest-e2e.json auth.e2e-spec`

**Commit**: `test(backend): add auth integration tests`

---

### T5: Run all tests and validate

**What**: Run all backend tests, check coverage on GameService
**Where**: Entire backend
**Depends on**: T1-T4

**Done when**:

- [x] `cd backend && npm test` passes all tests
- [x] GameService coverage ≥70%

**Verify**: `cd backend && npm test -- --coverage`

**Commit**: `chore: validate all tests pass with coverage`

---

## Parallel Execution Map

```
Phase 1 (Parallel — Unit Tests):
  T1 [P] ─┐
  T2 [P] ─┤
  T3 [P] ─┘

Phase 2 (Sequential — Integration):
  T4

Phase 3 (Validation):
  T5
```
