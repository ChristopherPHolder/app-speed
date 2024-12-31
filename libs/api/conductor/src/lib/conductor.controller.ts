import { Controller, Get } from '@nestjs/common';
import { AuditStoreService } from './audit-store.service';

@Controller('conductor')
export class ConductorController {
  constructor(private readonly auditStore: AuditStoreService) {}

  @Get('audits')
  audits() {
    return { data: this.auditStore.audits };
  }
}
