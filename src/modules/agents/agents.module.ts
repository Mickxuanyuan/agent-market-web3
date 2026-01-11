import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { DrizzleModule } from '../../drizzle/drizzle.module';
import { AuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [AgentsController],
  providers: [AgentsService],
})
export class AgentsModule {}
