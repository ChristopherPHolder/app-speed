import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import {
  AuditStages,
  CONDUCTOR_EVENT_SCHEDULE_AUDIT,
  CONDUCTOR_SOCKET_PATH,
  ConductorStageChangeMessage,
} from '@app-speed/shared-conductor';
import { AuditQueueService } from './audit-queue.service';
import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { RunnerManagerService } from './runner-manager.service';
import { Schema } from 'effect';
import { ReplayUserflowAuditSchema } from '@app-speed/shared-user-flow-replay/schema';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: '*', path: CONDUCTOR_SOCKET_PATH })
export class ConductorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  readonly #clientMap = new Map<WebSocket, string>();
  readonly #logger = new Logger(ConductorGateway.name);

  constructor(
    private readonly auditQueueService: AuditQueueService,
    private readonly runnerManagerService: RunnerManagerService,
  ) {}

  @SubscribeMessage(CONDUCTOR_EVENT_SCHEDULE_AUDIT)
  handleMessage(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: unknown,
  ): ConductorStageChangeMessage<AuditStages['SCHEDULED']> {
    const clientId = this.#clientMap.get(client)!;

    this.#logger.log(`Received audit from ${clientId}`);

    try {
      const auditDetails = Schema.decodeUnknownSync(ReplayUserflowAuditSchema)(data);
      this.auditQueueService.enqueue({ id: clientId, details: auditDetails });
      this.runnerManagerService.activateRunner();
      return { event: 'stage-change', stage: 'scheduled' };
    } catch (error) {
      this.#logger.log(`Error decoding audit from ${clientId}`);
      this.#logger.error(error);

      // TODO handle received invalid audit
      //@ts-ignore
      return { event: 'stage-change', stage: client as any, data };
    }
  }

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    const token = new URL(request.url!, request.headers.origin).searchParams.get('token');
    if (token) {
      this.#clientMap.set(client, token);
    }
    client.send(
      JSON.stringify({
        event: 'connected',
        token,
      }),
    );
  }

  handleDisconnect(client: any): void {
    console.log('---->> handleDisconnect', this.#clientMap.get(client));
  }
}
