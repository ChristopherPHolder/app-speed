import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { CONDUCTOR_EVENT_SCHEDULE_AUDIT, CONDUCTOR_SOCKET_PATH } from '@app-speed/shared-conductor';
import { AuditStoreService } from './audit-store.service';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

@WebSocketGateway({ cors: '*', path: CONDUCTOR_SOCKET_PATH })
export class ConductorGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly auditStore: AuditStoreService) {}

  @SubscribeMessage(CONDUCTOR_EVENT_SCHEDULE_AUDIT)
  handleMessage(client: any, payload: any) {
    console.log('--->', client, payload);

    this.auditStore.audits.push({ id: client.id, details: payload });

    return {
      event: 'scheduled',
      data: this.server.clients,
    };
  }

  afterInit(server: any): any {
    console.log('---->> afterInit');
  }

  handleConnection(client: WebSocket, request: IncomingMessage): void {
    const token = new URL(request.url!).searchParams.get('token');

    client.send(
      JSON.stringify({
        event: 'connected',
        token,
      }),
    );
  }

  handleDisconnect(client: any): any {
    console.log('---->> handleDisconnect');
  }
}
