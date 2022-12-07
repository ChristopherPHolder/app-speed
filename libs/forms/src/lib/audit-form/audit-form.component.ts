import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { webSocket } from 'rxjs/webSocket';
import { AuditRequestParams, RunnerResponseMessage } from 'shared';
import { Observer } from 'rxjs';

@Component({
  selector: 'app-audit-form',
  templateUrl: './audit-form.component.html',
  styleUrls: ['./audit-form.component.scss'],
})
export class AuditFormComponent {
  // 'wss://5ag9xf0aab.execute-api.us-east-1.amazonaws.com/ufo'
  private subject = webSocket('wss://5ag9xf0aab.execute-api.us-east-1.amazonaws.com/ufo');
  private auditRequestParams?: AuditRequestParams;

  onSubmit(f: NgForm) {
    // TODO Check Web connection is not open (closed);
    // before changing the value
    this.auditRequestParams = {
      action: 'scheduleAudits',
      targetUrl: f.value.targetUrl,
    }
    console.log(f.value);
    console.log(f.valid);
    this.scheduleAudit(this.auditRequestParams);
  }

  private scheduleAudit(auditParams: AuditRequestParams): void {
    this.subject.subscribe(this.handleWebSocketMessages());
    this.handleWebSocketOpen(auditParams);
  }

  private handleWebSocketOpen(auditParams: AuditRequestParams) {
    console.log('Connection is open!');
    console.log('Sending request Audit Request:', auditParams);
    this.subject.next(auditParams);
  }

  private handleWebSocketMessages(): Partial<Observer<unknown>> | undefined {
    return {
      next: message => this.handleWebSocketNext(message),
      error: error => this.handleWebSocketError(error),
      complete: () => this.handleWebSocketComplete()
    }
  }

  // TODO Move to shared utils lib
  private hasProp<K extends PropertyKey>(obj: unknown, key: K | null | undefined): obj is Record<K, unknown> {
    return key != null && obj != null && typeof obj === 'object' && key in obj;
  }

  private handleWebSocketNext(socketResponse: unknown | RunnerResponseMessage): void {
    if (!this.hasProp(socketResponse, 'action') || !this.hasProp(socketResponse, 'message')) {
      return console.log('Socket response unknown', socketResponse);
    }
    if (socketResponse.action === 'scheduled') {
      return console.log('Scheduled audit response', socketResponse);
    }
    if (socketResponse.action === 'completed') {
      return this.receiveAuditResults(socketResponse as RunnerResponseMessage);
    }
  }

  private handleWebSocketError(error: unknown): void {
    console.error(error);
  }

  private handleWebSocketComplete(): void {
    console.log('complete');
  }

  private receiveAuditResults(message: RunnerResponseMessage): void {
    console.log('message', message);
    this.subject.complete();
  }
}

