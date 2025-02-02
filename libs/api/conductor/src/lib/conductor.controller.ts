import { Controller, Get, Logger, Post, Put } from '@nestjs/common';
import { AuditQueueService } from './audit-queue.service';

@Controller('conductor')
export class ConductorController {
  readonly #logger = new Logger(ConductorController.name);
  constructor(private readonly auditQueue: AuditQueueService) {}

  @Get('audits')
  queuedAudits() {
    this.#logger.log('Called getAudits');
    return { data: this.auditQueue.list() };
  }

  count = 10;
  @Post('dequeueAudits')
  dequeueAudits() {
    if (this.count) {
      this.count--;
      return { data: this.count };
    }
    setTimeout(() => {
      this.count = 10;
    }, 5_000);
    return { data: null };
  }

  @Put('auditComplete')
  auditComplete() {
    this.#logger.log('Audit Complete');
    return { data: this.auditQueue.list() };
  }
}
