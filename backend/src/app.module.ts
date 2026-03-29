import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, GameModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
