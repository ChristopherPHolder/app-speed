import { Injectable, Logger } from '@nestjs/common';
import { AuditQueueService } from './audit-queue.service';
import { RunnerManagerService } from './runner-manager.service';

@Injectable()
export class ConductorService {
  readonly #logger = new Logger(ConductorService.name);

  constructor(
    private readonly queue: AuditQueueService,
    private readonly runner: RunnerManagerService,
  ) {}

  scheduleAudit({ id, details }: any) {
    this.#logger.log(`Schedule Audit`);
    this.queue.enqueue({ id, details });
    this.runner.activateRunner();
  }
}
