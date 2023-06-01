import { launch, Browser, Page } from 'puppeteer';
import { ResultReports } from 'shared';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { startFlow, UserFlow } from 'lighthouse/lighthouse-core/fraggle-rock/api';

export type AuditParams = {
  targetUrl: string
}

export class UserFlowRunner {
  private browser?: Browser;
  private page?: Page;
  private flow?: UserFlow;

  async run(auditDetails: AuditParams): Promise<ResultReports> {
    await this.initRunner();
    await this.initAuditor();
    await this.runActions(auditDetails);
    const results = await this.collectAuditResults();
    await this.killRunner();
    return results;
  }

  private async initRunner(): Promise<void> {
    this.browser = await launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox']});
    this.page = await this.browser.newPage();
  }

  private async initAuditor(): Promise<void> {
    this.flow = await startFlow(this.page);
  }

  private async runActions(auditDetails: AuditParams): Promise<void> {

    await this.flow.navigate(auditDetails.targetUrl, {
      stepName: 'Cold Initial Navigation'
    });

    await this.flow.navigate(auditDetails.targetUrl, {
      stepName: 'Warm Initial Navigation'
    });
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
