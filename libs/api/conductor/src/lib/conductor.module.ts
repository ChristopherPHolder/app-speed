import { Module } from '@nestjs/common';
import { ConductorGateway } from './conductor.gateway';
import { AuditStoreService } from './audit-store.service';
import { ConductorController } from './conductor.controller';

@Module({
  controllers: [ConductorController],
  providers: [ConductorGateway, AuditStoreService],
  exports: [],
})
export class ConductorModule {}
