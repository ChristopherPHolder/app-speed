import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { webSocket } from 'rxjs/webSocket';
import { AuditRequestParams, RunnerResponseMessage } from 'shared';
import { Observer } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from 'shared';

@Component({
  selector: 'app-audit-form',
  templateUrl: './audit-form.component.html',
  styleUrls: ['./audit-form.component.scss'],
})
export class AuditFormComponent {
  private subject = webSocket(environment.ufoSocketUrl);
  private auditRequestParams?: AuditRequestParams;

  showResultsBox = false;
  loading = false;
  toastText: string | null = null;

  htmlReportUrl?: SafeResourceUrl;

  webSocketIsConnected?: boolean;

  onSubmit(f: NgForm) {
    if (!f.valid || this.webSocketIsConnected) {
      return console.error('Invalid parameters passed', f.value);
    }

    this.auditRequestParams = { action: 'scheduleAudits', targetUrl: f.value.targetUrl }

    this.scheduleAudit(this.auditRequestParams);
  }

  private scheduleAudit(auditParams: AuditRequestParams): void {
    console.log('Scheduling audit using', auditParams);
    this.showResultsBox = true;
    this.loading = true;
    this.subject.subscribe(this.handleWebSocketMessages());
    this.handleWebSocketOpen(auditParams);
  }

  private handleWebSocketOpen(auditParams: AuditRequestParams) {
    console.log('Connection is open!');
    this.toastText = `Scheduling user-flow audit`;
    this.webSocketIsConnected = true;
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
      this.loading = false;
      this.toastText = `Audit Failed`;
      return console.log('Socket response unknown', socketResponse);
    }
    if (socketResponse.action === 'scheduled') {
      this.toastText = `Audit was successfully schedule\nRunning audit ...`;
      return console.log('Scheduled audit response', socketResponse);
    }
    if (socketResponse.action === 'completed') {
      this.toastText = null;
      this.loading = false;
      // TODO Add check for missing report results;
      return this.receiveAuditResults(socketResponse as RunnerResponseMessage);
    }
  }

  private handleWebSocketError(error: unknown): void {
    console.error(error);
  }

  private handleWebSocketComplete(): void {
    console.log('Closing Web Socket Connection');
  }

  private receiveAuditResults(message: RunnerResponseMessage): void {
    this.subject.complete();
  }
}

