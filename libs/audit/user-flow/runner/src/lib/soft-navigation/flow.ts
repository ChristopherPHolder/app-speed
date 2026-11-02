import { setTimeout as delay } from 'node:timers/promises';
import type { Frame, Page } from 'puppeteer';
import type { UserFlow } from 'lighthouse';
import { ProcessedTrace } from 'lighthouse/core/computed/processed-trace.js';
import type { UserFlowResult, PuppeteerReplayUserflowRunnerSchema } from '@app-speed/audit/user-flow/domain';
import { softNavigationTimings, TIMESPAN_SOFT_NAVIGATION_WARNING, MULTIPLE_SOFT_NAVIGATION_WARNING } from './metrics';

type Flags = Parameters<UserFlow['startNavigation']>[0];
type Mode = 'navigation' | 'soft-navigation' | 'timespan' | 'snapshot';
type NavigationPlan = readonly ('navigation' | 'soft-navigation')[];
const paintIds = ['first-contentful-paint', 'largest-contentful-paint'];

export function navigationPlan(recording: typeof PuppeteerReplayUserflowRunnerSchema.Type): NavigationPlan {
  return recording.steps.flatMap<'navigation' | 'soft-navigation'>((step, index) => {
    if (step.type !== 'customStep' || step.name !== 'startNavigation') return [];
    const end = recording.steps.findIndex(
      (candidate, i) => i > index && candidate.type === 'customStep' && candidate.name === 'endNavigation',
    );
    return [
      recording.steps.slice(index + 1, end < 0 ? undefined : end).some((candidate) => candidate.type === 'navigate')
        ? 'navigation'
        : 'soft-navigation',
    ];
  });
}

/** Local experiment boundary: stock Lighthouse gathers interaction traces; local audits measure soft paints. */
export class ExperimentalUserFlow {
  private readonly modes: Mode[] = [];
  private readonly controller = new AbortController();
  private nextNavigation = 0;
  private current?: Mode;
  private navigated?: Promise<void>;
  private onNavigated?: (frame: Frame) => void;

  constructor(
    private readonly page: Page,
    private readonly flow: UserFlow,
    private readonly plan: NavigationPlan = [],
    private readonly timeout = 30_000,
    private readonly idleTime = 1000,
  ) {}

  async navigate(requestor: string | (() => Promise<void>), flags?: Flags): Promise<void> {
    if (typeof requestor === 'string') {
      await this.flow.navigate(requestor, flags);
      this.modes.push('navigation');
      return;
    }
    await this.startNavigation(flags);
    await requestor();
    await this.endNavigation();
  }

  async startNavigation(flags?: Flags): Promise<void> {
    const mode = this.plan[this.nextNavigation++] ?? 'soft-navigation';
    if (mode === 'navigation') {
      await this.flow.startNavigation(flags);
      this.current = mode;
      return;
    }
    this.navigated = new Promise<void>((resolve) => {
      this.onNavigated = (frame) => {
        if (frame === this.page.mainFrame()) resolve();
      };
      this.page.on('framenavigated', this.onNavigated);
    });
    try {
      await this.flow.startTimespan({ ...flags, disableStorageReset: true });
      this.current = mode;
    } catch (error) {
      this.removeListener();
      throw error;
    }
  }

  async endNavigation(): Promise<void> {
    if (this.current === 'navigation') {
      await this.flow.endNavigation();
      this.modes.push('navigation');
      this.current = undefined;
      return;
    }
    if (this.current !== 'soft-navigation') throw new Error('No navigation in progress');
    try {
      // The quiet window must start after navigation; idle time before the triggering action does not count.
      const waitController = new AbortController();
      try {
        await Promise.race([
          this.navigated,
          delay(this.timeout, undefined, {
            signal: AbortSignal.any([this.controller.signal, waitController.signal]),
          }),
        ]);
      } finally {
        waitController.abort();
      }
      await this.page.waitForNetworkIdle({
        idleTime: Math.min(this.idleTime, Math.max(1, Math.floor(this.timeout / 2))),
        timeout: this.timeout,
        signal: this.controller.signal,
      });
      await this.flow.endTimespan();
      this.modes.push('soft-navigation');
      this.current = undefined;
    } finally {
      this.removeListener();
    }
  }

  async startTimespan(flags?: Flags): Promise<void> {
    await this.flow.startTimespan({ ...flags, skipAudits: [...(flags?.skipAudits ?? []), ...paintIds] });
    this.current = 'timespan';
  }
  async endTimespan(): Promise<void> {
    await this.flow.endTimespan();
    this.modes.push('timespan');
    this.current = undefined;
  }
  async snapshot(flags?: Flags): Promise<void> {
    await this.flow.snapshot(flags);
    this.modes.push('snapshot');
  }
  createArtifactsJson() {
    return this.flow.createArtifactsJson();
  }
  async createFlowResult(): Promise<UserFlowResult> {
    const result = await this.flow.createFlowResult();
    const artifacts = this.flow.createArtifactsJson().gatherSteps;
    const steps = await Promise.all(
      result.steps.map(async (step, index): Promise<UserFlowResult['steps'][number]> => {
        const mode = this.modes[index];
        if (mode !== 'timespan' && mode !== 'soft-navigation') return step;
        const trace = artifacts[index].artifacts.Trace;
        const warnings = [...step.lhr.runWarnings];
        if (trace && Array.isArray(trace.traceEvents)) {
          const processed = await ProcessedTrace.request(trace, { computedCache: new Map() });
          const { count } = softNavigationTimings(trace.traceEvents, processed.mainFrameInfo.frameId);
          if (mode === 'timespan' && count) warnings.push(TIMESPAN_SOFT_NAVIGATION_WARNING);
          if (mode === 'soft-navigation' && count > 1) warnings.push(MULTIPLE_SOFT_NAVIGATION_WARNING);
        }
        if (mode === 'timespan') return { ...step, lhr: { ...step.lhr, runWarnings: warnings } };
        return { ...step, softNavigation: true, lhr: { ...step.lhr, gatherMode: 'navigation', runWarnings: warnings } };
      }),
    );
    return { ...result, steps };
  }
  dispose(): void {
    this.controller.abort();
    this.removeListener();
    this.flow.dispose();
  }
  private removeListener(): void {
    if (this.onNavigated) this.page.off('framenavigated', this.onNavigated);
    this.onNavigated = undefined;
  }
}
