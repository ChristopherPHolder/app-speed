import { join } from 'node:path';

// this is a quick fix, ether implement a proper solution of fix the issue with configs
export const getCliPath = (): string => {
  const cwd = process.cwd();
  const rootPath = cwd.includes('audit-runner-e2e') ? '../../' : '';
  return join(process.cwd(), rootPath, 'dist/apps/audit-runner');
};
