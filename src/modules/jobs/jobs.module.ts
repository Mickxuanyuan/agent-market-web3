import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { DrizzleModule } from '../../drizzle/drizzle.module';
import { AuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
