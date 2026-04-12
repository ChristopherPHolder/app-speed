import type { AssertedEventType } from '@puppeteer/replay';
import type { AssertNever, EnumLiteral, MapEnumLiteral } from '../type-utils';
import { Schema } from 'effect';

export const PUPPETEER_REPLAY_ASSERTED_EVENT_TYPE = {
  NAVIGATION: 'navigation',
} as const satisfies MapEnumLiteral<AssertedEventType>;

export const PuppeteerReplayAssociatedEventTypeSchema = Schema.Literal(PUPPETEER_REPLAY_ASSERTED_EVENT_TYPE.NAVIGATION);

/**
 * Assert all puppeteer replay asserted event types are used in PuppeteerReplayAssociatedEventTypeSchema
 *
 * This is required as we can only use @puppeteer/replay as a type due to its dependencies
 * which would mean it cannot be used in browser bundles.
 */
type _AssertNoMissingPuppeteerReplayKeys = AssertNever<
  Exclude<EnumLiteral<AssertedEventType>, (typeof PuppeteerReplayAssociatedEventTypeSchema.literals)[number]>
>;
