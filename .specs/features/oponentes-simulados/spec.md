# MVP-6: Oponentes Simulados — Specification

## Problem Statement

Currently, bots are skipped entirely during gameplay — the human player effectively plays solo. MVP-6 brings the simulated opponents to life: each bot plays its turn automatically (roll, move, answer) with visual feedback, making the game a true multi-player experience and enabling the defeat condition (bot wins → defeat screen).

## Goals

- [ ] Bots execute full turns autonomously (roll → move → answer) with backend logic
- [ ] Human player sees brief visual feedback of each bot's turn (dice, movement, result)
- [ ] A bot can earn wedges, reach the Final Challenge, and win — triggering the defeat screen
- [ ] Game feels competitive: ~50% bot accuracy creates meaningful opponent pressure

## Out of Scope

| Feature                                  | Reason                                         |
| ---------------------------------------- | ---------------------------------------------- |
| Variable bot difficulty levels           | Single fixed 50% is sufficient for MVP         |
| Bot strategic movement (prefer HQ tiles) | Random destination keeps implementation simple |
| Bot turn speed configuration             | Fixed timing; tuning deferred                  |
| Bot personality/names customization      | Default "Bot 1", "Bot 2" etc. is sufficient    |
| Detailed bot turn log/replay             | Brief notification is sufficient               |

---

## User Stories

### P1: Bot Turn Execution ⭐ MVP

**User Story**: As a player, I want bots to actually play their turns so that the game is competitive.

**Why P1**: Core feature — without this, the game has no opponents.

**Acceptance Criteria**:

1. WHEN it becomes a bot's turn THEN the backend SHALL roll a d6, pick a random valid destination, move the bot, and determine the answer result (50% correct probability)
2. WHEN a bot lands on a category or HQ tile THEN the backend SHALL simulate the answer with 50% correct probability and award a wedge on HQ correct (no duplicate)
3. WHEN a bot lands on a Roll Again tile THEN the backend SHALL repeat (roll + move + answer) in the same turn
4. WHEN a bot lands on the hub with < 6 wedges THEN the backend SHALL pick a random category, simulate answer (50% correct), and if correct, continue; if incorrect, advance turn
5. WHEN a bot has 6 wedges and lands on the hub THEN the backend SHALL trigger the Final Challenge with 50% correct probability
6. WHEN a bot answers the Final Challenge correctly THEN the backend SHALL set game status to FINISHED and winner to the bot's nickname
7. WHEN a bot answers the Final Challenge incorrectly THEN the backend SHALL set mustLeaveHub=true for the bot and advance turn

**Independent Test**: Start a game, wait for bot turns — bots should move, earn wedges over time, and potentially win.

---

### P1: Bot Turn Visual Feedback ⭐ MVP

**User Story**: As a player, I want to see what each bot does during its turn so I can follow the game.

**Why P1**: Without visual feedback, the game state changes appear random and confusing.

**Acceptance Criteria**:

1. WHEN a bot starts its turn THEN the frontend SHALL display a notification "Vez de {botName}"
2. WHEN a bot rolls and moves THEN the frontend SHALL animate the bot's token moving to the new position
3. WHEN a bot answers correctly THEN the frontend SHALL briefly show "✅ {botName} acertou!"
4. WHEN a bot answers incorrectly THEN the frontend SHALL briefly show "❌ {botName} errou!"
5. WHEN a bot earns a wedge THEN the frontend SHALL show the wedge notification briefly
6. WHEN all bots between two human turns have played THEN the frontend SHALL show "Sua vez!" and enable dice rolling

**Independent Test**: Start a game and answer incorrectly — bot turns should play visually before returning to the human.

---

### P1: Bot Defeat Condition ⭐ MVP

**User Story**: As a player, I want the game to end if a bot wins so that the game has real stakes.

**Why P1**: The defeat screen (MVP-5) exists but cannot be triggered without bot victory.

**Acceptance Criteria**:

1. WHEN a bot wins (Final Challenge correct) THEN the frontend SHALL detect `status=finished` with `winner` != humanNickname
2. WHEN a bot wins THEN the frontend SHALL display the DefeatScreen with the bot's name and wedges
3. WHEN the DefeatScreen is shown THEN the human SHALL be able to click "Jogar Novamente" to restart

**Independent Test**: Manually set a bot to 6 wedges + hub position; the bot should trigger Final Challenge and potentially win.

---

### P2: Bot Turn Result in API Response

**User Story**: As the frontend, I want a single API call that returns all bot turn results so I can animate them sequentially.

**Why P2**: Reduces API calls. Instead of polling, one call returns the full bot turn sequence.

**Acceptance Criteria**:

1. WHEN the backend advances turn past bots THEN it SHALL return an array of bot turn results (each with: botNickname, diceValue, fromPosition, toPosition, tileType, answerCorrect, wedgeEarned, isFinalChallenge)
2. WHEN a bot wins during the sequence THEN the array SHALL stop at that bot's turn and include the victory info
3. WHEN no bot wins THEN the array ends and currentPlayer is the next human

**Independent Test**: Call advance-turn API and inspect the response array for bot actions.

---

## Edge Cases

- WHEN a bot lands on Roll Again multiple times in a row THEN the backend SHALL loop (max 10 iterations to prevent infinite loops)
- WHEN a bot has mustLeaveHub=true THEN the backend SHALL exclude position 0 from valid destinations (same as human logic)
- WHEN all bots have played and it returns to the human THEN the frontend SHALL correctly show "Sua vez!" notification
- WHEN a bot wins mid-sequence (not the last bot) THEN remaining bot turns SHALL NOT be executed

---

## Requirement Traceability

| Requirement ID | Story                                    | Phase  | Status  |
| -------------- | ---------------------------------------- | ------ | ------- |
| BOT-01         | P1: Bot Turn Execution                   | Design | Pending |
| BOT-02         | P1: Bot Turn Execution                   | Design | Pending |
| BOT-03         | P1: Bot Turn Execution (Roll Again)      | Design | Pending |
| BOT-04         | P1: Bot Turn Execution (Hub)             | Design | Pending |
| BOT-05         | P1: Bot Turn Execution (Final Challenge) | Design | Pending |
| BOT-06         | P1: Bot Turn Visual Feedback             | Design | Pending |
| BOT-07         | P1: Bot Defeat Condition                 | Design | Pending |
| BOT-08         | P2: Bot Turn Result API                  | Design | Pending |

---

## Success Criteria

- [ ] Bots play full turns with visual feedback visible to the human player
- [ ] At least one bot can reach Final Challenge and win in a typical game
- [ ] Defeat screen properly triggered by bot victory
- [ ] Game flows smoothly: no jarring jumps, bot turns animate at ~1-2s per bot
- [ ] Backend handles Roll Again loops and edge cases without errors
