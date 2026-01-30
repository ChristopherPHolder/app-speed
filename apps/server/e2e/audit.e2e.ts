import { describe, it, expect } from 'vitest';

describe('Audit', () => {
  async function ScheduleRequest(payload: any) {
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

  it.todo('should return actionable audit schema error messages', async () => {
    expect(await ScheduleRequest(JSON.stringify({}))).toBe('TODO');
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
    await subscribeSSE(`${AUDIT_API_ENDPOINT}${scheduleResponse.auditId}/events`, async (r) => console.log(r));
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
    console.log('WOLOLO response', chunk, decoder.decode(chunk));
  }
}
