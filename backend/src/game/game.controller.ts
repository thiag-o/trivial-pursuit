import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators';
import { TurnPhase } from '../common/enums';
import { GameService } from './game.service';
import { StartGameDto, MoveDto, RollDiceDto } from './dto';

@ApiTags('game')
@ApiBearerAuth()
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('start')
  @ApiOperation({
    summary: 'Iniciar partida',
    description:
      'Cria uma nova partida para o jogador autenticado com o número de bots indicado.',
  })
  @ApiResponse({
    status: 201,
    description: 'Partida criada',
    schema: {
      example: {
        gameId: 'uuid',
        players: [
          { nickname: 'Thiago', position: 0, wedges: [], isHuman: true },
        ],
        currentPlayer: 'Thiago',
        status: 'started',
        turnPhase: 'waitingRoll',
        lastDiceRoll: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Já existe uma partida em andamento para este jogador',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  start(@Body() dto: StartGameDto, @CurrentUser() nickname: string) {
    const state = this.gameService.startGame(nickname, dto.opponents ?? 3);
    return {
      gameId: state.gameId,
      players: state.players.map((p) => ({
        nickname: p.nickname,
        position: p.position,
        wedges: [p.wedges],
        isHuman: p.isHuman,
      })),
      currentPlayer: state.players[state.currentPlayerIndex].nickname,
      status: state.status,
      turnPhase: state.turnPhase,
      lastDiceRoll: state.lastDiceRoll,
    };
  }

  @Post('roll-dice')
  @ApiOperation({
    summary: 'Rolar dado',
    description: 'Rola o dado (1–6). Só válido quando turnPhase=waitingRoll.',
  })
  @ApiResponse({
    status: 201,
    description: 'Valor do dado',
    schema: { example: { value: 4 } },
  })
  @ApiResponse({
    status: 400,
    description: 'Não é a fase de rolar o dado ou partida não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  rollDice(@Body() dto: RollDiceDto, @CurrentUser() nickname: string) {
    const { value } = this.gameService.rollDice(nickname, dto.value);
    return { value };
  }

  @Post('move')
  @ApiOperation({
    summary: 'Mover peça',
    description:
      'Move o jogador para targetPosition. Posições válidas são retornadas implicitamente pelo dado. Só válido quando turnPhase=waitingMove.',
  })
  @ApiResponse({
    status: 201,
    description: 'Estado do jogo após o movimento',
    schema: {
      example: {
        gameId: 'uuid',
        players: [],
        currentPlayer: 'Thiago',
        status: 'started',
        turnPhase: 'waitingAnswer',
        lastDiceRoll: 4,
        tileType: 'category',
        tileCategory: 'history',
        isFinalChallenge: false,
        finalCategory: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Posição inválida, fase errada ou partida não encontrada',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
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
      isFinalChallenge: state.turnPhase === TurnPhase.WAITING_FINAL_ANSWER,
      finalCategory: state.finalChallengeCategory,
    };
  }
}
