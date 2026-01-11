import { Module } from '@nestjs/common';
import { DrizzleModule } from '../../drizzle/drizzle.module';
import { ChainEventsService } from './chain-events.service';

@Module({
  imports: [DrizzleModule],
  providers: [ChainEventsService],
})
export class ChainEventsModule {}
