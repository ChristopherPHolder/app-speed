import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
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
    const http = TestBed.inject(HttpTestingController);
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
    http.expectNone('/api/audits/user-flow/audit-123/result');

    subscription.unsubscribe();
  });

  it('surfaces a failed stage when the EventSource closes permanently before a result is available', () => {
    const service = TestBed.inject(AuditProgressService);
    const http = TestBed.inject(HttpTestingController);
    const stages: string[] = [];
    const resultKeys: string[] = [];
    const stageSubscription = service.stageName$.subscribe((stage) => stages.push(stage));
    const keySubscription = service.key$.subscribe((key) => resultKeys.push(key));

    service.watchAudit('audit-123');

    const source = MockEventSource.instances[0];
    source.dispatchEvent(new MessageEvent('status', { data: JSON.stringify({ status: 'IN_PROGRESS' }) }));
    source.readyState = MockEventSource.CLOSED;
    source.dispatchEvent(new Event('error'));

    const request = http.expectOne('/api/audits/user-flow/audit-123/result');
    request.flush({ message: 'Result not available.' }, { status: 404, statusText: 'Not Found' });

    expect(stages.at(-1)).toBe('failed');
    expect(resultKeys).toEqual(['audit-123']);
    expect(source.closed).toBe(true);

    stageSubscription.unsubscribe();
    keySubscription.unsubscribe();
  });

  it('ignores stale fallback result responses after another audit starts', () => {
    const service = TestBed.inject(AuditProgressService);
    const http = TestBed.inject(HttpTestingController);
    const stages: string[] = [];
    const resultKeys: string[] = [];
    const stageSubscription = service.stageName$.subscribe((stage) => stages.push(stage));
    const keySubscription = service.key$.subscribe((key) => resultKeys.push(key));

    service.watchAudit('audit-a');
    const auditASource = MockEventSource.instances[0];
    auditASource.dispatchEvent(new MessageEvent('status', { data: JSON.stringify({ status: 'IN_PROGRESS' }) }));
    auditASource.readyState = MockEventSource.CLOSED;
    auditASource.dispatchEvent(new Event('error'));
    const auditAResultRequest = http.expectOne('/api/audits/user-flow/audit-a/result');

    service.watchAudit('audit-b');
    const auditBSource = MockEventSource.instances[1];
    auditBSource.dispatchEvent(new MessageEvent('status', { data: JSON.stringify({ status: 'IN_PROGRESS' }) }));
    expect(auditAResultRequest.cancelled).toBe(true);

    expect(stages.at(-1)).toBe('running');
    expect(resultKeys).toEqual([]);
    expect(auditBSource.closed).toBe(false);

    stageSubscription.unsubscribe();
    keySubscription.unsubscribe();
  });
  it('polls project progress through HTTP and cancels pending reads on navigation', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/audits/user-flow/private?projectId=project-a');
    const service = TestBed.inject(AuditProgressService);
    const http = TestBed.inject(HttpTestingController);
    service.watchAudit('private');
    const privateRequest = await vi.waitFor(() => http.expectOne('/api/audits/user-flow/private'));
    expect(MockEventSource.instances).toHaveLength(0);
    // A new audit must cancel the old request rather than display a late response from it.
    service.watchAudit('next');
    expect(privateRequest.cancelled).toBe(true);
    await vi.waitFor(() => {
      const requests = http.match('/api/audits/user-flow/next');
      expect(requests).toHaveLength(1);
      requests[0].flush({ status: 'COMPLETE', auditQueuePosition: 0 });
    });
    const result = http.expectOne('/api/audits/user-flow/next/result');
    result.flush({ status: 'SUCCESS', result: {} });
    let stage = '';
    const subscription = service.stageName$.subscribe((value) => {
      stage = value;
    });
    expect(stage).toBe('done');
    subscription.unsubscribe();
    vi.restoreAllMocks();
  });
});
