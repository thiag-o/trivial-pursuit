import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { QuestionsService } from './questions.service';
import { GameService } from '../game/game.service';
import { AnswerDto } from './dto/answer.dto';

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly gameService: GameService,
  ) {}

  @Get(':category')
  getByCategory(
    @Param('category') category: string,
    @CurrentUser() nickname: string,
  ) {
    const game = this.gameService.getActiveGame(nickname);
    return this.questionsService.getByCategory(
      category,
      nickname,
      game.gameId,
    );
  }

  @Post(':id/answer')
  answer(
    @Param('id') questionId: string,
    @Body() dto: AnswerDto,
    @CurrentUser() nickname: string,
  ) {
    const game = this.gameService.getActiveGame(nickname);
    const result = this.questionsService.checkAnswer(questionId, dto.answerId);
    const updatedGame = this.gameService.processAnswer(
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
      },
    };
  }
}
