import { launch, Browser, Page } from 'puppeteer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { startFlow, UserFlow } from 'lighthouse/lighthouse-core/fraggle-rock/api';
import { environment } from '../environments/environment';
import { ResultReports } from 'shared';

type AuditParams = {
  targetUrl: string
}

export class UfoRunner {
  private browser?: Browser;
  private page?: Page;
  private flow?: UserFlow;

  constructor(private readonly auditDetails: AuditParams) {}

  async run(): Promise<ResultReports> {
    await this.initRunner();
    await this.initAuditor();
    await this.runActions();
    const results = await this.collectAuditResults();
    await this.killRunner();
    return results;
  }

  private async initRunner(): Promise<void> {
    this.browser = await launch({headless: environment.production});
    this.page = await this.browser.newPage();
  }

  private async initAuditor(): Promise<void> {
    this.flow = await startFlow(this.page);
  }

  private async runActions(): Promise<void> {
    await this.flow.navigate(this.auditDetails.targetUrl);
    await this.flow.navigate(this.auditDetails.targetUrl);
  }

  private async collectAuditResults(): Promise<ResultReports> {
    const jsonReport = JSON.stringify(await this.flow.createFlowResult());
    const htmlReport = await this.flow.generateReport();
    return {jsonReport, htmlReport};
  }

  private async killRunner(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
    }
  }
}

