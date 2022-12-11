import { launch, Browser, Page } from 'puppeteer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { startFlow, UserFlow } from 'lighthouse/lighthouse-core/fraggle-rock/api';
import { ResultReports } from 'shared';

type RunnerContext = {
  browser: Browser;
  page: Page;
  flow?: UserFlow
}

// TODO add runner options to audit params type
export async function runAudits(auditParams: any): Promise<ResultReports> {
  const { targetUrl, runnerOptions } = auditParams;
  const runnerContext = await initializeRunner(runnerOptions);
  await runnerContext.flow.navigate(targetUrl);
  await runnerContext.flow.navigate(targetUrl);
  const jsonReport = JSON.stringify(await runnerContext.flow.createFlowResult());
  const htmlReport = await runnerContext.flow.generateReport();
  await runnerContext.browser.close();
  return {jsonReport, htmlReport};
}

// TODO define runner options as type
async function initializeRunner(runnerOptions: any): Promise<RunnerContext> {
  const browser = await launch({headless: false});
  const page = await browser.newPage();
  let flow;
  if (runnerOptions.flow) {
    flow = await startFlow(page);
  }
  return {browser, page, flow};
}
