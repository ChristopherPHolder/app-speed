import { scheduleAudit } from './schedule-audit';

describe('scheduleAudit', () => {
  it('should work', () => {
    expect(scheduleAudit()).toEqual('schedule-audit');
  });
});
