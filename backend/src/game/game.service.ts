import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { GameStatus, TurnPhase, TileType } from '../common/enums';
import { GameState } from '../common/interfaces';
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

    const players = [{ nickname, position: 0, wedges: [], isHuman: true, mustLeaveHub: false }];
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
    const validDestinations = this.board.getValidDestinations(
      currentPlayer.position,
      game.lastDiceRoll!,
    );

    if (!validDestinations.includes(targetPosition)) {
      throw new BadRequestException(
        `Invalid destination. Valid positions: ${validDestinations.join(', ')}`,
      );
    }

    currentPlayer.position = targetPosition;
    const tile = this.board.getTile(targetPosition);

    if (tile.type === TileType.ROLL_AGAIN) {
      game.turnPhase = TurnPhase.WAITING_ROLL;
    } else {
      game.turnPhase = TurnPhase.WAITING_ANSWER;
    }

    game.lastDiceRoll = null;
    this.store.update(game.gameId, game);
    return game;
  }

  processAnswer(gameId: string, correct: boolean): GameState {
    const game = this.store.findByGameId(gameId);
    if (!game) {
      throw new BadRequestException('Game not found');
    }

    const currentPlayer = game.players[game.currentPlayerIndex];
    const tile = this.board.getTile(currentPlayer.position);

    if (correct) {
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
    }

    game.activeQuestionId = null;
    this.store.update(game.gameId, game);
    return game;
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
    do {
      game.currentPlayerIndex =
        (game.currentPlayerIndex + 1) % game.players.length;
    } while (!game.players[game.currentPlayerIndex].isHuman);
    game.turnPhase = TurnPhase.WAITING_ROLL;
    game.lastDiceRoll = null;
  }
}
