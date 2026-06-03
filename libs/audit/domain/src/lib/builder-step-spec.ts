import { AuditCustomBuilderStepVariants } from './custom-audit-step';
import { UserflowBuilderStepVariants } from './lighthouse-userflow/lighthouse-userflow-step';
import { PuppeteerReplayBuilderStepVariants } from './puppeteer-replay/puppeteer-replay-step';

type BuilderScalarValue = string | number | boolean | null;
export type BuilderStepVariantDefinition = {
  id: string;
  schema: import('effect').Schema.Schema.AnyNoContext;
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

export const AUDIT_BUILDER_STEP_VARIANTS: readonly BuilderStepVariantDefinition[] = [
  ...PuppeteerReplayBuilderStepVariants,
  ...UserflowBuilderStepVariants,
  ...AuditCustomBuilderStepVariants,
];

export const deriveBuilderStepSpec = (variant: BuilderStepVariantDefinition): BuilderStepSpec => {
  const ast = variant.schema.ast as unknown as TypeLiteralAst;

  if (ast._tag !== 'TypeLiteral') {
    throw new Error(`Builder variants must be structs. Received ${ast._tag} for ${variant.id}`);
  }

  const discriminators: Record<string, BuilderScalarValue> = {};
  const fields: BuilderFieldSpec[] = [];

  for (const property of ast.propertySignatures) {
    const propertyType = unwrapOptionalType(property.type);

    if (isRootDiscriminator(property.name, propertyType)) {
      discriminators[property.name] = propertyType.literal;
      continue;
    }

    fields.push(
      deriveFieldSpec({
        ast: propertyType,
        defaultValue: variant.defaultValue[property.name],
        path: property.name,
        required: !property.isOptional,
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

type AstNode = {
  _tag: string;
  annotations?: Record<PropertyKey, unknown>;
  literal?: unknown;
  types?: AstNode[];
  from?: AstNode;
  to?: AstNode;
  type?: AstNode;
  elements?: Array<AstNode | { _tag?: string; type: AstNode }>;
  rest?: Array<{ type: AstNode }>;
};

type TypeLiteralAst = AstNode & {
  propertySignatures: PropertySignatureAst[];
  indexSignatures: IndexSignatureAst[];
};

type PropertySignatureAst = {
  name: string;
  isOptional: boolean;
  type: AstNode;
};

type IndexSignatureAst = {
  type: AstNode;
};

const deriveFieldSpec = ({
  ast,
  defaultValue,
  path,
  required,
}: {
  ast: AstNode;
  defaultValue: unknown;
  path: string;
  required: boolean;
}): BuilderFieldSpec => {
  const validation = deriveValidationSpec(ast);
  const normalizedAst = normalizeTerminalAst(ast);

  switch (normalizedAst._tag) {
    case 'StringKeyword':
      return { kind: 'string', path, required, defaultValue, validation };
    case 'NumberKeyword':
      return { kind: 'number', path, required, defaultValue, validation };
    case 'BooleanKeyword':
      return { kind: 'boolean', path, required, defaultValue, validation };
    case 'Literal':
      return {
        kind: 'literal',
        path,
        required,
        defaultValue,
        validation,
        value: normalizedAst.literal as BuilderScalarValue,
      };
    case 'Union':
      return deriveUnionFieldSpec({
        ast: normalizedAst as AstNode & { types: AstNode[] },
        defaultValue,
        path,
        required,
      });
    case 'TupleType':
      return deriveArrayFieldSpec({ ast: normalizedAst, defaultValue, path, required });
    case 'TypeLiteral':
      return deriveTypeLiteralFieldSpec({
        ast: normalizedAst as TypeLiteralAst,
        defaultValue,
        path,
        required,
      });
    default:
      throw new Error(`Unsupported builder field at ${path}: ${normalizedAst._tag}`);
  }
};

const deriveUnionFieldSpec = ({
  ast,
  defaultValue,
  path,
  required,
}: {
  ast: AstNode & { types: AstNode[] };
  defaultValue: unknown;
  path: string;
  required: boolean;
}): BuilderFieldSpec => {
  const literalOptions = ast.types.map((type) => normalizeTerminalAst(type));
  const validation = deriveValidationSpec(ast);

  if (literalOptions.every((type) => type._tag === 'Literal')) {
    return {
      kind: 'enum',
      path,
      required,
      defaultValue,
      validation,
      options: literalOptions.map((type) => type.literal as BuilderScalarValue),
    };
  }

  if (literalOptions.every((type) => type._tag === 'StringKeyword')) {
    return { kind: 'string', path, required, defaultValue, validation };
  }

  if (literalOptions.every((type) => type._tag === 'NumberKeyword')) {
    return { kind: 'number', path, required, defaultValue, validation };
  }

  if (literalOptions.every((type) => type._tag === 'BooleanKeyword')) {
    return { kind: 'boolean', path, required, defaultValue, validation };
  }

  throw new Error(`Unsupported builder union at ${path}`);
};

const deriveArrayFieldSpec = ({
  ast,
  defaultValue,
  path,
  required,
}: {
  ast: AstNode & {
    rest?: Array<{ type: AstNode }>;
    elements?: Array<AstNode | { _tag?: string; type: AstNode }>;
  };
  defaultValue: unknown;
  path: string;
  required: boolean;
}): BuilderFieldSpec => {
  const tupleElementCount = ast.elements?.length ?? 0;
  const validation = deriveValidationSpec(ast);

  if (!ast.rest || ast.rest.length !== 1 || tupleElementCount > 1) {
    throw new Error(`Unsupported builder tuple at ${path}`);
  }

  const tupleElements = ast.elements ?? [];
  const elementTypeCandidate = tupleElementCount === 1 ? tupleElements[0] : ast.rest[0];
  const elementType = unwrapTupleElementType(elementTypeCandidate);

  return {
    kind: 'array',
    path,
    required,
    defaultValue,
    validation,
    element: deriveFieldSpec({
      ast: elementType,
      defaultValue: undefined,
      path: `${path}[]`,
      required: true,
    }),
  };
};

const deriveTypeLiteralFieldSpec = ({
  ast,
  defaultValue,
  path,
  required,
}: {
  ast: TypeLiteralAst;
  defaultValue: unknown;
  path: string;
  required: boolean;
}): BuilderFieldSpec => {
  const validation = deriveValidationSpec(ast);

  if (ast.indexSignatures.length > 0) {
    if (ast.propertySignatures.length > 0 || ast.indexSignatures.length !== 1) {
      throw new Error(`Unsupported builder record at ${path}`);
    }

    return {
      kind: 'record',
      path,
      required,
      defaultValue,
      validation,
      value: deriveFieldSpec({
        ast: ast.indexSignatures[0].type,
        defaultValue: undefined,
        path: `${path}.*`,
        required: true,
      }),
    };
  }

  return {
    kind: 'group',
    path,
    required,
    defaultValue,
    validation,
    fields: ast.propertySignatures.map((property) =>
      deriveFieldSpec({
        ast: unwrapOptionalType(property.type),
        defaultValue: isRecord(defaultValue) ? defaultValue[property.name] : undefined,
        path: `${path}.${property.name}`,
        required: !property.isOptional,
      }),
    ),
  };
};

const unwrapOptionalType = (ast: AstNode): AstNode => {
  if (ast._tag !== 'Union') {
    return ast;
  }

  const remainingTypes = (ast.types ?? []).filter((type) => type._tag !== 'UndefinedKeyword');

  if (remainingTypes.length !== 1) {
    return ast;
  }

  return remainingTypes[0];
};

const unwrapTupleElementType = (element: AstNode | { _tag?: string; type: AstNode }): AstNode => {
  if ('type' in element && element.type) {
    return element.type;
  }

  return element as AstNode;
};

const normalizeTerminalAst = (ast: AstNode): AstNode => {
  switch (ast._tag) {
    case 'Refinement':
      return normalizeTerminalAst(ast.from as AstNode);
    case 'Transformation':
      return normalizeTerminalAst(ast.to as AstNode);
    default:
      return ast;
  }
};

const isRootDiscriminator = (name: string, ast: AstNode): ast is AstNode & { literal: BuilderScalarValue } =>
  (name === 'type' || name === 'step') && ast._tag === 'Literal';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const deriveValidationSpec = (ast: AstNode): BuilderFieldValidationSpec | undefined => {
  const annotationValidation = deriveAnnotationValidationSpec(ast.annotations);

  switch (ast._tag) {
    case 'Refinement':
      return mergeValidationSpecs(deriveValidationSpec(ast.from as AstNode), annotationValidation);
    case 'Transformation':
      return mergeValidationSpecs(
        deriveValidationSpec(ast.from as AstNode),
        deriveValidationSpec(ast.to as AstNode),
        annotationValidation,
      );
    case 'Type':
    case 'OptionalType':
      return mergeValidationSpecs(deriveValidationSpec(ast.type as AstNode), annotationValidation);
    case 'Union': {
      const definedTypes = (ast.types ?? []).filter((type) => type._tag !== 'UndefinedKeyword');

      if (definedTypes.length === 0) {
        return annotationValidation;
      }

      return mergeValidationSpecs(
        intersectValidationSpecs(definedTypes.map(deriveValidationSpec)),
        annotationValidation,
      );
    }
    case 'TupleType':
      return mergeValidationSpecs(
        (ast.elements?.length ?? 0) > 0 ? { minItems: ast.elements?.length } : undefined,
        annotationValidation,
      );
    default:
      return annotationValidation;
  }
};

const deriveAnnotationValidationSpec = (
  annotations: Record<PropertyKey, unknown> | undefined,
): BuilderFieldValidationSpec | undefined => {
  if (!annotations) {
    return undefined;
  }

  const jsonSchemaAnnotation = Object.getOwnPropertySymbols(annotations).find((symbol) =>
    String(symbol).includes('annotation/JSONSchema'),
  );

  if (!jsonSchemaAnnotation) {
    return undefined;
  }

  const jsonSchema = annotations[jsonSchemaAnnotation];

  if (!isRecord(jsonSchema)) {
    return undefined;
  }

  const validation: BuilderFieldValidationSpec = {};

  if (typeof jsonSchema['minLength'] === 'number') {
    validation.minLength = jsonSchema['minLength'];
  }

  if (typeof jsonSchema['minimum'] === 'number') {
    validation.minimum = jsonSchema['minimum'];
  }

  if (typeof jsonSchema['maximum'] === 'number') {
    validation.maximum = jsonSchema['maximum'];
  }

  if (typeof jsonSchema['pattern'] === 'string') {
    validation.pattern = jsonSchema['pattern'];
  }

  if (jsonSchema['type'] === 'integer') {
    validation.integer = true;
  }

  return Object.keys(validation).length > 0 ? validation : undefined;
};

const mergeValidationSpecs = (
  ...specs: Array<BuilderFieldValidationSpec | undefined>
): BuilderFieldValidationSpec | undefined => {
  const merged = specs.reduce<BuilderFieldValidationSpec>((result, spec) => ({ ...result, ...spec }), {});

  return Object.keys(merged).length > 0 ? merged : undefined;
};

const intersectValidationSpecs = (
  specs: Array<BuilderFieldValidationSpec | undefined>,
): BuilderFieldValidationSpec | undefined => {
  const definedSpecs = specs.filter((spec): spec is BuilderFieldValidationSpec => spec !== undefined);

  if (definedSpecs.length === 0) {
    return undefined;
  }

  const keys = new Set(definedSpecs.flatMap((spec) => Object.keys(spec) as Array<keyof BuilderFieldValidationSpec>));
  const intersection: BuilderFieldValidationSpec = {};

  for (const key of keys) {
    const values = definedSpecs.map((spec) => spec[key]);
    const [firstValue] = values;

    if (firstValue === undefined || values.some((value) => value !== firstValue)) {
      continue;
    }

    assignValidationValue(intersection, key, firstValue);
  }

  return Object.keys(intersection).length > 0 ? intersection : undefined;
};

const assignValidationValue = (
  target: BuilderFieldValidationSpec,
  key: keyof BuilderFieldValidationSpec,
  value: BuilderFieldValidationSpec[keyof BuilderFieldValidationSpec],
): void => {
  switch (key) {
    case 'integer':
      target.integer = value as boolean;
      break;
    case 'maximum':
      target.maximum = value as number;
      break;
    case 'minItems':
      target.minItems = value as number;
      break;
    case 'minLength':
      target.minLength = value as number;
      break;
    case 'minimum':
      target.minimum = value as number;
      break;
    case 'pattern':
      target.pattern = value as string;
      break;
  }
};
