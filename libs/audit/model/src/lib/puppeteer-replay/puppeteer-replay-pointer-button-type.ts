import { PointerButtonType } from '@puppeteer/replay';
import { EnumLiteral } from '../type-utils';
import { Schema } from 'effect';

const PUPPETEER_REPLAY_POINTER_BUTTON_TYPE = [
  'primary',
  'auxiliary',
  'secondary',
  'back',
  'forward',
] as const satisfies EnumLiteral<PointerButtonType>[];

export const PointerButtonTypeSchema = Schema.Literal(...PUPPETEER_REPLAY_POINTER_BUTTON_TYPE);

// TODO add type assertion to ensure all types are correct
