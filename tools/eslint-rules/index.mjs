import noHardcodedColors from './src/no-hardcoded-colors.mjs';

/** Workspace lint rules, registered as the `app-speed` plugin in the root ESLint config. */
export default {
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
  },
};
