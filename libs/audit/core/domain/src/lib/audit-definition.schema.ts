import { Schema } from 'effect';

import { DeviceSchema } from './shared/device-type';

const NonNegativeIntFromStringSchema = Schema.NumberFromString.pipe(Schema.int(), Schema.nonNegative()).annotations({
  identifier: 'NonNegativeIntFromString',
});

export const AuditTimeoutSchema = Schema.optional(
  Schema.Union(Schema.NonNegativeInt, NonNegativeIntFromStringSchema).annotations({
    identifier: 'Timeout',
  }),
);

export const AuditDefinitionBaseSchema = Schema.Struct({
  title: Schema.NonEmptyString,
  device: DeviceSchema,
  timeout: AuditTimeoutSchema,
});

export type AuditDefinitionBase = typeof AuditDefinitionBaseSchema.Type;
