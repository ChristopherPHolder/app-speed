import { auditQueue } from './audit-queue';

describe('auditQueue', () => {
  it('should work', () => {
    expect(auditQueue()).toEqual('audit-queue');
  });
});
