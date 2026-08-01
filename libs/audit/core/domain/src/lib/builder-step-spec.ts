import { type JsonSchema, Schema } from 'effect';
import { AuditCustomBuilderStepVariants } from './custom-audit-step';
import { PuppeteerReplayBuilderStepVariants } from './puppeteer-replay/puppeteer-replay-step';

type BuilderScalarValue = string | number | boolean | null;
export type BuilderStepVariantDefinition = {
  id: string;
  schema: Schema.Top;
  defaultValue: Record<string, unknown>;
};
export type BuilderFieldValidationSpec = {
  integer?: boolean;
  maximum?: number;
  minItems?: number;
  minLength?: number;
  minimum?: number;
  pattern?: string;
};

type BuilderBaseFieldSpec = {
  path: string;
  required: boolean;
  defaultValue?: unknown;
  validation?: BuilderFieldValidationSpec;
};

export type BuilderFieldSpec =
  | (BuilderBaseFieldSpec & { kind: 'string' | 'number' | 'boolean' })
  | (BuilderBaseFieldSpec & { kind: 'literal'; value: BuilderScalarValue })
  | (BuilderBaseFieldSpec & { kind: 'enum'; options: readonly BuilderScalarValue[] })
  | (BuilderBaseFieldSpec & { kind: 'group'; fields: BuilderFieldSpec[] })
  | (BuilderBaseFieldSpec & { kind: 'array'; element: BuilderFieldSpec })
  | (BuilderBaseFieldSpec & { kind: 'record'; value: BuilderFieldSpec });

export type BuilderStepSpec = {
  id: string;
  defaultValue: Record<string, unknown>;
  discriminators: Record<string, BuilderScalarValue>;
  fields: BuilderFieldSpec[];
};

export const CORE_AUDIT_BUILDER_STEP_VARIANTS: readonly BuilderStepVariantDefinition[] = [
  ...PuppeteerReplayBuilderStepVariants,
  ...AuditCustomBuilderStepVariants,
];

export const deriveBuilderStepSpec = (variant: BuilderStepVariantDefinition): BuilderStepSpec => {
  const document = Schema.toJsonSchemaDocument(Schema.toType(variant.schema));
  const root = resolveReference(document.schema, document.definitions);

  if (root['type'] !== 'object' || !isJsonSchemaRecord(root['properties'])) {
    throw new Error(`Builder variants must be structs. Received ${describeJsonSchema(root)} for ${variant.id}`);
  }

  const requiredProperties = new Set(
    Array.isArray(root['required']) ? root['required'].filter((key): key is string => typeof key === 'string') : [],
  );
  const discriminators: Record<string, BuilderScalarValue> = {};
  const fields: BuilderFieldSpec[] = [];

  for (const [name, property] of Object.entries(root['properties'])) {
    const schema = normalizeOptionalSchema(resolveReference(property, document.definitions), document.definitions);
    const literal = getSingleLiteral(schema);

    if ((name === 'type' || name === 'step') && literal !== undefined) {
      discriminators[name] = literal;
      continue;
    }

    fields.push(
      deriveFieldSpec({
        schema,
        definitions: document.definitions,
        defaultValue: variant.defaultValue[name],
        path: name,
        required: requiredProperties.has(name),
      }),
    );
  }

  return {
    id: variant.id,
    defaultValue: variant.defaultValue,
    discriminators,
    fields,
  };
};

const deriveFieldSpec = ({
  schema,
  definitions,
  defaultValue,
  path,
  required,
}: {
  schema: JsonSchema.JsonSchema;
  definitions: JsonSchema.Definitions;
  defaultValue: unknown;
  path: string;
  required: boolean;
}): BuilderFieldSpec => {
  const resolved = normalizeOptionalSchema(resolveReference(schema, definitions), definitions);
  const validation = deriveValidationSpec(resolved, definitions);
  const enumValues = getLiteralValues(resolved);

  if (enumValues?.length === 1) {
    return { kind: 'literal', path, required, defaultValue, validation, value: enumValues[0] };
  }

  if (enumValues && enumValues.length > 1) {
    return { kind: 'enum', path, required, defaultValue, validation, options: enumValues };
  }

  switch (resolved['type']) {
    case 'string':
      return { kind: 'string', path, required, defaultValue, validation };
    case 'number':
    case 'integer':
      return { kind: 'number', path, required, defaultValue, validation };
    case 'boolean':
      return { kind: 'boolean', path, required, defaultValue, validation };
    case 'array': {
      if (!isJsonSchema(resolved['items'])) {
        throw new Error(`Unsupported builder array at ${path}`);
      }

      return {
        kind: 'array',
        path,
        required,
        defaultValue,
        validation,
        element: deriveFieldSpec({
          schema: resolved['items'],
          definitions,
          defaultValue: undefined,
          path: `${path}[]`,
          required: true,
        }),
      };
    }
    case 'object':
      return deriveObjectFieldSpec({ resolved, definitions, defaultValue, path, required, validation });
  }

  const alternatives = getAlternatives(resolved, definitions);
  if (alternatives.length > 0 && alternatives.every((alternative) => alternative['type'] === 'string')) {
    return { kind: 'string', path, required, defaultValue, validation };
  }
  if (
    alternatives.length > 0 &&
    alternatives.every(
      (alternative) =>
        alternative['type'] === 'number' ||
        alternative['type'] === 'integer' ||
        isJsonEncodedSpecialNumberAlternative(alternative),
    ) &&
    alternatives.some((alternative) => alternative['type'] === 'number' || alternative['type'] === 'integer')
  ) {
    return { kind: 'number', path, required, defaultValue, validation };
  }
  if (alternatives.length > 0 && alternatives.every((alternative) => alternative['type'] === 'boolean')) {
    return { kind: 'boolean', path, required, defaultValue, validation };
  }

  if (alternatives.length > 0) {
    throw new Error(`Unsupported builder union at ${path}`);
  }

  throw new Error(`Unsupported builder field at ${path}: ${describeJsonSchema(resolved)}`);
};

