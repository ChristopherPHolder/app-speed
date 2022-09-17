// Your custom interactions with the page
import {
  UserFlowContext,
  UserFlowInteractionsFn,
  UserFlowProvider,
} from '@push-based/user-flow';

import { ScrollAction } from '../actions.uf';

const interactions: UserFlowInteractionsFn = async (
  ctx: UserFlowContext
): Promise<any> => {
  const { flow, collectOptions, page } = ctx;
  const { url } = collectOptions;

  const scrollAction = new ScrollAction(page);

  await flow.navigate(url, { stepName: "Cold Initial Navigation" });

  await flow.navigate(url, { stepName: "Warm Initial Navigation" });

  await flow.startTimespan({ stepName: 'Scroll To Bottom Of Page' });
  await scrollAction.swipeToPageBottom();
  await flow.endTimespan();

  await flow.startTimespan({ stepName: 'Scroll To Top Of Page' });
  await scrollAction.swipeToPageTop();
  await flow.endTimespan();

};

const userFlowProvider: UserFlowProvider = {
  flowOptions: {
    name: "Deep Blue Performance Test",
    config: {
      extends: 'lighthouse:default',
      settings: {
        skipAudits: ['full-page-screenshot']
      }
    }
  },
  interactions,
  launchOptions: { headless: true }
};

module.exports = userFlowProvider;