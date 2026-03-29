# Angular Secondary Entry Point Convention

Use this document as the standard reference before creating or renaming a publishable Angular secondary entry point.

This workspace uses `@nx/angular:ng-packagr-lite` for publishable Angular libraries.

Secondary entry points must follow one canonical naming rule:

`<root package.json name>/<secondary folder name>`

## Canonical Example

For `libs/audit/builder/ui`:

- root package name in `libs/audit/builder/ui/package.json`:
  - `@app-speed/audit-builder-ui`
- secondary entry point folder:
  - `icons`
- required TypeScript path aliases:
  - `@app-speed/audit-builder-ui`
  - `@app-speed/audit-builder-ui/icons`
- required consumer import:
  - `@app-speed/audit-builder-ui/icons`

Do not mix naming schemes.

Invalid examples:

- `@app-speed/audit-builder-ui-icons`
- `@app-speed/audit/builder-ui/icons`
- `@app-speed/audit/builder/ui/icons`

Those names do not match the way Nx derives and remaps secondary entry points for buildable Angular packages.

## Why This Matters

Nx derives the secondary entry point from the root package name plus the secondary folder name.

That means:

- the library `package.json` name is the source of truth
- the root `tsconfig.base.json` alias must match that exact package name
- the secondary alias must be `<root package>/<secondary>`
- consumer imports must use that same value

If those names diverge, incremental/buildable-library remapping can break.

## Required Change Checklist

When creating or renaming a publishable Angular library with a secondary entry point:

1. Update the root library `package.json` `name`.
2. Update the root alias in `tsconfig.base.json`.
3. Update the secondary alias in `tsconfig.base.json`.
4. Update every import to use the canonical root or secondary import path.
5. Update consuming library `peerDependencies` to reference the root package name.

Important:

- Consumers should depend on the root package, not on a made-up sibling package for the secondary entry point.
- The secondary entry point does not need its own source `package.json`.
- ng-packagr generates the secondary entry point package metadata in `dist/`.

## Nx Incremental Build Caveat

After renaming a publishable Angular package or its secondary entry point aliases, Nx can keep stale daemon/project-graph state and continue resolving the dependency to source instead of `dist`.

Observed symptom:

- producer library builds successfully
- consumer library still resolves the secondary entry point from source
- Angular partial compilation crashes with an internal TypeScript error such as:
  - `Cannot destructure property 'pos' of 'file.referencedFiles[index]' as it is undefined.`

## Recovery

After any package-name or secondary-entry-point rename, always run:

```bash
pnpm exec nx reset
```

If a build still looks wrong, force a clean daemon-free run:

```bash
NX_DAEMON=false pnpm exec nx build <project> --skipNxCache
```

This is the quickest way to tell whether the issue is stale Nx incremental state or a real source/configuration error.

## Current Working Pattern

For the audit builder UI package, the correct imports are:

```ts
import { provideAuditBuilderIcons } from '@app-speed/audit-builder-ui/icons';
```

The correct aliases are:

```json
{
  "@app-speed/audit-builder-ui": ["libs/audit/builder/ui/src/index.ts"],
  "@app-speed/audit-builder-ui/icons": ["libs/audit/builder/ui/icons/src/index.ts"]
}
```
