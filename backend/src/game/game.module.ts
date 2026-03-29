import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameStateStore } from './game-state.store';
import { BoardConfig } from './board.config';

@Module({
  controllers: [GameController],
  providers: [GameService, GameStateStore, BoardConfig],
  exports: [GameService, GameStateStore],
})
export class GameModule {}