const deriveObjectFieldSpec = ({
  resolved,
  definitions,
  defaultValue,
  path,
  required,
  validation,
}: {
  resolved: JsonSchema.JsonSchema;
  definitions: JsonSchema.Definitions;
  defaultValue: unknown;
  path: string;
  required: boolean;
  validation: BuilderFieldValidationSpec | undefined;
}): BuilderFieldSpec => {
  if (isJsonSchema(resolved['additionalProperties'])) {
    return {
      kind: 'record',
      path,
      required,
      defaultValue,
      validation,
      value: deriveFieldSpec({
        schema: resolved['additionalProperties'],
        definitions,
        defaultValue: undefined,
        path: `${path}.*`,
        required: true,
      }),
    };
  }

  if (!isJsonSchemaRecord(resolved['properties'])) {
    throw new Error(`Unsupported builder object at ${path}`);
  }

  const requiredProperties = new Set(
    Array.isArray(resolved['required'])
      ? resolved['required'].filter((key): key is string => typeof key === 'string')
      : [],
  );

  return {
    kind: 'group',
    path,
    required,
    defaultValue,
    validation,
    fields: Object.entries(resolved['properties']).map(([name, property]) =>
      deriveFieldSpec({
        schema: property,
        definitions,
        defaultValue: isRecord(defaultValue) ? defaultValue[name] : undefined,
        path: `${path}.${name}`,
        required: requiredProperties.has(name),
      }),
    ),
  };
};

const normalizeOptionalSchema = (
  schema: JsonSchema.JsonSchema,
  definitions: JsonSchema.Definitions,
): JsonSchema.JsonSchema => {
  const alternatives = getAlternatives(schema, definitions).filter((alternative) => alternative['type'] !== 'null');
  return alternatives.length === 1 ? alternatives[0] : schema;
};

const getAlternatives = (
  schema: JsonSchema.JsonSchema,
  definitions: JsonSchema.Definitions,
): JsonSchema.JsonSchema[] => {
  const alternatives = schema['anyOf'] ?? schema['oneOf'];
  if (!Array.isArray(alternatives)) {
    return [];
  }
  return alternatives.filter(isJsonSchema).map((alternative) => resolveReference(alternative, definitions));
};

const getSingleLiteral = (schema: JsonSchema.JsonSchema): BuilderScalarValue | undefined => {
  const literals = getLiteralValues(schema);
  return literals?.length === 1 ? literals[0] : undefined;
};

const getLiteralValues = (schema: JsonSchema.JsonSchema): BuilderScalarValue[] | undefined => {
  if (!Array.isArray(schema['enum'])) {
    return undefined;
  }

  const literals = schema['enum'].filter(isBuilderScalarValue);
  return literals.length === schema['enum'].length ? literals : undefined;
};

const deriveValidationSpec = (
  schema: JsonSchema.JsonSchema,
  definitions: JsonSchema.Definitions,
): BuilderFieldValidationSpec | undefined => {
  const validation: BuilderFieldValidationSpec = {};

  collectValidation(schema, definitions, validation);
  return Object.keys(validation).length > 0 ? validation : undefined;
};

const collectValidation = (
  schema: JsonSchema.JsonSchema,
  definitions: JsonSchema.Definitions,
  validation: BuilderFieldValidationSpec,
): void => {
  const resolved = resolveReference(schema, definitions);

  if (resolved['type'] === 'integer') validation.integer = true;
  if (typeof resolved['maximum'] === 'number') validation.maximum = resolved['maximum'];
  if (typeof resolved['minItems'] === 'number') validation.minItems = resolved['minItems'];
  if (typeof resolved['minLength'] === 'number') validation.minLength = resolved['minLength'];
  if (typeof resolved['minimum'] === 'number') validation.minimum = resolved['minimum'];
  if (typeof resolved['pattern'] === 'string') validation.pattern = resolved['pattern'];

  if (Array.isArray(resolved['allOf'])) {
    for (const member of resolved['allOf'].filter(isJsonSchema)) {
      collectValidation(member, definitions, validation);
    }
  }
};

const resolveReference = (
  schema: JsonSchema.JsonSchema,
  definitions: JsonSchema.Definitions,
): JsonSchema.JsonSchema => {
  const reference = schema['$ref'];
  if (typeof reference !== 'string' || !reference.startsWith('#/$defs/')) {
    return schema;
  }

  const definition = definitions[reference.slice('#/$defs/'.length)];
  if (!definition) {
    throw new Error(`Missing JSON Schema definition for ${reference}`);
  }
  return definition;
};

const describeJsonSchema = (schema: JsonSchema.JsonSchema): string =>
  typeof schema['type'] === 'string' ? schema['type'] : 'unknown schema';

const isBuilderScalarValue = (value: unknown): value is BuilderScalarValue =>
  value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

const isJsonEncodedSpecialNumberAlternative = (schema: JsonSchema.JsonSchema): boolean =>
  schema['type'] === 'string' &&
  Array.isArray(schema['enum']) &&
  schema['enum'].every((value) => value === 'Infinity' || value === '-Infinity' || value === 'NaN');

const isJsonSchema = (value: unknown): value is JsonSchema.JsonSchema => isRecord(value);

const isJsonSchemaRecord = (value: unknown): value is Record<string, JsonSchema.JsonSchema> =>
  isRecord(value) && Object.values(value).every(isJsonSchema);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
