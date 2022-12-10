import puppeteer from 'puppeteer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { startFlow } from 'lighthouse/lighthouse-core/fraggle-rock/api';
import { ResultReports } from 'shared';

export async function runAudits(auditParams: any): Promise<ResultReports> {
  const { targetUrl } = auditParams;
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage()
  const flow = await startFlow(page);
  await flow.navigate(targetUrl);
  await flow.navigate(targetUrl);
  const jsonReport = JSON.stringify(await flow.createFlowResult());
  const htmlReport = await flow.generateReport();
  await browser.close();
  return {jsonReport, htmlReport};
}
