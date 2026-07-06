import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuditProgressService } from './audit-progress.service';

class MockEventSource extends EventTarget {
  static readonly CLOSED = 2;
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;

  static instances: MockEventSource[] = [];

  readyState = MockEventSource.OPEN;
  closed = false;

  constructor(readonly url: string) {
    super();
    MockEventSource.instances.push(this);
  }

  close(): void {
    this.closed = true;
    this.readyState = MockEventSource.CLOSED;
  }
}

describe('AuditProgressService', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the current progress stage when the EventSource reports a reconnectable error', () => {
    const service = TestBed.inject(AuditProgressService);
    const stages: string[] = [];
    const subscription = service.stageName$.subscribe((stage) => stages.push(stage));

    service.watchAudit('audit-123');

    const source = MockEventSource.instances[0];
    source.dispatchEvent(new MessageEvent('status', { data: JSON.stringify({ status: 'IN_PROGRESS' }) }));
    source.readyState = MockEventSource.CONNECTING;
    source.dispatchEvent(new Event('error'));

    expect(stages).not.toContain('failed');
    expect(stages.at(-1)).toBe('running');
    expect(source.closed).toBe(false);

    subscription.unsubscribe();
  });
});
