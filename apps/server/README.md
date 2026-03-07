# Server App

Control plane API for scheduling audits, reporting status, and orchestrating runner lifecycle.

## Run

```bash
pnpm exec nx serve server
```

## Runtime Configuration

The server resolves runtime config through Effect `Config` in:

- `src/runtime-config.ts`
- `src/Runner/AwsRunnerManager.ts`

Only these two runtime env vars are currently supported:

- `RUNNER_MANAGER_MODE` (optional): `local` or `aws` (default is hardcoded to `aws`)
- `DEVTOOLS_URL` (optional)

### Local Mode

- The server uses `LocalRunnerManager` and starts a local runner process using Nx.

### AWS Mode

AWS runner settings are hardcoded in `src/Runner/AwsRunnerManager.ts` for now:

- region: `eu-central-1`
- instance ids: `i-049287bf43503d01e`
- start wait timeout: `600000`
- stop wait timeout: `600000`

Behavior:

- `ensureRunnerActive` starts the first configured EC2 instance if none are `pending` or `running`.
- `listActiveRunners` returns active EC2-backed runners.
- `terminateRunner` stops a managed EC2 instance by id.

### DevTools

- `DEVTOOLS_URL` (optional): enables Effect DevTools layer when set.

## Examples

Local development:

```bash
RUNNER_MANAGER_MODE=local
```

AWS production:

```bash
RUNNER_MANAGER_MODE=aws
```
