import { ExecutorContext, logger, parseTargetString, runExecutor as runNxExecutor } from '@nx/devkit';
import { ChildProcess, spawn, spawnSync } from 'node:child_process';
import { createHash, X509Certificate } from 'node:crypto';
import {
  closeSync,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer as createHttpServer, request as httpRequest, Server } from 'node:http';
import { createServer as createHttpsServer, get as httpsGet } from 'node:https';
import { createServer as createNetServer } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { inspect } from 'node:util';
import { Client } from 'pg';
import { executablePath } from 'puppeteer';
import { LocalSystemTestExecutorSchema } from './schema';

type ExecutorResult = { success: boolean };
type ManagedProcess = { name: string; child: ChildProcess };
type TestDatabase = { adminUrl: string; databaseName: string; runtimeUrl: string };

const DEFAULT_API_PORT = 3000;
const DEFAULT_PORTAL_PORT = 4200;
const DEFAULT_FIXTURE_PORT = 4443;
const DEFAULT_INTEGRATION_TIMEOUT_MS = 120_000;
const DEFAULT_E2E_TIMEOUT_MS = 300_000;
const READINESS_TIMEOUT_MS = 60_000;

export default async function localSystemTestExecutor(
  options: LocalSystemTestExecutorSchema,
  context: ExecutorContext,
): Promise<ExecutorResult> {
  const workspaceRoot = context.root;
  const apiPort = options.apiPort ?? DEFAULT_API_PORT;
  const portalPort = options.portalPort ?? DEFAULT_PORTAL_PORT;
  const fixturePort = options.fixturePort ?? DEFAULT_FIXTURE_PORT;
  const timeoutMs =
    options.timeoutMs ?? (options.suite === 'e2e' ? DEFAULT_E2E_TIMEOUT_MS : DEFAULT_INTEGRATION_TIMEOUT_MS);
  const databaseVariable = options.databaseEnvironmentVariable ?? 'APP_SPEED_TEST_DATABASE_URL';
  const baseDatabaseUrl = process.env[databaseVariable];
  const artifactDirectory = resolve(workspaceRoot, 'artifacts/test-orchestration', options.suite);
  const temporaryDirectory = mkdtempSync(join(tmpdir(), `app-speed-${options.suite}-`));
  const processes: ManagedProcess[] = [];
  const servers: Server[] = [];
  let database: TestDatabase | undefined;
  const originalEnvironment = new Map<string, string | undefined>();
  let cleanupPromise: Promise<void> | undefined;

  const cleanup = () => {
    cleanupPromise ??= (async () => {
      await Promise.all(servers.map(closeServer));
      for (const processHandle of processes.reverse()) {
        await stopProcess(processHandle);
      }
      if (database) {
        await dropTestDatabase(database).catch((error) => {
          logger.warn(`Failed to remove test database ${database?.databaseName}: ${String(error)}`);
        });
      }
      restoreEnvironment(originalEnvironment);
      rmSync(temporaryDirectory, { recursive: true, force: true });
    })();
    return cleanupPromise;
  };
  const handleTermination = (signal: NodeJS.Signals) => {
    logger.warn(`Received ${signal}; cleaning up the local system test stack.`);
    void cleanup().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
  };

  process.once('SIGINT', handleTermination);
  process.once('SIGTERM', handleTermination);

  mkdirSync(artifactDirectory, { recursive: true });
  for (const name of ['api.log', 'runner.log', 'portal.log', 'fixture.log']) {
    writeFileSync(join(artifactDirectory, name), '');
  }

  if (!baseDatabaseUrl) {
    logger.error(
      `${databaseVariable} is required. Set it to a PostgreSQL admin connection URL, for example ` +
        `'postgres://postgres:postgres@localhost:5432/postgres'.`,
    );
    rmSync(temporaryDirectory, { recursive: true, force: true });
    return { success: false };
  }

  try {
    const ports = options.suite === 'e2e' ? [apiPort, portalPort, fixturePort] : [apiPort];
    await assertPortsAvailable(ports);

    database = await createTestDatabase(baseDatabaseUrl, options.suite);
    setEnvironment(originalEnvironment, 'DATABASE_URL', database.runtimeUrl);
    setEnvironment(originalEnvironment, 'DATABASE_MIGRATION_URL', database.runtimeUrl);
    setEnvironment(originalEnvironment, 'RUNNER_MANAGER_MODE', options.suite === 'e2e' ? 'local' : 'manual');
    setEnvironment(originalEnvironment, 'RUNNER_HEADLESS', 'true');
    setEnvironment(originalEnvironment, 'RUNNER_API_BASE_URL', `http://127.0.0.1:${apiPort}/api`);
    setEnvironment(originalEnvironment, 'RUNNER_LOG_FILE', join(artifactDirectory, 'runner.log'));
    setEnvironment(originalEnvironment, 'PORTAL_BASE_URL', `http://127.0.0.1:${portalPort}`);
    setEnvironment(originalEnvironment, 'FIXTURE_BASE_URL', `https://localhost:${fixturePort}`);

    await runTarget('api:build:production', context);
    if (options.suite === 'e2e') {
      await runTarget('runner:build:production', context);
      await runTarget('portal:build:production', context);
    }
    await runTarget('api:migrate', context);

    if (options.suite === 'e2e') {
      const certificate = generateCertificate(temporaryDirectory);
      setEnvironment(originalEnvironment, 'TEST_HTTPS_CERT_SPKI', certificate.spkiHash);
      servers.push(
        startFixtureServer({
          certificatePath: certificate.certificatePath,
          fixtureRoot: resolve(workspaceRoot, 'apps/portal-e2e/fixture'),
          keyPath: certificate.keyPath,
          logPath: join(artifactDirectory, 'fixture.log'),
          port: fixturePort,
        }),
      );
      servers.push(
        startPortalServer({
          apiPort,
          logPath: join(artifactDirectory, 'portal.log'),
          portalRoot: resolvePortalRoot(workspaceRoot),
          port: portalPort,
        }),
      );
    }

    processes.push(
      startProcess({
        args: [resolve(workspaceRoot, 'dist/apps/api/main.js')],
        command: process.execPath,
        cwd: workspaceRoot,
        env: process.env,
        logPath: join(artifactDirectory, 'api.log'),
        name: 'api',
      }),
    );

    await waitForHttp(`http://127.0.0.1:${apiPort}/api/health`, READINESS_TIMEOUT_MS);
    if (options.suite === 'e2e') {
      await waitForHttp(`http://127.0.0.1:${portalPort}/audits/user-flow`, READINESS_TIMEOUT_MS);
      await waitForHttps(`https://localhost:${fixturePort}`, READINESS_TIMEOUT_MS);
    }

    logger.info(`Running ${options.testTarget} with isolated database ${database.databaseName}`);
    const browserPath = options.suite === 'e2e' ? await executablePath() : undefined;
    const targetOverrides = browserPath ? { browser: browserPath } : {};
    await withTimeout(runTarget(options.testTarget, context, targetOverrides), timeoutMs, options.testTarget);
    return { success: true };
  } catch (error) {
    logger.error(error instanceof Error ? (error.stack ?? error.message) : inspect(error, { depth: 6 }));
    logger.error(`Diagnostic logs are available in ${relative(workspaceRoot, artifactDirectory)}`);
    return { success: false };
  } finally {
    process.removeListener('SIGINT', handleTermination);
    process.removeListener('SIGTERM', handleTermination);
    await cleanup();
  }
}

