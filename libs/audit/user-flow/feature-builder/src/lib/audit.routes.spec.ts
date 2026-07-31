import { describe, expect, it } from 'vitest';

import { auditBuilderRoutes } from './audit.routes';
import { BuilderComponent } from './feature/builder.component';

describe('auditBuilderRoutes', () => {
  it('uses the canonical builder and result paths', () => {
    expect(auditBuilderRoutes.map((route) => route.path)).toEqual([':id', '']);
    expect(auditBuilderRoutes.at(-1)?.component).toBe(BuilderComponent);
  });

  it('loads results through the user-flow viewer feature', async () => {
    const resultRoute = auditBuilderRoutes.find((route) => route.path === ':id');
    const childRoutes = await resultRoute?.loadChildren?.();

    expect(Array.isArray(childRoutes)).toBe(true);
    expect(childRoutes).toHaveLength(1);
  });
});
