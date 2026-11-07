const API_BASE_URL = process.env['API_BASE_URL'] ?? 'http://localhost:3000';
import { describe, expect, it } from 'vitest';

describe('Health', () => {
  it('should return ok', async () => {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    const text = await res.json();
    expect(text).toBe('OK');
  });
});
