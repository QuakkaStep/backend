import { Module } from '@nestjs/common';
import { PoolMonitoringService } from './pool-monitoring.service';
import { PoolMonitoringController } from './pool-monitoring.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoolStats } from './entities/pool-stats.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { PoolMonitoringTaskService } from './pool-monitoring.task.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoolStats]),
    ScheduleModule.forRoot(),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PoolMonitoringController],
  providers: [PoolMonitoringService, PoolMonitoringTaskService],
})
export class PoolMonitoringModule {}
