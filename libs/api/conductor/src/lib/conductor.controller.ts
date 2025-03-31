import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AuditQueueService } from './audit-queue.service';
import {
  isFailedAuditResult,
  isSuccessfulAuditResult,
  UploadAuditResultsRequestBody,
} from '@app-speed/shared-conductor';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';

@Controller('conductor')
export class ConductorController {
  readonly #logger = new Logger(ConductorController.name);
  constructor(private readonly auditQueue: AuditQueueService) {}

  @Post('requestAudit')
  requestAudit(@Body() body: unknown) {
    if (body && Schema.is(ReplayUserflowAuditSchema)(body)) {
      return { success: true };
    } else {
      console.log('Failed Body', body);
      try {
        Schema.decodeUnknownSync(ReplayUserflowAuditSchema)(body);
      } catch (e) {
        console.error(e);
      }

      return { success: false };
    }
    console.log('WOLOLO', body);
    return body;
    // Should validate audit
    // Should return audit failed if invalid Schema
    // Should return Audit ID
  }

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
