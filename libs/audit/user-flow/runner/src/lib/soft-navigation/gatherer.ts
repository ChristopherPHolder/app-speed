import type { UserFlow } from 'lighthouse';
import { Driver } from 'lighthouse/core/gather/driver.js';
import { Runner } from 'lighthouse/core/runner.js';
import { initializeConfig } from 'lighthouse/core/config/config.js';
import { getBaseArtifacts, finalizeArtifacts } from 'lighthouse/core/gather/base-artifacts.js';
import {
  getEmptyArtifactState,
  collectPhaseArtifacts,
  awaitArtifacts,
  type CollectPhaseArtifactOptions,
} from 'lighthouse/core/gather/runner-helpers.js';
import { enableAsyncStacks, prepareTargetForTimespanMode } from 'lighthouse/core/gather/driver/prepare.js';
import * as emulation from 'lighthouse/core/lib/emulation.js';

/**
 * Lighthouse's internal integration boundary. Collect an existing document's transition,
 * retaining navigation identity from collection through reporting. No document load is awaited.
 */
export async function startSoftNavigationGather(flow: UserFlow, flags: Parameters<UserFlow['startNavigation']>[0]) {
  const nextFlags = flow._getNextFlags({ ...flags, disableStorageReset: true });
  // Select audits/artifacts that can operate without a new document. Preserve caller exclusions.
  const { resolvedConfig } = await initializeConfig('timespan', flow._options?.config, nextFlags);
  resolvedConfig.audits = (resolvedConfig.audits ?? []).map((definition) => {
    const Original = definition.implementation;
    return {
      ...definition,
      implementation: class extends Original {
        static override get meta() {
          return { ...Original.meta, supportedModes: ['navigation' as const] };
        }
        static override audit(
          artifacts: Parameters<typeof Original.audit>[0],
          context: Parameters<typeof Original.audit>[1],
        ) {
          // Stock interval audits must not look for a document navigationStart or simulate a page load.
          return Original.audit({ ...artifacts, GatherContext: { gatherMode: 'timespan' } }, context);
        }
      },
    };
  });
  const driver = new Driver(flow._page);
  const computedCache = new Map();
  let disableAsyncStacks: (() => Promise<void>) | undefined;
  let stopInstrumentation: (() => Promise<void>) | undefined;
  let cleanupPromise: Promise<void> | undefined;
  const cleanup = () =>
    (cleanupPromise ??= (async () => {
      try {
        try {
          await stopInstrumentation?.();
        } finally {
          await disableAsyncStacks?.();
          await emulation.clearThrottling(driver.defaultSession);
        }
      } finally {
        await driver.disconnect();
      }
    })());
  try {
    await driver.connect();
    const baseArtifacts = await getBaseArtifacts(resolvedConfig, driver, { gatherMode: 'navigation' });
    const artifactState = getEmptyArtifactState();
    const phaseOptions: Omit<CollectPhaseArtifactOptions, 'phase'> = {
      driver,
      page: flow._page,
      artifactDefinitions: resolvedConfig.artifacts ?? [],
      artifactState,
      baseArtifacts,
      computedCache,
      // Trace needs the existing-document marker to identify the main frame without a page load.
      gatherMode: 'timespan',
      settings: resolvedConfig.settings,
    };
    await prepareTargetForTimespanMode(driver, resolvedConfig.settings);
    disableAsyncStacks = await enableAsyncStacks(driver.defaultSession);
    let stopPromise: Promise<void> | undefined;
    stopInstrumentation = () =>
      (stopPromise ??= (async () => {
        await collectPhaseArtifacts({ ...phaseOptions, phase: 'stopSensitiveInstrumentation' });
        await collectPhaseArtifacts({ ...phaseOptions, phase: 'stopInstrumentation' });
      })());
    await collectPhaseArtifacts({ ...phaseOptions, phase: 'startInstrumentation' });
    await collectPhaseArtifacts({ ...phaseOptions, phase: 'startSensitiveInstrumentation' });
    let ended = false;
    return {
      async end() {
        if (ended) throw new Error('Soft navigation collection already ended');
        ended = true;
        const runnerOptions = { resolvedConfig, computedCache };
        try {
          const artifacts = await Runner.gather(async () => {
            baseArtifacts.URL = { finalDisplayedUrl: await driver.url() };
            await stopInstrumentation?.();
            await disableAsyncStacks?.();
            disableAsyncStacks = undefined;
            await collectPhaseArtifacts({ ...phaseOptions, phase: 'getArtifact' });
            return finalizeArtifacts(baseArtifacts, await awaitArtifacts(artifactState));
          }, runnerOptions);
          flow._addGatherStep({ artifacts, runnerOptions }, nextFlags);
        } finally {
          await cleanup();
        }
      },
      async dispose() {
        if (!ended) {
          ended = true;
          await cleanup();
        }
      },
    };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
