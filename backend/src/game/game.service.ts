import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Category, GameStatus, TurnPhase, TileType } from '../common/enums';
import { GameState, BotTurnResult } from '../common/interfaces';
import { GameStateStore } from './game-state.store';
import { BoardConfig } from './board.config';

@Injectable()
export class GameService {
  constructor(
    private readonly store: GameStateStore,
    private readonly board: BoardConfig,
  ) {}

  startGame(nickname: string, opponents: number): GameState {
    const existing = this.store.findByNickname(nickname);
    if (existing) {
      throw new BadRequestException('Game already in progress');
    }

    const players = [
      { nickname, position: 0, wedges: [], isHuman: true, mustLeaveHub: false },
    ];
    for (let i = 1; i <= opponents; i++) {
      players.push({
        nickname: `Bot ${i}`,
        position: 0,
        wedges: [],
        isHuman: false,
        mustLeaveHub: false,
      });
    }

    const state: GameState = {
      gameId: uuidv4(),
      players,
      currentPlayerIndex: 0,
      status: GameStatus.STARTED,
      turnPhase: TurnPhase.WAITING_ROLL,
      lastDiceRoll: null,
      activeQuestionId: null,
      winner: null,
      finalChallengeCategory: null,
    };

    this.store.create(state);
    return state;
  }

  rollDice(nickname: string): { value: number; gameState: GameState } {
    const game = this.getActiveGame(nickname);
    this.validateCurrentPlayer(game, nickname);

    if (game.turnPhase !== TurnPhase.WAITING_ROLL) {
      throw new BadRequestException('Not in rolling phase');
    }

    const value = Math.floor(Math.random() * 6) + 1;
    game.lastDiceRoll = value;
    game.turnPhase = TurnPhase.WAITING_MOVE;
    this.store.update(game.gameId, game);

    return { value, gameState: game };
  }

