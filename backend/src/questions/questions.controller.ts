import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators';
import { QuestionsService } from './questions.service';
import { GameService } from '../game/game.service';
import { GameStateStore } from '../game/game-state.store';
import { TurnPhase } from '../common/enums';
import { AnswerDto } from './dto/answer.dto';

@ApiTags('questions')
@ApiBearerAuth()
@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly gameService: GameService,
    private readonly gameStateStore: GameStateStore,
  ) {}

  @Get(':category')
  @ApiOperation({ summary: 'Buscar pergunta por categoria', description: 'Retorna uma pergunta ainda não usada para a categoria informada. Só válido quando turnPhase=waitingAnswer ou waitingFinalAnswer. O campo correctAnswer é omitido.' })
  @ApiParam({ name: 'category', enum: ['geography', 'entertainment', 'history', 'art', 'science', 'sports'] })
  @ApiResponse({ status: 200, description: 'Pergunta retornada', schema: { example: { id: 'q1', category: 'history', question: 'Quem foi o primeiro presidente do Brasil?', answers: [{ id: 'a', text: 'Deodoro da Fonseca' }, { id: 'b', text: 'Prudente de Morais' }] } } })
  @ApiResponse({ status: 400, description: 'Fase inválida, categoria inválida ou partida não encontrada' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  getByCategory(
    @Param('category') category: string,
    @CurrentUser() nickname: string,
  ) {
    const game = this.gameService.getActiveGame(nickname);

    if (
      game.turnPhase !== TurnPhase.WAITING_ANSWER &&
      game.turnPhase !== TurnPhase.WAITING_FINAL_ANSWER
    ) {
      throw new BadRequestException('Not in answering phase');
    }

    const question = this.questionsService.getByCategory(
      category,
      nickname,
      game.gameId,
    );

    game.activeQuestionId = question.id;
    this.gameStateStore.update(game.gameId, game);

    return question;
  }

  @Post(':id/answer')
  @ApiOperation({ summary: 'Responder pergunta', description: 'Envia a alternativa escolhida (a–d) para a pergunta ativa. Avança o turno e executa os turnos dos bots automaticamente.' })
  @ApiParam({ name: 'id', description: 'ID da pergunta retornada pelo GET anterior' })
  @ApiResponse({ status: 201, description: 'Resultado da resposta', schema: { example: { correct: true, correctAnswer: 'a', gameState: { gameId: 'uuid', currentPlayer: 'Thiago', turnPhase: 'waitingRoll', status: 'started', winner: null, players: [] }, botTurns: [] } } })
  @ApiResponse({ status: 400, description: 'Pergunta não está ativa ou partida não encontrada' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  answer(
    @Param('id') questionId: string,
    @Body() dto: AnswerDto,
    @CurrentUser() nickname: string,
  ) {
    const game = this.gameService.getActiveGame(nickname);

    if (game.activeQuestionId !== questionId) {
      throw new BadRequestException('This question is not currently active');
    }

    const result = this.questionsService.checkAnswer(questionId, dto.answerId);
    const { game: updatedGame, botTurns } = this.gameService.processAnswer(
      game.gameId,
      result.correct,
    );

    return {
      correct: result.correct,
      correctAnswer: result.correctAnswer,
      gameState: {
        gameId: updatedGame.gameId,
        currentPlayer:
          updatedGame.players[updatedGame.currentPlayerIndex].nickname,
        turnPhase: updatedGame.turnPhase,
        status: updatedGame.status,
        winner: updatedGame.winner,
        finalChallengeCategory: updatedGame.finalChallengeCategory,
        players: updatedGame.players.map((p) => ({
          nickname: p.nickname,
          position: p.position,
          wedges: p.wedges,
          isHuman: p.isHuman,
        })),
      },
      botTurns,
    };
  }
}
