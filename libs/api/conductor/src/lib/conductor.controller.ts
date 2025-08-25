import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AuditQueueService } from './audit-queue.service';
import {
  isFailedAuditResult,
  isSuccessfulAuditResult,
  RequestAuditResponse,
  UploadAuditResultsRequestBody,
} from '@app-speed/shared-conductor';
import { Schema, Either, ParseResult } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { randomUUID } from 'node:crypto';

@Controller('conductor')
export class ConductorController {
  readonly #logger = new Logger(ConductorController.name);
  constructor(private readonly auditQueue: AuditQueueService) {}

  @Post('requestAudit')
  requestAudit(@Body() body: unknown): RequestAuditResponse {
    this.#logger.debug('POST requestAudit', body);
    const eitherAuditDetails = Schema.decodeUnknownEither(ReplayUserflowAuditSchema)(body);

    if (Either.isLeft(eitherAuditDetails)) {
      const parseError = eitherAuditDetails.left;
      const formatedErrorMessage = ParseResult.TreeFormatter.formatErrorSync(parseError);
      return { status: 'failed', message: { errorMessage: formatedErrorMessage } };
    }

    const auditId = randomUUID();
    // TODO initialize process
    return { status: 'success', message: { auditId } };
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
