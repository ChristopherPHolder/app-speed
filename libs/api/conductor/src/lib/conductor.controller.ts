import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AuditQueueService } from './audit-queue.service';
import {
  isFailedAuditResult,
  isSuccessfulAuditResult,
  UploadAuditResultsRequestBody,
} from '@app-speed/shared-conductor';

@Controller('conductor')
export class ConductorController {
  readonly #logger = new Logger(ConductorController.name);
  constructor(private readonly auditQueue: AuditQueueService) {}

  @Get('audits')
  queuedAudits() {
    this.#logger.log('Called getAudits');
    return { data: this.auditQueue.list() };
  }

  @Post('dequeueAudits')
  dequeueAudits() {
    const item = this.auditQueue.dequeue();
    if (!item) {
      return { data: null };
    }

    return {
      data: {
        auditId: item.id,
        auditDetails: item.details,
      },
    };
  }

  @Post('uploadResults')
  uploadResults(@Body() result: UploadAuditResultsRequestBody) {
    this.#logger.log(`Upload ${result.data.auditResult.status} audit ${result.data.auditId}`);

    if (isFailedAuditResult(result)) {
      this.#logger.log(`Audit failed with error: `);
      this.#logger.error(result.data.auditResult.error);
    }

    if (isSuccessfulAuditResult(result)) {
      this.#logger.log(`Audit failed with `);
    }

    this.#logger.log('File:', result);
    return { data: 'TODO' };
  }
}
