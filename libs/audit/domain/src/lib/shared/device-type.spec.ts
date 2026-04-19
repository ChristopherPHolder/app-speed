import { describe } from 'vitest';
import { Schema } from 'effect';
import { DeviceSchema } from './device-type';

describe('Device Type', () => {
  it('should validate the device type', async () => {
    expect(Schema.is(DeviceSchema)('mobile')).toBe(true);
    expect(Schema.is(DeviceSchema)('desktop')).toBe(true);
    expect(Schema.is(DeviceSchema)('tablet')).toBe(false);
  });
});
