import type { PointerButtonType } from '@puppeteer/replay';
import type { AssertNever, EnumLiteral } from '../type-utils';
import { Schema } from 'effect';

const PUPPETEER_REPLAY_POINTER_BUTTON_TYPE = [
  'primary',
  'auxiliary',
  'secondary',
  'back',
  'forward',
] as const satisfies EnumLiteral<PointerButtonType>[];

export const PointerButtonTypeSchema = Schema.Literal(...PUPPETEER_REPLAY_POINTER_BUTTON_TYPE);

/**
 * Assert all puppeteer replay pointer button types are being used in the PointerButtonTypeSchema schema
 *
 * This is required as we can only use @puppeteer/replay as a type due to its dependencies
 * which would mean it cannot be used in browser bundles.
 */
type _AssertNoMissingPuppeteerReplayPointerButtonType = AssertNever<
  Exclude<PointerButtonType, (typeof PointerButtonTypeSchema.Type)[number]>
>;
