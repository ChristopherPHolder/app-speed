import { afterEach, describe, expect, it, vi } from 'vitest';
import runExecutor from './executor';

const options = {
  application: 'api',
  environment: 'production',
  portalOrigin: 'https://appspeed.dev',
} satisfies Parameters<typeof runExecutor>[0];

const configure = () => {
  vi.stubEnv('CLERK_SECRET_KEY', 'sk_live_example');
  vi.stubEnv('CLERK_PUBLISHABLE_KEY', 'pk_live_example');
  vi.stubEnv('CLERK_AUTHORIZED_PARTIES', 'https://appspeed.dev');
  vi.stubEnv('DATABASE_URL', 'postgresql://user:private-value@db.example.com/app');
};

describe('authentication deployment preflight', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('accepts the production API configuration', async () => {
    configure();
    expect(await runExecutor(options)).toEqual({ success: true });
  });

  it.each(['CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY', 'CLERK_AUTHORIZED_PARTIES', 'DATABASE_URL'])(
    'rejects missing %s before deployment',
    async (name) => {
      configure();
      vi.stubEnv(name, '');
      await expect(runExecutor(options)).rejects.toThrow(name);
    },
  );

  it.each([
    ['CLERK_SECRET_KEY', 'sk_test_example'],
    ['CLERK_PUBLISHABLE_KEY', 'pk_test_example'],
    ['CLERK_AUTHORIZED_PARTIES', 'http://localhost:4200'],
    ['CLERK_AUTHORIZED_PARTIES', 'https://appspeed.dev,https://other.example.com'],
    ['DATABASE_URL', 'not-postgres'],
  ])('rejects incompatible %s without leaking values', async (name, value) => {
    configure();
    vi.stubEnv(name, value);
    await expect(runExecutor(options)).rejects.toThrow(name);
    await expect(runExecutor(options)).rejects.not.toThrow(value);
  });

  it('validates the portal without requiring server secrets', async () => {
    configure();
    vi.stubEnv('CLERK_SECRET_KEY', '');
    vi.stubEnv('DATABASE_URL', '');
    expect(await runExecutor({ ...options, application: 'portal' })).toEqual({ success: true });
  });

  it('requires development keys and its own portal origin for development', async () => {
    configure();
    const development = {
      ...options,
      environment: 'development',
      portalOrigin: 'https://dev.appspeed.dev',
    } satisfies Parameters<typeof runExecutor>[0];
    await expect(runExecutor(development)).rejects.toThrow('CLERK_PUBLISHABLE_KEY');
    vi.stubEnv('CLERK_PUBLISHABLE_KEY', 'pk_test_example');
    vi.stubEnv('CLERK_SECRET_KEY', 'sk_test_example');
    vi.stubEnv('CLERK_AUTHORIZED_PARTIES', 'https://dev.appspeed.dev');
    expect(await runExecutor(development)).toEqual({ success: true });
  });
});
