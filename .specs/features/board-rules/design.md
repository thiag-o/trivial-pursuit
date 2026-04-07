# Board Rules — Design

**Feature ID:** BOARD-RULES
**Created:** 2026-03-30

---

## Architecture Overview

```
Backend                                  Frontend
───────────────────────────────────────  ──────────────────────────────────────────
board.config.ts                          board-data.ts
  ├─ SPOKES (category field = hq color)    ├─ SPOKES (unchanged structure)
  ├─ buildTiles()                          └─ buildTiles()
  │    └─ spoke tile: CATEGORY_CYCLE            └─ spoke tile: CATEGORY_CYCLE
  │         [(spokeIdx+tileIdx+1)%6]                 [(spokeIdx+tileIdx+1)%6]
  └─ getValidDestinations(                 turn-logic.ts
        from, dice,                        └─ getValidDestinations(
        canAccessHub=false)                      from, dice,
          ├─ BR-2: hub excluded                  canAccessHub=false)
          │   unless canAccessHub                  ├─ BR-2: same hub logic
          └─ BR-3: overshoot logic                └─ BR-3: same overshoot logic

game.service.ts
  ├─ move(): canAccessHub = wedges===6 && !mustLeaveHub
  ├─ move(): fix mustLeaveHub reset (bug)  GamePage.tsx
  └─ playBotTurns(): same canAccessHub     └─ handleRollDice():
                                                canAccessHub = wedges===6 && !mustLeaveHub
                                                getValidDestinations(from, dice, canAccessHub)
```

---

## Data Structures

### Spoke Tile Category (changed)

Before:

```typescript
// All 5 tiles of spoke S share the spoke's HQ category
tiles.push({ position: pos, type: TileType.CATEGORY, category: spoke.category });
```

After:

```typescript
// Each tile uses a rotating category pattern
spoke.tiles.forEach((pos, tileIndex) => {
  const category = CATEGORY_CYCLE[(spokeIndex + tileIndex + 1) % 6];
  tiles.push({ position: pos, type: TileType.CATEGORY, category });
});
```

`SPOKES[s].category` remains the HQ's category (used for rendering spoke line color in `BoardRenderer`). Only tile assignment changes.

### getValidDestinations signature

```typescript
// Backend (board.config.ts)
getValidDestinations(from: number, diceValue: number, canAccessHub = false): number[]

// Frontend (turn-logic.ts)
getValidDestinations(from: number, diceValue: number, canAccessHub = false): number[]
```

`canAccessHub` computed by callers:

```typescript
const canAccessHub = player.wedges.length === 6 && !player.mustLeaveHub;
```

---

## Movement Changes (getValidDestinations)

### Case 2: Spoke tile — toward ring extended (BR-3a)

```typescript
// Toward ring (idx decreases toward 0, then HQ)
if (idx - D >= 0) {
  destinations.push(spoke.tiles[idx - D]);
} else if (idx - D === -1) {
  destinations.push(spoke.hq); // exact HQ landing
} else {
  // NEW: overshoot beyond HQ → continue on ring
  const remaining = D - idx - 1; // steps past HQ
  const hq = spoke.hq;
  const fwd = ((hq - 1 + remaining) % CIRCULAR_END) + CIRCULAR_START;
  const bwd = ((hq - 1 - remaining + CIRCULAR_END) % CIRCULAR_END) + CIRCULAR_START;
  destinations.push(fwd);
  if (bwd !== fwd) destinations.push(bwd);
}
```

### Case 3: Ring tile — in-path HQ spoke entry (BR-3b)

```typescript
// After computing forward and backward ring destinations...

// Find HQs in path (forward direction)
for (const spoke of SPOKES) {
  const distFwd = (spoke.hq - from + CIRCULAR_END) % CIRCULAR_END;
  if (distFwd > 0 && distFwd < D) {
    const remaining = D - distFwd;
    // remaining is always 1..5 (since D≤6, distFwd≥1, so remaining≤5)
    destinations.push(spoke.tiles[remaining - 1]);
  }
  const distBwd = (from - spoke.hq + CIRCULAR_END) % CIRCULAR_END;
  if (distBwd > 0 && distBwd < D) {
    const remaining = D - distBwd;
    destinations.push(spoke.tiles[remaining - 1]);
  }
}
```

Note: With D ≤ 6 and HQs 7 tiles apart, at most ONE HQ can be in the path per direction (7 > 6). No multiple HQ case possible.

### Case 2: Spoke tile — toward hub (BR-2 applied)

