import { Module } from '@nestjs/common';
import { PoolMonitoringService } from './pool-monitoring.service';
import { PoolMonitoringController } from './pool-monitoring.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { RaydiumApiService } from 'src/services/raydium.api.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PoolMonitoringController],
  providers: [PoolMonitoringService, RaydiumApiService],
  exports: [PoolMonitoringService],
})
export class PoolMonitoringModule {}
