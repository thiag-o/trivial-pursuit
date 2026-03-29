import { Injectable } from '@nestjs/common';
import { GameState } from '../common/interfaces';

@Injectable()
export class GameStateStore {
  private games = new Map<string, GameState>();
  private playerGames = new Map<string, string>();

  create(state: GameState): void {
    this.games.set(state.gameId, state);
    for (const player of state.players) {
      this.playerGames.set(player.nickname, state.gameId);
    }
  }

  findByGameId(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  findByNickname(nickname: string): GameState | undefined {
    const gameId = this.playerGames.get(nickname);
    if (!gameId) return undefined;
    return this.games.get(gameId);
  }

  update(gameId: string, state: GameState): void {
    this.games.set(gameId, state);
  }

  delete(gameId: string): void {
    const state = this.games.get(gameId);
    if (state) {
      for (const player of state.players) {
        this.playerGames.delete(player.nickname);
      }
    }
    this.games.delete(gameId);
  }
}
