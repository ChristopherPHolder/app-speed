import { Module } from '@nestjs/common';
import { ConductorGateway } from './conductor.gateway';
import { AuditQueueService } from './audit-queue.service';
import { ConductorController } from './conductor.controller';
import { RunnerManagerService } from './runner-manager.service';

@Module({
  controllers: [ConductorController],
  providers: [ConductorGateway, AuditQueueService, RunnerManagerService],
})
export class ConductorModule {}
