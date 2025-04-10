import { Schema } from 'effect';
import { describe, it } from 'vitest';
import { ReplayUserflowAuditSchema } from './audit.schema';

describe('ReplayUserflowAuditSchema', () => {
  it('should accept valid audit', async () => {
    expect(
      Schema.is(ReplayUserflowAuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [
          {
            type: 'endNavigation',
          },
        ],
      }),
    ).toBe(true);
  });

  it('should reject empty object', () => {
    expect(Schema.is(ReplayUserflowAuditSchema)({})).toBe(false);
  });

  it('should reject missing device', () => {
    expect(Schema.is(ReplayUserflowAuditSchema)({ title: '' })).toBe(false);
  });

  it('should reject missing title', () => {
    expect(Schema.is(ReplayUserflowAuditSchema)({ device: '' })).toBe(false);
  });

  it('should reject invalid timeout', () => {
    expect(
      Schema.is(ReplayUserflowAuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        timeout: -1,
      }),
    ).toBe(false);

    // TODO invalidate over 30_000
  });

  it('should reject no steps', () => {
    expect(
      Schema.is(ReplayUserflowAuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
      }),
    ).toBe(false);

    expect(
      Schema.is(ReplayUserflowAuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [],
      }),
    ).toBe(false);
  });

  it('should reject if no audit step in steps', () => {
    expect(
      Schema.is(ReplayUserflowAuditSchema)({
        title: 'Stub audit title',
        device: 'mobile',
        steps: [
          {
            type: 'navigate',
            url: 'https://www.google.com',
          },
        ],
      }),
    ).toBe(false);
  });
});
