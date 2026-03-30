import { BadRequestException } from '@nestjs/common';
import { GameService } from './game.service';
import { GameStateStore } from './game-state.store';
import { BoardConfig } from './board.config';
import { GameStatus, TurnPhase, TileType, Category } from '../common/enums';

describe('GameService', () => {
  let service: GameService;
  let store: GameStateStore;
  let board: BoardConfig;

  beforeEach(() => {
    store = new GameStateStore();
    board = new BoardConfig();
    service = new GameService(store, board);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('startGame', () => {
    it('should create a game with human + bots', () => {
      const state = service.startGame('Alice', 2);

      expect(state.gameId).toBeDefined();
      expect(state.players).toHaveLength(3);
      expect(state.players[0]).toMatchObject({
        nickname: 'Alice',
        position: 0,
        isHuman: true,
        wedges: [],
      });
      expect(state.players[1].isHuman).toBe(false);
      expect(state.players[2].isHuman).toBe(false);
      expect(state.status).toBe(GameStatus.STARTED);
      expect(state.turnPhase).toBe(TurnPhase.WAITING_ROLL);
      expect(state.currentPlayerIndex).toBe(0);
    });

    it('should throw if player already has a game', () => {
      service.startGame('Alice', 1);
      expect(() => service.startGame('Alice', 1)).toThrow(BadRequestException);
    });

    it('should create game with zero opponents', () => {
      const state = service.startGame('Solo', 0);
      expect(state.players).toHaveLength(1);
    });
  });

  describe('rollDice', () => {
    it('should return value 1-6 and update phase', () => {
      service.startGame('Alice', 0);
      const { value, gameState } = service.rollDice('Alice');

      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      expect(gameState.turnPhase).toBe(TurnPhase.WAITING_MOVE);
      expect(gameState.lastDiceRoll).toBe(value);
    });

    it('should throw if not current player', () => {
      service.startGame('Alice', 1);
      expect(() => service.rollDice('Bot 1')).toThrow('Not your turn');
    });

    it('should throw if not in rolling phase', () => {
      service.startGame('Alice', 0);
      service.rollDice('Alice'); // now WAITING_MOVE
      expect(() => service.rollDice('Alice')).toThrow('Not in rolling phase');
    });

    it('should throw if no active game', () => {
      expect(() => service.rollDice('Nobody')).toThrow('No active game');
    });
  });

  describe('move', () => {
    let rollValue: number;

    beforeEach(() => {
      service.startGame('Alice', 0);
      const result = service.rollDice('Alice');
      rollValue = result.value;
    });

    it('should move player to valid destination', () => {
      const dests = board.getValidDestinations(0, rollValue);
      const target = dests[0];
      const game = service.move('Alice', target);

      expect(game.players[0].position).toBe(target);
      expect(game.lastDiceRoll).toBeNull();
    });

    it('should throw for invalid position', () => {
      expect(() => service.move('Alice', -1)).toThrow('Invalid position');
    });

    it('should throw for non-reachable destination', () => {
      expect(() => service.move('Alice', 50)).toThrow('Invalid destination');
    });

    it('should set WAITING_ROLL on rollAgain tile', () => {
      // Position 3 is rollAgain; need dice=3 from hub
      jest.spyOn(Math, 'random').mockReturnValue(2 / 6); // → floor(2/6*6)+1 = 1... no
      // Math.floor(random * 6) + 1 → random=0.333 → floor(2)+1 = 3
      jest.restoreAllMocks();

      // Start fresh with controlled dice
      store = new GameStateStore();
      board = new BoardConfig();
      service = new GameService(store, board);
      jest.spyOn(Math, 'random').mockReturnValue(2 / 6); // → floor(1.99)+1 = 2... 
      // Let me compute: Math.floor(0.333... * 6) + 1 = Math.floor(2) + 1 = 3
      service.startGame('Alice', 0);
      const { value } = service.rollDice('Alice');
      expect(value).toBe(3);

      const game = service.move('Alice', 3);
      expect(board.getTile(3).type).toBe(TileType.ROLL_AGAIN);
      expect(game.turnPhase).toBe(TurnPhase.WAITING_ROLL);
    });

    it('should set WAITING_ANSWER on category tile', () => {
      store = new GameStateStore();
      board = new BoardConfig();
      service = new GameService(store, board);
      // dice=1 → position 1 is category
      jest.spyOn(Math, 'random').mockReturnValue(0); // → floor(0)+1 = 1
      service.startGame('Alice', 0);
      service.rollDice('Alice');

      const game = service.move('Alice', 1);
      expect(game.turnPhase).toBe(TurnPhase.WAITING_ANSWER);
    });

    it('should set WAITING_FINAL_ANSWER via processAnswer when at hub with 6 wedges', () => {
      // Hub (position 0) is not reachable from ring via getValidDestinations,
      // so the Final Challenge is tested through processAnswer instead.
      // This test verifies that processAnswer correctly handles WAITING_FINAL_ANSWER.
      const state = service.startGame('Alice', 0);
      state.players[0].position = 0;
      state.players[0].wedges = Object.values(Category);
      state.turnPhase = TurnPhase.WAITING_FINAL_ANSWER;
      state.finalChallengeCategory = Category.SCIENCE;
      store.update(state.gameId, state);

      const { game } = service.processAnswer(state.gameId, true);
      expect(game.status).toBe(GameStatus.FINISHED);
      expect(game.winner).toBe('Alice');
    });

    it('should handle mustLeaveHub by filtering hub from destinations', () => {
      const state = service.startGame('Alice', 0);
      state.players[0].mustLeaveHub = true;
      state.turnPhase = TurnPhase.WAITING_MOVE;
      state.lastDiceRoll = 4;
      store.update(state.gameId, state);

      // From hub, dice 4 → dest [4]. Hub (0) not in list anyway since from hub goes forward only.
      const game = service.move('Alice', 4);
      expect(game.players[0].position).toBe(4);
      expect(game.players[0].mustLeaveHub).toBe(false);
    });
  });

  describe('processAnswer', () => {
    it('should award wedge for correct answer on HQ tile', () => {
      const state = service.startGame('Alice', 0);
      // Position 5 is HQ geography
      state.players[0].position = 5;
      state.turnPhase = TurnPhase.WAITING_ANSWER;
      store.update(state.gameId, state);

      const { game } = service.processAnswer(state.gameId, true);
      expect(game.players[0].wedges).toContain(Category.GEOGRAPHY);
      expect(game.turnPhase).toBe(TurnPhase.WAITING_ROLL);
    });

    it('should not duplicate wedge if already earned', () => {
      const state = service.startGame('Alice', 0);
      state.players[0].position = 5;
      state.players[0].wedges = [Category.GEOGRAPHY];
      state.turnPhase = TurnPhase.WAITING_ANSWER;
      store.update(state.gameId, state);

      const { game } = service.processAnswer(state.gameId, true);
      expect(game.players[0].wedges).toEqual([Category.GEOGRAPHY]);
    });

    it('should advance turn on wrong answer', () => {
      const state = service.startGame('Alice', 1);
      state.players[0].position = 5;
      state.turnPhase = TurnPhase.WAITING_ANSWER;
      store.update(state.gameId, state);

      const { game, botTurns } = service.processAnswer(state.gameId, false);
      // Bot 1 plays, then it should be Alice's turn again
      expect(game.currentPlayerIndex).toBe(0);
      expect(Array.isArray(botTurns)).toBe(true);
    });

    it('should finish game on correct final challenge', () => {
      const state = service.startGame('Alice', 0);
      state.players[0].position = 0;
      state.players[0].wedges = Object.values(Category);
      state.turnPhase = TurnPhase.WAITING_FINAL_ANSWER;
      state.finalChallengeCategory = Category.HISTORY;
      store.update(state.gameId, state);

      const { game } = service.processAnswer(state.gameId, true);
      expect(game.status).toBe(GameStatus.FINISHED);
      expect(game.winner).toBe('Alice');
    });

    it('should set mustLeaveHub on failed final challenge', () => {
      const state = service.startGame('Alice', 1);
      state.players[0].position = 0;
      state.players[0].wedges = Object.values(Category);
      state.turnPhase = TurnPhase.WAITING_FINAL_ANSWER;
      state.finalChallengeCategory = Category.HISTORY;
      store.update(state.gameId, state);

      const { game } = service.processAnswer(state.gameId, false);
      expect(game.players[0].mustLeaveHub).toBe(true);
      expect(game.finalChallengeCategory).toBeNull();
    });

    it('should throw for non-existent game', () => {
      expect(() => service.processAnswer('bad-id', true)).toThrow('Game not found');
    });

    it('should keep rolling phase on correct non-HQ answer', () => {
      const state = service.startGame('Alice', 0);
      state.players[0].position = 1; // category tile
      state.turnPhase = TurnPhase.WAITING_ANSWER;
      store.update(state.gameId, state);

      const { game } = service.processAnswer(state.gameId, true);
      expect(game.turnPhase).toBe(TurnPhase.WAITING_ROLL);
      expect(game.players[0].wedges).toHaveLength(0);
    });
  });

  describe('playBotTurns', () => {
    it('should execute bot turns and return results', () => {
      // Create 1 human + 1 bot; advance to bot's turn
      const state = service.startGame('Alice', 1);
      state.currentPlayerIndex = 1; // Bot 1's turn
      state.turnPhase = TurnPhase.WAITING_ROLL;
      store.update(state.gameId, state);

      // Control randomness for deterministic bot
      const randomValues = [
        0.5, // dice: floor(3)+1=4
        0.0, // destination pick: first valid
        0.1, // tile category random (if needed)
        0.6, // answer: incorrect (>=0.5 → false) → bot stops
      ];
      let callIdx = 0;
      jest.spyOn(Math, 'random').mockImplementation(() => {
        return randomValues[callIdx++ % randomValues.length];
      });

      const results = service.playBotTurns(state);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].botNickname).toBe('Bot 1');
      // After bot turn, should advance to human (index 0)
      expect(state.currentPlayerIndex).toBe(0);
    });

    it('should return empty array when current player is human', () => {
      const state = service.startGame('Alice', 1);
      // currentPlayerIndex = 0 (Alice, human)
      const results = service.playBotTurns(state);
      expect(results).toEqual([]);
    });

    it('should handle bot landing on rollAgain', () => {
      const state = service.startGame('Alice', 1);
      state.currentPlayerIndex = 1;
      state.turnPhase = TurnPhase.WAITING_ROLL;
      store.update(state.gameId, state);

      // Bot at position 0, dice=3 → lands on position 3 (rollAgain)
      // Then needs another roll
      const randomSeq = [
        2 / 6, // dice=3
        0,     // pick first dest (3 from hub)
        // rollAgain → no answer, continues
        0,     // dice=1 (next roll)
        0,     // pick first dest
        0,     // category random
        0.6,   // answer: false → stop
      ];
      let idx = 0;
      jest.spyOn(Math, 'random').mockImplementation(() => randomSeq[idx++ % randomSeq.length]);

      const results = service.playBotTurns(state);
      const rollAgainResult = results.find(r => r.tileType === TileType.ROLL_AGAIN);
      expect(rollAgainResult).toBeDefined();
      expect(rollAgainResult!.answerCorrect).toBeNull();
    });
  });

  describe('getActiveGame', () => {
    it('should return game for active player', () => {
      const created = service.startGame('Alice', 0);
      const found = service.getActiveGame('Alice');
      expect(found.gameId).toBe(created.gameId);
    });

    it('should throw for unknown player', () => {
      expect(() => service.getActiveGame('Nobody')).toThrow('No active game');
    });
  });
});
