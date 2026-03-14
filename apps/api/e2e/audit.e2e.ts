import { describe, it, expect } from 'vitest';

describe('Audit', () => {
  async function ScheduleRequest(payload: unknown) {
    const r = await fetch(`${AUDIT_API_ENDPOINT}schedule`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await r.json();
  }

  it('should return actionable audit schema error messages', async () => {
    const response = await ScheduleRequest({});

    expect(response).toMatchObject({
      _tag: 'HttpApiDecodeError',
    });
    expect(response.message).toContain('title');
    expect(response.issues[0]).toMatchObject({
      _tag: 'Missing',
      path: ['title'],
    });
  });

  it('should schedule audit', async () => {
    const response = await ScheduleRequest(MOCK_AUDIT);

    expect(response.auditId).toBeTypeOf('string');
    expect(response.auditQueuePosition).toBeTypeOf('number');
  });

  it('should return error if no audit found', async () => {
    const res = await fetch(`${AUDIT_API_ENDPOINT}STUB_ID`);
    expect(res.status).toBe(404);
    expect(await res.json()).toHaveProperty('_tag', 'AuditNotFoundError');
  });

  it('should find scheduled audits', async () => {
    const scheduleResponse = await ScheduleRequest(MOCK_AUDIT);
    const findResponse = await fetch(`${AUDIT_API_ENDPOINT}${scheduleResponse.auditId}`).then((r) => r.json());

    expect(findResponse).toHaveProperty('status', 'SCHEDULED');
  });

  it('should watch audit', async () => {
    const scheduleResponse = await ScheduleRequest(MOCK_AUDIT);
    let receivedChunk = '';
    await subscribeSSE(`${AUDIT_API_ENDPOINT}${scheduleResponse.auditId}/events`, (chunk) => {
      receivedChunk = chunk;
    });
    expect(receivedChunk.length).toBeGreaterThan(0);
  });

  it('should list audit runs with cursor envelope', async () => {
    await ScheduleRequest(MOCK_AUDIT);
    await ScheduleRequest({ ...MOCK_AUDIT, title: 'Another audit' });

    const res = await fetch(`${AUDIT_API_ENDPOINT}runs?limit=1`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body.items)).toBe(true);
    expect(body.limit).toBe(1);
    expect(body.items[0]).toHaveProperty('auditId');
    expect(body.items[0]).toHaveProperty('title');
    expect(body.items[0]).toHaveProperty('status');
    expect(body).toHaveProperty('nextCursor');
  });

  it('should return structured invalid query errors for bad list limits', async () => {
    const res = await fetch(`${AUDIT_API_ENDPOINT}runs?limit=0`);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({
      _tag: 'AuditRunsInvalidQueryError',
      code: 'INVALID_QUERY',
    });
  });

  it('should return structured invalid cursor errors', async () => {
    const res = await fetch(`${AUDIT_API_ENDPOINT}runs?cursor=bad-cursor`);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({
      _tag: 'AuditRunsInvalidCursorError',
      code: 'INVALID_CURSOR',
    });
  });

  it('should return run summary by id', async () => {
    const scheduleResponse = await ScheduleRequest(MOCK_AUDIT);
    const res = await fetch(`${AUDIT_API_ENDPOINT}runs/${scheduleResponse.auditId}`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      auditId: scheduleResponse.auditId,
      title: MOCK_AUDIT.title,
      status: 'SCHEDULED',
    });
  });

  it('should return run not found for unknown run summary id', async () => {
    const res = await fetch(`${AUDIT_API_ENDPOINT}runs/STUB_ID`);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toMatchObject({
      _tag: 'AuditRunSummaryNotFoundError',
      code: 'RUN_NOT_FOUND',
    });
  });
});

const MOCK_AUDIT = {
  title: 'Example Title',
  device: 'mobile',
  steps: [{ type: 'startNavigation' }, { type: 'navigate', url: 'https://google.com' }, { type: 'endNavigation' }],
};

const AUDIT_API_ENDPOINT = 'http://localhost:3000/api/audit/';

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