async function runTarget(
  targetString: string,
  context: ExecutorContext,
  overrides: Readonly<Record<string, unknown>> = {},
): Promise<void> {
  const target = parseTargetString(targetString, context);
  const execution = await runNxExecutor(target, overrides, context);
  let succeeded = false;
  let completed = false;
  const iterator = execution[Symbol.asyncIterator]();

  while (!completed) {
    const result: IteratorResult<ExecutorResult, unknown> = await iterator.next();
    completed = result.done === true;
    if (isExecutorResult(result.value)) succeeded ||= result.value.success;
  }

  if (!succeeded) {
    throw new Error(`Nx target ${targetString} failed.`);
  }
}

function isExecutorResult(value: unknown): value is ExecutorResult {
  return typeof value === 'object' && value !== null && 'success' in value && typeof value.success === 'boolean';
}

async function assertPortsAvailable(ports: readonly number[]): Promise<void> {
  for (const port of ports) {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      const server = createNetServer();
      server.once('error', () => {
        rejectPromise(
          new Error(`Port ${port} is already in use. Stop the conflicting process and rerun the Nx target.`),
        );
      });
      server.listen(port, '127.0.0.1', () => server.close(() => resolvePromise()));
    });
  }
}

async function createTestDatabase(baseUrl: string, suite: string): Promise<TestDatabase> {
  const parsedUrl = new URL(baseUrl);
  const databaseName = `app_speed_${suite}_${Date.now()}_${process.pid}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 63);
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await admin.end();
  }

  parsedUrl.pathname = `/${databaseName}`;
  return { adminUrl: baseUrl, databaseName, runtimeUrl: parsedUrl.toString() };
}

async function dropTestDatabase(database: TestDatabase): Promise<void> {
  const admin = new Client({ connectionString: database.adminUrl });
  await admin.connect();
  try {
    await admin.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [database.databaseName],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${database.databaseName}"`);
  } finally {
    await admin.end();
  }
}

