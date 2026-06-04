import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditProgressService } from './audit-progress.service';

class FakeEventSource extends EventTarget {
  static readonly CLOSED = 2;
  static latest: FakeEventSource | null = null;

  readyState = 0;

  constructor(readonly url: string) {
    super();
    FakeEventSource.latest = this;
  }

  close(): void {
    this.readyState = FakeEventSource.CLOSED;
  }

  emitMessage(eventName: string, data: unknown): void {
    this.dispatchEvent(new MessageEvent(eventName, { data: JSON.stringify(data) }));
  }

  emitError(): void {
    this.dispatchEvent(new Event('error'));
  }
}

describe('AuditProgressService', () => {
  beforeEach(() => {
    FakeEventSource.latest = null;
    vi.stubGlobal('EventSource', FakeEventSource);

    TestBed.configureTestingModule({
      providers: [
        AuditProgressService,
        {
          provide: HttpClient,
          useValue: {
            get: vi.fn(),
          },
        },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  it('does not mark a pending audit as failed when the SSE transport reports an error', () => {
    const service = TestBed.inject(AuditProgressService);
    const stages: string[] = [];
    service.stageName$.subscribe((stage) => stages.push(stage));

    service.watchAudit('audit-123');

    FakeEventSource.latest?.emitMessage('status', { auditId: 'audit-123', status: 'SCHEDULED' });
    expect(stages.at(-1)).toBe('scheduled');

    FakeEventSource.latest?.emitError();

    expect(stages.at(-1)).toBe('scheduled');
    expect(FakeEventSource.latest?.readyState).not.toBe(FakeEventSource.CLOSED);
  });
});
