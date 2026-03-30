import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { QuestionsService } from './questions.service';
import { GameService } from '../game/game.service';
import { GameStateStore } from '../game/game-state.store';
import { TurnPhase } from '../common/enums';
import { AnswerDto } from './dto/answer.dto';

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly gameService: GameService,
    private readonly gameStateStore: GameStateStore,
  ) {}

  @Get(':category')
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
