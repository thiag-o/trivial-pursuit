# Frontend — Trivia Pursuit

React 19 SPA with PixiJS 8 board rendering. Built with Vite 8 + Tailwind CSS 4. Port 5173.

## Dev Commands

```bash
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # tsc -b && vite build → dist/
npm run preview  # Preview production build
npm run lint     # ESLint
```

No test runner is configured (no Jest/Vitest).

## Environment

Copy `.env.example` → `.env`:

```env
VITE_API_URL=http://localhost:3001
```

Accessed in code as `import.meta.env.VITE_API_URL`. Falls back to `http://localhost:3001` if unset.

## Architecture

```
src/
├── App.tsx                    # Router: /login, /start, /game (protected)
├── main.tsx                   # React root, BrowserRouter
├── pages/
│   ├── LoginPage.tsx          # POST /auth/login → store token → navigate /start
│   ├── StartPage.tsx          # POST /game/start → navigate /game with LocationState
│   └── GamePage.tsx           # Main game loop — all turn logic lives here
├── components/
│   ├── BoardCanvas.tsx        # PixiJS canvas wrapper (exposes animateToken via ref)
│   ├── GameHUD.tsx            # Sidebar: players, wedges, turn status
│   ├── DiceRoller.tsx         # Roll button + dice display
│   ├── QuestionModal.tsx      # Question + 4 answers + feedback; gold theme for Final Challenge
│   ├── CategoryPickerModal.tsx# Hub category selector
│   ├── ColorPicker.tsx        # Pre-game token color selection
│   ├── TurnNotification.tsx   # Transient toast — key prop forces re-mount on repeat messages
│   ├── VictoryScreen.tsx      # Full-screen victory overlay
│   ├── DefeatScreen.tsx       # Full-screen defeat overlay
│   ├── WedgeNotification.tsx  # Wedge-earned notification
│   └── ProtectedRoute.tsx     # Redirects to /login if no token
├── game/
│   ├── types.ts               # All shared TypeScript types and interfaces
│   ├── constants.ts           # CATEGORY_COLORS, CATEGORY_NAMES, PLAYER_COLORS, canvas sizes
│   ├── board-data.ts          # Static board tile array (mirrors backend board.config.ts)
│   ├── board-layout.ts        # PixiJS coordinate calculations for each tile
│   ├── turn-logic.ts          # getValidDestinations() — mirrors backend BoardConfig logic
│   └── pixi/
│       ├── BoardRenderer.ts   # Draws ring, HQs, spokes, hub with PixiJS Graphics
│       ├── TokenRenderer.ts   # Draws and moves player tokens
│       └── usePixiApp.ts      # React hook: creates/destroys PixiJS Application
└── services/
    ├── api.ts                 # Axios instance — injects JWT, handles 401 → redirect /login
    ├── auth.ts                # localStorage helpers: saveAuth, getToken, getNickname, clearAuth
    └── game-api.ts            # rollDice, moveToPosition, fetchQuestion, submitAnswer
```

## Routing

| Path | Component | Auth |
|------|-----------|------|
| `/login` | LoginPage | Public |
| `/start` | StartPage | Protected |
| `/game` | GamePage | Protected |
| `/` | → `/start` | — |
| `*` | → `/start` | — |

`GamePage` requires `location.state` (set by StartPage via `navigate('/game', { state })`). Missing state redirects to `/start`.

## State Management

No external state library. All game state lives in `useState<GamePageState>` inside `GamePage`. Auth state (token + nickname) lives in `localStorage` via `src/services/auth.ts`.

`GamePageState` key fields: `gameId`, `players`, `playerTokens`, `currentPlayerNickname`, `turnPhase`, `validDestinations`, `question`, `answerResult`, `isFinalChallenge`, `mustLeaveHub`, `gameOverState`, `earnedWedgeCategory`.

## Turn Flow (GamePage)

```
handleRollDice()       → POST /game/roll-dice → compute validDestinations → 'waitingMove'
handleTileClick(pos)   → POST /game/move       → animate token → load question or rollAgain
handleCategorySelect() → calls loadQuestion() with chosen category
loadQuestion()         → GET /questions/:category → show QuestionModal
handleAnswer()         → POST /questions/:id/answer
                         → correct: stay on same player, 'waitingRoll'
                         → wrong:   runBotTurnSequence() → 'waitingRoll' (human)
```

Bot turns come back as `BotTurnResult[]` in the answer response. `runBotTurnSequence` animates each bot move with `sleep()` delays.

## PixiJS Integration

`BoardCanvas` creates a PixiJS `Application` via `usePixiApp` hook and exposes `animateToken(nickname, from, to, onComplete)` through `useImperativeHandle`.

**Critical**: call `animateToken` BEFORE updating `playerTokens` in state. Updating `playerTokens` causes React to re-render `BoardCanvas`, which destroys the PixiJS `Graphics` object mid-animation and crashes the ticker.

`BoardRenderer` and `TokenRenderer` are plain TypeScript classes (not React components) that receive a PixiJS `Container` and draw/update Graphics objects directly.

## Board Data Duplication

`src/game/board-data.ts` and `src/game/turn-logic.ts` duplicate the backend's `board.config.ts` and `BoardConfig.getValidDestinations()`. This is intentional (offline destination calculation for UI highlighting). If board rules change, update **both** backend and frontend.

## Tailwind CSS 4

Configured via `@tailwindcss/vite` plugin (not `postcss`). No `tailwind.config.js` — configuration lives in `vite.config.ts`. Import in `src/index.css` with `@import "tailwindcss"`.

## Auth Flow

1. `LoginPage` calls `POST /auth/login` → stores `{ token, nickname }` in localStorage via `saveAuth()`.
2. `api.ts` request interceptor reads `getToken()` and adds `Authorization: Bearer <token>` header.
3. `api.ts` response interceptor: on 401 (non-login route) → `clearAuth()` + redirect to `/login`.
4. `ProtectedRoute` checks `getToken()` — redirects if absent.

## Category Colors

| Category | Hex | Display Name |
|----------|-----|--------------|
| geography | #4FC3F7 | Geografia |
| entertainment | #F48FB1 | Entretenimento |
| history | #FFF176 | História |
| art | #CE93D8 | Arte & Literatura |
| science | #81C784 | Ciência & Natureza |
| sports | #FFB74D | Esportes & Lazer |

## TurnNotification Re-mount Pattern

`TurnNotification` receives a `key={notifKey}` prop. `notifKey` is incremented via `setNotifKey` before every notification, forcing React to unmount and remount the component. This restarts the CSS animation even when the message string is identical to the previous one.
