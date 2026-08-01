import { describe, expect, it } from 'vitest';

describe('Audit', () => {
  async function ScheduleRequest(payload: unknown) {
    const r = await fetch(USER_FLOW_SCHEDULE_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await r.json();
  }

  async function CompleteRequest(payload: unknown) {
    const r = await fetch('http://localhost:3000/api/runner/complete', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await r.json();
  }

  it('should reject malformed audit payloads', async () => {
    const response = await fetch(USER_FLOW_SCHEDULE_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: '{}',
    });

    expect(response.status).toBe(400);
  });

  it('should schedule audit', async () => {
    const response = await ScheduleRequest(MOCK_AUDIT);

    expect(response.auditId).toBeTypeOf('string');
    expect(response.auditQueuePosition).toBeTypeOf('number');
  });

  it('should return error if no audit found', async () => {
    const res = await fetch(`${USER_FLOW_API_ENDPOINT}00000000-0000-4000-8000-000000000000`);
    expect(res.status).toBe(404);
    expect(await res.json()).toHaveProperty('_tag', 'AuditNotFoundError');
  });

  it('should find scheduled audits', async () => {
    const scheduleResponse = await ScheduleRequest(MOCK_AUDIT);
    const findResponse = await fetch(`${USER_FLOW_API_ENDPOINT}${scheduleResponse.auditId}`).then((r) => r.json());

    expect(findResponse).toHaveProperty('status', 'SCHEDULED');
  });

  it('should watch audit', async () => {
    const scheduleResponse = await ScheduleRequest(MOCK_AUDIT);
    let receivedChunk = '';
    await subscribeSSE(`${USER_FLOW_API_ENDPOINT}${scheduleResponse.auditId}/events`, (chunk) => {
      receivedChunk = chunk;
    });
    expect(receivedChunk.length).toBeGreaterThan(0);
  });

  it('should list combined audit history with cursor envelope', async () => {
    await ScheduleRequest(MOCK_AUDIT);
    await ScheduleRequest({ ...MOCK_AUDIT, title: 'Another audit' });

    const res = await fetch(`${AUDIT_HISTORY_ENDPOINT}?limit=1`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body.items)).toBe(true);
    expect(body.limit).toBe(1);
    expect(body.items[0]).toHaveProperty('auditId');
    expect(body.items[0]).toHaveProperty('kind', 'user-flow');
    expect(body.items[0]).toHaveProperty('title');
    expect(body.items[0]).toHaveProperty('status');
    expect(body).toHaveProperty('nextCursor');
  });

  it('should return structured invalid query errors for bad list limits', async () => {
    const res = await fetch(`${AUDIT_HISTORY_ENDPOINT}?limit=0`);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({
      _tag: 'AuditHistoryInvalidQueryError',
      code: 'INVALID_QUERY',
    });
  });

  it('should return structured invalid cursor errors', async () => {
    const res = await fetch(`${AUDIT_HISTORY_ENDPOINT}?cursor=bad-cursor`);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({
      _tag: 'AuditHistoryInvalidCursorError',
      code: 'INVALID_CURSOR',
    });
  });

  it('should enforce the user-flow filter on feature history', async () => {
    const scheduleResponse = await ScheduleRequest(MOCK_AUDIT);
    const res = await fetch(`${USER_FLOW_API_ENDPOINT}history`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toContainEqual(
      expect.objectContaining({ auditId: scheduleResponse.auditId, kind: 'user-flow', title: MOCK_AUDIT.title }),
    );
  });

  it('does not expose the legacy audit run endpoints', async () => {
    expect((await fetch('http://localhost:3000/api/audit/runs')).status).toBe(404);
    expect((await fetch('http://localhost:3000/api/audit/runs/STUB_ID')).status).toBe(404);
  });

  it('should return stored lighthouse html report', async () => {
    const scheduleResponse = await ScheduleRequest(MOCK_AUDIT);

    const completeResponse = await CompleteRequest({
      runnerId: 'runner-e2e',
      auditId: scheduleResponse.auditId,
      kind: 'user-flow',
      status: 'SUCCESS',
      result: {
        flowResult: { score: 0.9 },
        reportHtml: '<!doctype html><html><body>Lighthouse flow report</body></html>',
      },
      durationMs: 321,
    });

    expect(completeResponse).toEqual({ ok: true });

    const res = await fetch(`${USER_FLOW_API_ENDPOINT}${scheduleResponse.auditId}/report`);
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(body).toContain('Lighthouse flow report');
  });
});

const MOCK_AUDIT = {
  title: 'Example Title',
  device: 'mobile',
  timeout: 30000,
  steps: [
    { type: 'customStep', step: 'startNavigation', name: 'Initial Navigation' },
    { type: 'navigate', url: 'https://google.com' },
    { type: 'customStep', step: 'endNavigation' },
  ],
};

const AUDIT_HISTORY_ENDPOINT = 'http://localhost:3000/api/audits/history';
const USER_FLOW_SCHEDULE_ENDPOINT = 'http://localhost:3000/api/audits/user-flow/schedule';
const USER_FLOW_API_ENDPOINT = 'http://localhost:3000/api/audits/user-flow/';

export async function subscribeSSE(url: string, onData: (c: string) => void) {
  const res = await fetch(url, {
    headers: { accept: 'text/event-stream' },
  });

  if (!res.ok) throw new Error(`SSE ${res.status} ${res.statusText}`);
  if (!res.body) throw new Error('SSE: missing response body');

  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    onData(decoder.decode(chunk));
    return;
  }

  throw new Error('SSE: no data received');
}
