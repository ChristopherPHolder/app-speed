import { describe, it, expect } from 'vitest';

describe('Health', () => {
  it('should return ok', async () => {
    const res = await fetch('http://localhost:3000/api/health');
    const text = await res.json();
    expect(text).toBe('OK');
  });
});
