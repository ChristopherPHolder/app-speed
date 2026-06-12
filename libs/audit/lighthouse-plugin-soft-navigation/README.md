# Lighthouse Soft Navigation Plugin

`@app-speed/lighthouse-plugin-soft-navigation` adds soft-navigation FCP and LCP audits to Lighthouse timespan
reports.

## Installation

```sh
npm install @app-speed/lighthouse-plugin-soft-navigation lighthouse
```

Configure Lighthouse with the scoped package name:

```ts
const config = {
  extends: 'lighthouse:default',
  plugins: ['@app-speed/lighthouse-plugin-soft-navigation'],
};
```

The plugin supports timespan mode only. It uses the stable Chrome 149+ soft-navigation trace model, so the measured
interaction must update history and mutate the DOM in a Chrome version that emits soft-navigation events.

## Development

```sh
pnpm exec nx build lighthouse-plugin-soft-navigation
pnpm exec nx test lighthouse-plugin-soft-navigation
pnpm exec nx lint lighthouse-plugin-soft-navigation
pnpm exec nx e2e lighthouse-plugin-soft-navigation
```

The current implementation intentionally treats multiple soft navigations in one timespan as ambiguous and returns
no metric rather than selecting one arbitrarily.

## Attribution

Migrated from Adam Raine's
[lighthouse-plugin-soft-navigation](https://github.com/ChristopherPHolder/lighthouse-plugin-soft-navigation) at
[commit 03634d5](https://github.com/ChristopherPHolder/lighthouse-plugin-soft-navigation/commit/03634d5).
