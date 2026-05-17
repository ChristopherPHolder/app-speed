import { Schema } from 'effect';

export type BuilderStepVariantDefinition = {
  id: string;
  schema: Schema.Schema.AnyNoContext;
  defaultValue: Record<string, unknown>;
};
