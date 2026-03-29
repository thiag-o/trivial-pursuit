import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { GameService } from './game.service';
import { StartGameDto, MoveDto } from './dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('start')
  start(@Body() dto: StartGameDto, @CurrentUser() nickname: string) {
    const state = this.gameService.startGame(nickname, dto.opponents ?? 3);
    return {
      gameId: state.gameId,
      players: state.players.map((p) => ({
        nickname: p.nickname,
        position: p.position,
        wedges: p.wedges,
        isHuman: p.isHuman,
      })),
      currentPlayer: state.players[state.currentPlayerIndex].nickname,
      status: state.status,
      turnPhase: state.turnPhase,
      lastDiceRoll: state.lastDiceRoll,
    };
  }

  @Post('roll-dice')
  rollDice(@CurrentUser() nickname: string) {
    const { value } = this.gameService.rollDice(nickname);
    return { value };
  }

  @Post('move')
  move(@Body() dto: MoveDto, @CurrentUser() nickname: string) {
    const state = this.gameService.move(nickname, dto.targetPosition);
    const currentPlayer = state.players[state.currentPlayerIndex];
    const tile = this.gameService['board'].getTile(currentPlayer.position);
    return {
      gameId: state.gameId,
      players: state.players.map((p) => ({
        nickname: p.nickname,
        position: p.position,
        wedges: p.wedges,
        isHuman: p.isHuman,
      })),
      currentPlayer: state.players[state.currentPlayerIndex].nickname,
      status: state.status,
      turnPhase: state.turnPhase,
      lastDiceRoll: state.lastDiceRoll,
      tileType: tile.type,
      tileCategory: tile.category,
    };
  }
}
