# MVP-7: Testes — Specification

## Problem Statement

The codebase has zero test coverage. MVP-7 adds unit and integration tests focused on the most critical logic: game state management, board configuration, questions service, and the authentication flow. Target: ≥70% coverage on game state logic.

## Goals

- [ ] Backend GameService fully tested (startGame, rollDice, move, processAnswer, playBotTurns)
- [ ] Backend BoardConfig tested (getValidDestinations edge cases)
- [ ] Backend QuestionsService tested (getByCategory, checkAnswer)
- [ ] Auth integration test: login → token → protected route → 401
- [ ] ≥70% coverage on game state logic (GameService)

## Out of Scope

| Feature                  | Reason                                                                         |
| ------------------------ | ------------------------------------------------------------------------------ |
| Frontend component tests | No test runner configured; would require vitest + @testing-library/react setup |
| Full E2E browser tests   | No Playwright/Cypress configured                                               |
| Performance/load tests   | Not relevant for portfolio project                                             |
| 100% coverage            | Diminishing returns; focus on critical paths                                   |

---

## User Stories

### P1: Backend Game Logic Tests ⭐ MVP

**User Story**: As a developer, I want unit tests for GameService so I can refactor confidently.

**Acceptance Criteria**:

1. WHEN running `npm test` THEN all GameService tests SHALL pass
2. WHEN checking coverage THEN GameService SHALL have ≥70% line coverage
3. Tests SHALL cover: startGame, rollDice, move (normal + Final Challenge + mustLeaveHub), processAnswer (correct/incorrect + wedge + victory), playBotTurns

### P1: Backend Board Config Tests ⭐ MVP

**Acceptance Criteria**:

1. Tests SHALL cover: getValidDestinations (hub, forward, backward, wrap-around), getTile, isValidPosition

### P1: Backend Questions Tests ⭐ MVP

**Acceptance Criteria**:

1. Tests SHALL cover: getByCategory, checkAnswer (correct/incorrect)

### P1: Auth Integration Test ⭐ MVP

**Acceptance Criteria**:

1. Tests SHALL cover: login returns JWT, protected route with valid token, 401 without token

### P2: Frontend Turn Logic Tests

**Acceptance Criteria**:

1. Tests SHALL cover: getValidDestinations, filterHubIfMustLeave, getBotsToSkip

---

## Success Criteria

- [ ] `npm test` passes with 0 failures
- [ ] GameService ≥70% line coverage
- [ ] Auth integration flow verified end-to-end
