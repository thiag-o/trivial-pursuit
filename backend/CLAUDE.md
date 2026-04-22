# Backend — Trivia Pursuit

NestJS 11 REST API for the Trivia Pursuit game. State in memory (no database). Port 3001.

## Dev Commands

```bash
npm run dev          # watch mode (nest start --watch)
npm test             # unit tests (Jest, rootDir=src, *.spec.ts)
npm run test:cov     # coverage report
npm run test:e2e     # e2e tests (test/jest-e2e.json)
npm run build        # compile to dist/
npm run lint         # ESLint --fix
npm run format       # Prettier
```

## Environment

Copy `.env.example` → `.env` and fill:

```env
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

`JWT_SECRET` is required — startup throws if missing (`getOrThrow`).

## Architecture

```
src/
├── main.ts                   # Bootstrap: CORS, ValidationPipe global
├── app.module.ts             # Root: ConfigModule (global) + 3 feature modules
├── auth/                     # AuthModule
│   ├── auth.controller.ts    # POST /auth/login (public)
│   ├── auth.service.ts       # jwtService.sign({ nickname })
│   ├── guards/jwt-auth.guard # Applied globally via APP_GUARD
│   ├── strategies/jwt        # Passport JWT strategy
│   └── decorators/
│       ├── @Public()         # Skips JWT guard
│       └── @CurrentUser()    # Extracts nickname from JWT payload
├── game/                     # GameModule
│   ├── game.controller.ts    # POST /game/start, /roll-dice, /move
│   ├── game.service.ts       # Core game logic + bot turns
│   ├── game-state.store.ts   # In-memory Map<gameId, GameState>
│   └── board.config.ts       # Board topology + getValidDestinations
├── questions/                # QuestionsModule
│   ├── questions.controller.ts # GET /questions/:category, POST /questions/:id/answer
│   ├── questions.service.ts
│   ├── questions.store.ts    # Loads questions.json, tracks used per game
│   └── data/questions.json
└── common/
    ├── enums/                # Category, GameStatus, TileType, TurnPhase
    └── interfaces/           # GameState, Player, Question, Tile, BotTurnResult
```

## Auth Pattern

`JwtAuthGuard` is registered as `APP_GUARD` — all routes are protected by default. Use `@Public()` on controllers/handlers that must be open (currently only `POST /auth/login`). `@CurrentUser()` pulls `nickname` from the JWT payload.

## Board Layout (73 tiles)

| Range | Type | Description |
|-------|------|-------------|
| 0 | HUB | Center hub |
| 1–42 | Ring | Circular track; HQs at 7,14,21,28,35,42 |
| 3,6,9,… | ROLL_AGAIN | Every 3rd non-HQ ring tile |
| 43–72 | Spoke | 6 spokes × 5 tiles (spoke 0 = tiles 43–47, spoke 5 = tiles 68–72) |

`getValidDestinations(from, diceValue, canAccessHub)` mirrors the frontend `turn-logic.ts` — both must stay in sync if board rules change.

Key rules encoded:
- **BR-2**: Hub (position 0) only reachable when `canAccessHub=true` (player has 6 wedges and is not in `mustLeaveHub` state).
- **BR-3a**: Overshoot past spoke tip → continues on opposite spoke.
- **BR-3b**: Ring movement that passes through an HQ → player may enter that spoke.

## Turn Phase State Machine

```
WAITING_ROLL → (roll) → WAITING_MOVE → (move to category/HQ tile) → WAITING_ANSWER
                                      → (move to rollAgain) → WAITING_ROLL
                                      → (move to hub with 6 wedges) → WAITING_FINAL_ANSWER
WAITING_ANSWER → (correct) → WAITING_ROLL
              → (wrong)   → advanceTurn → bot turns → WAITING_ROLL (human)
WAITING_FINAL_ANSWER → (correct) → FINISHED (winner set)
                     → (wrong)   → mustLeaveHub=true → advanceTurn → bot turns
```

## GameState (in-memory)

Stored in `GameStateStore` (singleton `Map`). One game per nickname — starting a second game throws `BadRequestException('Game already in progress')`. State is lost on server restart.

Key fields: `gameId`, `players[]`, `currentPlayerIndex`, `status`, `turnPhase`, `lastDiceRoll`, `activeQuestionId`, `winner`, `finalChallengeCategory`.

## Questions

- Source: `src/questions/data/questions.json`
- Per-player, per-game tracking of used question IDs to avoid repeats; resets when pool exhausted.
- `correctAnswer` is never returned in `GET /questions/:category` — only exposed in `POST /questions/:id/answer` response.

## Global Validation

`ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true` — all request bodies are validated via class-validator DTOs. Unknown properties are rejected.

## Testing

Tests live alongside source files as `*.spec.ts`. No mocking of the NestJS DI container — tests instantiate classes directly (`new GameService(new GameStateStore(), new BoardConfig())`).

`Math.random` is spied on in tests that need deterministic dice. Use `jest.spyOn(Math, 'random').mockReturnValue(...)` and restore with `jest.restoreAllMocks()` in `afterEach`.

Files with tests: `board.config.spec.ts`, `game.service.spec.ts`, `questions.service.spec.ts`, `app.controller.spec.ts`.

## API Documentation

### Swagger UI

Available at `http://localhost:3001/api/docs` when the server is running. Configured in `src/main.ts` via `DocumentBuilder` + `SwaggerModule.setup`.

All protected routes require a Bearer token — use the **Authorize** button in the UI after logging in via `POST /auth/login`.

Decorators used:
- DTOs: `@ApiProperty` / `@ApiPropertyOptional`
- Controllers: `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`

### Postman Collection

The source file is `trivia-pursuit.postman_collection.json` at the project root.

When adding or changing endpoints, keep the Postman collection in sync by uploading it to the **"Trivial-pursuit"** workspace, collection **"Trivia Pursuit API"**, using the Postman MCP:

```
Use the Postman MCP to push the updated collection to:
  Workspace : Trivial-pursuit
  Collection: Trivia Pursuit API
```

The collection uses two auto-filled variables:
- `token` — set by the test script on `POST /auth/login`
- `questionId` — set by the test script on `GET /questions/:category`
