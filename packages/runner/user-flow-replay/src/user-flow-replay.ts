import { createRunner, Runner, UserFlow as PRUserFlow } from '@puppeteer/replay';
import { UserFlowRunnerExtension } from './runner-extension';
import { parse } from './parse';
import { Browser, launch, Page } from 'puppeteer';
import { startFlow, UserFlow as LHUserFlow } from 'lighthouse';
import { ResultReports } from '@app-speed/shared';
import { AppSpeedUserFlow } from '@app-speed/shared';

export type UserFlowRunnerContext = {
  browser: Browser;
  page: Page;
  flow: LHUserFlow;
};

export class UserFlowAudit {
  private readonly replayScript: AppSpeedUserFlow;

  constructor(appSpeedUserFlow: object | AppSpeedUserFlow) {
    console.log('Init UserFlowAudit with', appSpeedUserFlow);
    this.replayScript = parse(appSpeedUserFlow);
    console.log('Successfully parsed Replay script');
  }

  public async results(): Promise<ResultReports> {
    return await this.run();
  }
  public async run() {
    const runnerContext = await this.initializeRunnerContext();
    const replayRunner = await this.createRunner(runnerContext);
    await this.executeRunner(replayRunner);
    const results = await this.extractResults(runnerContext);
    await this.terminateRunnerContext(runnerContext);
    return results;
  }

  private async initializeRunnerContext(): Promise<UserFlowRunnerContext> {
    const browser = await launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    const flow = await startFlow(page, { name: this.replayScript.title });
    return { browser, page, flow };
  }

  private async createRunner(runnerContext: UserFlowRunnerContext): Promise<Runner> {
    const { browser, page, flow } = runnerContext;
    const runnerExtension = new UserFlowRunnerExtension(browser, page, flow);
    return await createRunner(this.replayScript as PRUserFlow, runnerExtension);
  }

  private async executeRunner(replayRunner: Runner): Promise<void> {
    await replayRunner.run();
  }

  private async extractResults(runnerContext: UserFlowRunnerContext): Promise<ResultReports> {
    const jsonReport = JSON.stringify(await runnerContext.flow.createFlowResult());
    const htmlReport = await runnerContext.flow.generateReport();
    return { jsonReport, htmlReport };
  }

  private async terminateRunnerContext(runnerContext: UserFlowRunnerContext): Promise<void> {
    await runnerContext.browser.close();
  }
}
