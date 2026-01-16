import { Module } from '@nestjs/common';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { DrizzleModule } from '../../drizzle/drizzle.module';
import { AuthModule } from '../../common/auth/auth.module';

@Module({
  imports: [DrizzleModule, AuthModule],
  controllers: [BillsController],
  providers: [BillsService],
})
export class BillsModule {}
