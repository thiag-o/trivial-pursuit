import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { QuestionsStore } from './questions.store';
import { GameModule } from '../game/game.module';

@Module({
  imports: [GameModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsStore],
})
export class QuestionsModule {}