function startProcess(options: {
  args: readonly string[];
  command: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  logPath: string;
  name: string;
}): ManagedProcess {
  const logDescriptor = openSync(options.logPath, 'a');
  const child = spawn(options.command, options.args, {
    cwd: options.cwd,
    detached: process.platform !== 'win32',
    env: options.env,
    stdio: ['ignore', logDescriptor, logDescriptor],
  });
  closeSync(logDescriptor);

  child.once('error', (error) => logger.error(`${options.name} failed to start: ${error.message}`));
  return { name: options.name, child };
}

async function stopProcess(processHandle: ManagedProcess): Promise<void> {
  const { child, name } = processHandle;
  if (!child.pid || child.exitCode !== null) return;

  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    } else {
      process.kill(-child.pid, 'SIGTERM');
      await waitForExit(child, 5_000);
      if (child.exitCode === null) process.kill(-child.pid, 'SIGKILL');
    }
  } catch (error) {
    logger.warn(`Unable to terminate ${name}: ${String(error)}`);
  }
}

function waitForExit(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolvePromise) => {
    const timeout = setTimeout(resolvePromise, timeoutMs);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolvePromise();
    });
  });
}

function generateCertificate(directory: string): {
  certificatePath: string;
  keyPath: string;
  spkiHash: string;
} {
  const certificatePath = join(directory, 'fixture-cert.pem');
  const keyPath = join(directory, 'fixture-key.pem');
  const result = spawnSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-sha256',
      '-days',
      '1',
      '-subj',
      '/CN=localhost',
      '-addext',
      'subjectAltName=DNS:localhost,IP:127.0.0.1',
      '-keyout',
      keyPath,
      '-out',
      certificatePath,
    ],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    throw new Error(`Unable to generate the temporary HTTPS certificate: ${result.stderr}`);
  }

  const certificate = new X509Certificate(readFileSync(certificatePath));
  const publicKey = certificate.publicKey.export({ type: 'spki', format: 'der' });
  const spkiHash = createHash('sha256').update(publicKey).digest('base64');
  return { certificatePath, keyPath, spkiHash };
}

function startFixtureServer(options: {
  certificatePath: string;
  fixtureRoot: string;
  keyPath: string;
  logPath: string;
  port: number;
}): Server {
  const log = createWriteStream(options.logPath, { flags: 'a' });
  const server = createHttpsServer(
    {
      cert: readFileSync(options.certificatePath),
      key: readFileSync(options.keyPath),
    },
    (request, response) => {
      log.write(`${new Date().toISOString()} ${request.method ?? 'GET'} ${request.url ?? '/'}\n`);
      serveStaticFile(options.fixtureRoot, request.url ?? '/', response);
    },
  );
  server.once('close', () => log.end());
  server.listen(options.port, '127.0.0.1');
  return server;
}

