import { rule as noHardcodedColors, RULE_NAME as noHardcodedColorsName } from './rules/no-hardcoded-colors';

/**
 * Workspace lint rules. Nx loads this file and exposes each rule as `@nx/workspace-<name>`.
 */
export const rules = {
  [noHardcodedColorsName]: noHardcodedColors,
};
