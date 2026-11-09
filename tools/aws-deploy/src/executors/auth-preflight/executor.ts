import type { PromiseExecutor } from '@nx/devkit';
import type { AuthPreflightExecutorSchema } from './schema.d.ts';

const requireValue = (env: NodeJS.ProcessEnv, name: string): string => {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required deployment configuration: ${name}`);
  return value;
};

const runExecutor = async (options: AuthPreflightExecutorSchema): Promise<{ success: boolean }> => {
  const production = options.environment === 'production';
  const publishable = requireValue(process.env, 'CLERK_PUBLISHABLE_KEY');
  if (!publishable.startsWith(production ? 'pk_live_' : 'pk_test_'))
    throw new Error(`CLERK_PUBLISHABLE_KEY must belong to a Clerk ${options.environment} instance.`);

  if (options.application === 'api') {
    const secret = requireValue(process.env, 'CLERK_SECRET_KEY');
    if (!secret.startsWith(production ? 'sk_live_' : 'sk_test_'))
      throw new Error(`CLERK_SECRET_KEY must belong to a Clerk ${options.environment} instance.`);
    const parties = requireValue(process.env, 'CLERK_AUTHORIZED_PARTIES')
      .split(',')
      .map((value) => value.trim());
    if (parties.length !== 1 || parties[0] !== options.portalOrigin)
      throw new Error('CLERK_AUTHORIZED_PARTIES must equal the portal origin for this deployment.');
    const database = requireValue(process.env, 'DATABASE_URL');
    try {
      const url = new URL(database);
      if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname) throw new Error('Invalid URL');
    } catch {
      throw new Error('DATABASE_URL must be a Postgres connection URL.');
    }
  }

  console.info(`Validated ${options.application} authentication configuration for ${options.environment}.`);
  return { success: true };
};

export default runExecutor satisfies PromiseExecutor<AuthPreflightExecutorSchema>;
