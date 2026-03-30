import { describe, expect, it } from 'vitest';
import { ToTitleCasePipe } from './toTitleCase.pipe';

describe('ToTitleCasePipe', () => {
  const pipe = new ToTitleCasePipe();

  it('converts camelCase values into title case', () => {
    expect(pipe.transform('camelCaseValue')).toBe('Camel Case Value');
  });

  it('preserves already separated values while capitalizing them', () => {
    expect(pipe.transform('device type')).toBe('Device Type');
  });
});