```typescript
if (idx + D <= 4) {
  destinations.push(spoke.tiles[idx + D]);
} else if (idx + D === 5) {
  if (canAccessHub) destinations.push(HUB_POSITION); // NEW: guard
}
// idx + D > 5: overshoot hub discarded (no destination)
```

### Case 3: Ring HQ → hub (BR-2 applied)

```typescript
if (D <= 5) {
  destinations.push(SPOKES[spokeIdx].tiles[D - 1]);
} else if (D === 6) {
  if (canAccessHub) destinations.push(HUB_POSITION); // NEW: guard
}
```

---

## game.service.ts Changes

### move() — canAccessHub replaces mustLeaveHub filter

Before:

```typescript
let validDestinations = this.board.getValidDestinations(from, dice);
if (currentPlayer.mustLeaveHub) {
  validDestinations = validDestinations.filter((d) => d !== 0);
}
```

After:

```typescript
const canAccessHub = currentPlayer.wedges.length === 6 && !currentPlayer.mustLeaveHub;
const validDestinations = this.board.getValidDestinations(from, dice, canAccessHub);
```

### move() — mustLeaveHub reset bug fix

Before (bug: `position === 0` after update is never true when hub was filtered):

```typescript
currentPlayer.position = targetPosition;
if (currentPlayer.mustLeaveHub && currentPlayer.position === 0) {
  currentPlayer.mustLeaveHub = false;
}
```

After:

```typescript
const wasAtHub = currentPlayer.mustLeaveHub && currentPlayer.position === HUB_POSITION;
currentPlayer.position = targetPosition;
if (wasAtHub && targetPosition !== HUB_POSITION) {
  currentPlayer.mustLeaveHub = false;
}
```

### playBotTurns() — same canAccessHub logic

```typescript
const canAccessHub = bot.wedges.length === 6 && !bot.mustLeaveHub;
let validDests = this.board.getValidDestinations(bot.position, diceValue, canAccessHub);
// Remove: if (bot.mustLeaveHub) { validDests = validDests.filter(d => d !== 0); }

// After bot moves:
if (bot.mustLeaveHub && destination !== HUB_POSITION) {
  bot.mustLeaveHub = false;
}
```

---

## GamePage.tsx Changes

### handleRollDice — pass canAccessHub

```typescript
const currentPlayer = state.players.find((p) => p.nickname === state.currentPlayerNickname);
const from = currentPlayer?.position ?? 0;
const canAccessHub = (currentPlayer?.wedges.length ?? 0) === 6 && !state.mustLeaveHub;
const dests = getValidDestinations(from, res.value, canAccessHub);
// Remove filterHubIfMustLeave call (now handled inside getValidDestinations)
```

---

## Files Changed

| #   | File                                    | Change                                                                |
| --- | --------------------------------------- | --------------------------------------------------------------------- |
| T1  | `backend/src/game/board.config.ts`      | BR-1 (spoke categories) + BR-2 (hub guard) + BR-3 (overload movement) |
| T2  | `backend/src/game/game.service.ts`      | Pass canAccessHub; fix mustLeaveHub reset bug                         |
| T3  | `backend/src/game/board.config.spec.ts` | Tests for BR-1, BR-2, BR-3                                            |
| T4  | `frontend/src/game/board-data.ts`       | BR-1 (spoke categories)                                               |
| T5  | `frontend/src/game/turn-logic.ts`       | BR-2 (hub guard) + BR-3 (extended movement)                           |
| T6  | `frontend/src/pages/GamePage.tsx`       | Pass canAccessHub; remove filterHubIfMustLeave                        |

---

## Decisions

- **Spoke line color unchanged**: `SPOKES[s].category` remains the HQ category for visual spoke line rendering. Only tile assignment uses the rotating pattern.
- **Hub overshoot from spoke discarded**: if `idx + D > 5`, no hub destination is added (not even extension). Hub is a terminal position when entered.
- **In-path HQ remaining always 1..5**: Given D≤6 and HQs 7 apart, `remaining = D - distToHQ < D ≤ 6` and `distToHQ ≥ 1`, so `remaining ≤ 5`. No hub destination from in-path HQs.
- **`filterHubIfMustLeave` in turn-logic.ts**: kept as exported function but no longer called in GamePage (canAccessHub parameter handles it). Function may be removed in future cleanup.
- **`HUB_POSITION` constant**: extracted to module-level constant in backend (was `0` inline). Already done in BOARD-REDESIGN.