  move(nickname: string, targetPosition: number): GameState {
    const game = this.getActiveGame(nickname);
    this.validateCurrentPlayer(game, nickname);

    if (game.turnPhase !== TurnPhase.WAITING_MOVE) {
      throw new BadRequestException('Not in moving phase');
    }

    if (!this.board.isValidPosition(targetPosition)) {
      throw new BadRequestException('Invalid position');
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    const canAccessHub =
      currentPlayer.wedges.length === 6 && !currentPlayer.mustLeaveHub;
    const validDestinations = this.board.getValidDestinations(
      currentPlayer.position,
      game.lastDiceRoll!,
      canAccessHub,
    );

    if (!validDestinations.includes(targetPosition)) {
      throw new BadRequestException(
        `Invalid destination. Valid positions: ${validDestinations.join(', ')}`,
      );
    }

    const wasAtHub = currentPlayer.mustLeaveHub && currentPlayer.position === 0;
    currentPlayer.position = targetPosition;
    if (wasAtHub && targetPosition !== 0) {
      currentPlayer.mustLeaveHub = false;
    }
    const tile = this.board.getTile(targetPosition);

    if (tile.type === TileType.ROLL_AGAIN) {
      game.turnPhase = TurnPhase.WAITING_ROLL;
    } else if (targetPosition === 0 && currentPlayer.wedges.length === 6) {
      const categories = Object.values(Category);
      game.finalChallengeCategory =
        categories[Math.floor(Math.random() * categories.length)];
      game.turnPhase = TurnPhase.WAITING_FINAL_ANSWER;
    } else {
      game.turnPhase = TurnPhase.WAITING_ANSWER;
    }

    game.lastDiceRoll = null;
    this.store.update(game.gameId, game);
    return game;
  }

  processAnswer(
    gameId: string,
    correct: boolean,
  ): { game: GameState; botTurns: BotTurnResult[] } {
    const game = this.store.findByGameId(gameId);
    if (!game) {
      throw new BadRequestException('Game not found');
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    const tile = this.board.getTile(currentPlayer.position);
    let botTurns: BotTurnResult[] = [];

    if (game.turnPhase === TurnPhase.WAITING_FINAL_ANSWER) {
      if (correct) {
        game.status = GameStatus.FINISHED;
        game.winner = currentPlayer.nickname;
      } else {
        currentPlayer.mustLeaveHub = true;
        this.advanceTurn(game);
        botTurns = this.playBotTurns(game);
      }
      game.finalChallengeCategory = null;
    } else if (correct) {
      if (
        tile.type === TileType.HQ &&
        tile.category &&
        !currentPlayer.wedges.includes(tile.category)
      ) {
        currentPlayer.wedges.push(tile.category);
      }
      game.turnPhase = TurnPhase.WAITING_ROLL;
    } else {
      this.advanceTurn(game);
      botTurns = this.playBotTurns(game);
    }

    game.activeQuestionId = null;
    this.store.update(game.gameId, game);
    return { game, botTurns };
  }

  getActiveGame(nickname: string): GameState {
    const game = this.store.findByNickname(nickname);
    if (!game) {
      throw new BadRequestException('No active game');
    }
    return game;
  }

  private validateCurrentPlayer(game: GameState, nickname: string): void {
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.nickname !== nickname) {
      throw new BadRequestException('Not your turn');
    }
  }

  private advanceTurn(game: GameState): void {
    game.currentPlayerIndex =
      (game.currentPlayerIndex + 1) % game.players.length;
    game.turnPhase = TurnPhase.WAITING_ROLL;
    game.lastDiceRoll = null;
  }

  playBotTurns(game: GameState): BotTurnResult[] {
    const results: BotTurnResult[] = [];
    const categories = Object.values(Category);

    while (
      !game.players[game.currentPlayerIndex].isHuman &&
      game.status !== GameStatus.FINISHED
    ) {
      const bot = game.players[game.currentPlayerIndex];
      let continueRolling = true;
      let rollCount = 0;

      while (continueRolling && rollCount < 10) {
        rollCount++;
        const diceValue = Math.floor(Math.random() * 6) + 1;
        const canAccessHub = bot.wedges.length === 6 && !bot.mustLeaveHub;
        let validDests = this.board.getValidDestinations(
          bot.position,
          diceValue,
          canAccessHub,
        );
        if (validDests.length === 0) break;

        const fromPosition = bot.position;
        const targetPos =
          validDests[Math.floor(Math.random() * validDests.length)];
        bot.position = targetPos;

        if (bot.mustLeaveHub && fromPosition === 0 && targetPos !== 0) {
          bot.mustLeaveHub = false;
        }

        const tile = this.board.getTile(targetPos);

        // Roll Again — no answer, keep rolling
        if (tile.type === TileType.ROLL_AGAIN) {
          results.push({
            botNickname: bot.nickname,
            diceValue,
            fromPosition,
            toPosition: targetPos,
            tileType: tile.type,
            tileCategory: null,
            answerCorrect: null,
            wedgeEarned: null,
            isFinalChallenge: false,
          });
          continue;
        }

        // Hub with 6 wedges — Final Challenge
        if (targetPos === 0 && bot.wedges.length === 6) {
          const answerCorrect = Math.random() < 0.5;
          results.push({
            botNickname: bot.nickname,
            diceValue,
            fromPosition,
            toPosition: targetPos,
            tileType: tile.type,
            tileCategory:
              categories[Math.floor(Math.random() * categories.length)],
            answerCorrect,
            wedgeEarned: null,
            isFinalChallenge: true,
          });
          if (answerCorrect) {
            game.status = GameStatus.FINISHED;
            game.winner = bot.nickname;
            this.store.update(game.gameId, game);
            return results;
          } else {
            bot.mustLeaveHub = true;
            continueRolling = false;
          }
          continue;
        }

        // Category or HQ tile (or hub with < 6 wedges)
        const tileCategory =
          tile.category ??
          categories[Math.floor(Math.random() * categories.length)];
        const answerCorrect = Math.random() < 0.5;
        let wedgeEarned: string | null = null;

        if (
          tile.type === TileType.HQ &&
          answerCorrect &&
          tile.category &&
          !bot.wedges.includes(tile.category)
        ) {
          bot.wedges.push(tile.category);
          wedgeEarned = tile.category;
        }

        results.push({
          botNickname: bot.nickname,
          diceValue,
          fromPosition,
          toPosition: targetPos,
          tileType: tile.type,
          tileCategory: tileCategory,
          answerCorrect,
          wedgeEarned,
          isFinalChallenge: false,
        });

        if (answerCorrect) {
          // Bot answered correctly — continues rolling
        } else {
          continueRolling = false;
        }
      }

      // Advance to next player
      this.advanceTurn(game);
    }

    this.store.update(game.gameId, game);
    return results;
  }
}
