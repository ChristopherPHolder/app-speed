import { launch, Browser, Page } from 'puppeteer';
import { ResultReports } from 'shared';
import { ScrollAction } from './actions';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { startFlow, UserFlow } from 'lighthouse/lighthouse-core/fraggle-rock/api';

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
    this.browser = await launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
    });
    this.page = await this.browser.newPage();
  }

  private async initAuditor(): Promise<void> {
    this.flow = await startFlow(this.page);
  }

  private async runActions(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const scrollAction = new ScrollAction(this.page!);

    await this.flow.navigate(this.auditDetails.targetUrl, {
      stepName: 'Cold Initial Navigation'
    });

    await this.flow.navigate(this.auditDetails.targetUrl, {
      stepName: 'Warm Initial Navigation'
    });

    await this.flow.startTimespan({ stepName: 'Scroll To Bottom Of Page' });
    await scrollAction.swipeToPageBottom();
    await this.flow.endTimespan();

    await this.flow.snapshot();

    await this.flow.startTimespan({ stepName: 'Scroll To Top Of Page' });
    await scrollAction.swipeToPageTop();
    await this.flow.endTimespan();
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