function startPortalServer(options: { apiPort: number; logPath: string; portalRoot: string; port: number }): Server {
  const log = createWriteStream(options.logPath, { flags: 'a' });
  const server = createHttpServer((request, response) => {
    log.write(`${new Date().toISOString()} ${request.method ?? 'GET'} ${request.url ?? '/'}\n`);
    if ((request.url ?? '').startsWith('/api/')) {
      const proxyRequest = httpRequest(
        {
          headers: request.headers,
          hostname: '127.0.0.1',
          method: request.method,
          path: request.url,
          port: options.apiPort,
        },
        (proxyResponse) => {
          response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
          proxyResponse.pipe(response);
        },
      );
      proxyRequest.on('error', (error) => {
        response.writeHead(502, { 'content-type': 'text/plain' });
        response.end(`API proxy error: ${error.message}`);
      });
      request.pipe(proxyRequest);
      return;
    }

    serveStaticFile(options.portalRoot, request.url ?? '/', response, true);
  });
  server.once('close', () => log.end());
  server.listen(options.port, '127.0.0.1');
  return server;
}

function serveStaticFile(root: string, requestUrl: string, response: import('node:http').ServerResponse, spa = false) {
  const pathname = new URL(requestUrl, 'http://localhost').pathname;
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const candidate = resolve(root, `.${normalize(requestedPath)}`);
  const safeCandidate = candidate.startsWith(`${root}/`) ? candidate : join(root, 'index.html');
  const filePath =
    existsSync(safeCandidate) && statSync(safeCandidate).isFile()
      ? safeCandidate
      : spa
        ? join(root, 'index.html')
        : join(root, '404.html');

  if (!existsSync(filePath)) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, { 'content-type': contentType(filePath), 'cache-control': 'no-store' });
  createReadStream(filePath).pipe(response);
}

function contentType(filePath: string): string {
  switch (extname(filePath)) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}

function resolvePortalRoot(workspaceRoot: string): string {
  const candidates = [resolve(workspaceRoot, 'dist/apps/portal/browser'), resolve(workspaceRoot, 'dist/apps/portal')];
  const portalRoot = candidates.find((candidate) => existsSync(join(candidate, 'index.html')));
  if (!portalRoot) throw new Error('Portal production build did not produce an index.html file.');
  return portalRoot;
}

async function waitForHttp(url: string, timeoutMs: number): Promise<void> {
  await pollUntilReady(url, timeoutMs, async () => {
    const response = await fetch(url);
    return response.ok;
  });
}

async function waitForHttps(url: string, timeoutMs: number): Promise<void> {
  await pollUntilReady(
    url,
    timeoutMs,
    () =>
      new Promise<boolean>((resolvePromise) => {
        const request = httpsGet(url, { rejectUnauthorized: false }, (response) => {
          response.resume();
          resolvePromise((response.statusCode ?? 500) < 400);
        });
        request.on('error', () => resolvePromise(false));
      }),
  );
}

async function pollUntilReady(url: string, timeoutMs: number, check: () => Promise<boolean>): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (await check()) return;
    } catch {
      // The dependency may refuse connections until its startup sequence finishes.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`Dependency was not ready within ${timeoutMs}ms: ${url}`);
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolvePromise) => server.close(() => resolvePromise()));
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolvePromise, rejectPromise) => {
        timeout = setTimeout(
          () => rejectPromise(new Error(`${label} exceeded its ${timeoutMs}ms timeout.`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function setEnvironment(original: Map<string, string | undefined>, name: string, value: string): void {
  if (!original.has(name)) original.set(name, process.env[name]);
  process.env[name] = value;
}

function restoreEnvironment(original: ReadonlyMap<string, string | undefined>): void {
  for (const [name, value] of original) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
