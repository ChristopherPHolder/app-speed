import { Schema } from 'effect';

import { DeviceSchema } from './shared/device-type';

const NonNegativeIntSchema = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0));
const NonNegativeIntFromStringSchema = Schema.NumberFromString.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(0),
).annotate({ identifier: 'NonNegativeIntFromString' });

export const AuditTimeoutSchema = Schema.optional(
  Schema.Union([NonNegativeIntSchema, NonNegativeIntFromStringSchema]).annotate({
    identifier: 'Timeout',
  }),
);

export const AuditDefinitionBaseSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  device: DeviceSchema,
  timeout: AuditTimeoutSchema,
});

export type AuditDefinitionBase = typeof AuditDefinitionBaseSchema.Type;
