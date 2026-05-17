import { AuditCustomBuilderStepVariants } from './custom-audit-step';
import { UserflowBuilderStepVariants } from './lighthouse-userflow/lighthouse-userflow-step';
import { PuppeteerReplayBuilderStepVariants } from './puppeteer-replay/puppeteer-replay-step';
import type { BuilderStepVariantDefinition } from './builder-step-variant';

type BuilderScalarValue = string | number | boolean | null;

type BuilderBaseFieldContract = {
  path: string;
  required: boolean;
  defaultValue?: unknown;
};

export type BuilderFieldContract =
  | (BuilderBaseFieldContract & { kind: 'string' | 'number' | 'boolean' })
  | (BuilderBaseFieldContract & { kind: 'literal'; value: BuilderScalarValue })
  | (BuilderBaseFieldContract & { kind: 'enum'; options: readonly BuilderScalarValue[] })
  | (BuilderBaseFieldContract & { kind: 'group'; fields: BuilderFieldContract[] })
  | (BuilderBaseFieldContract & { kind: 'array'; element: BuilderFieldContract })
  | (BuilderBaseFieldContract & { kind: 'record'; value: BuilderFieldContract });

export type BuilderStepContract = {
  id: string;
  defaultValue: Record<string, unknown>;
  discriminators: Record<string, BuilderScalarValue>;
  fields: BuilderFieldContract[];
};

export const AUDIT_BUILDER_STEP_VARIANTS: readonly BuilderStepVariantDefinition[] = [
  ...PuppeteerReplayBuilderStepVariants,
  ...UserflowBuilderStepVariants,
  ...AuditCustomBuilderStepVariants,
];

export const deriveBuilderStepContract = (variant: BuilderStepVariantDefinition): BuilderStepContract => {
  const ast = variant.schema.ast as unknown as TypeLiteralAst;

  if (ast._tag !== 'TypeLiteral') {
    throw new Error(`Builder variants must be structs. Received ${ast._tag} for ${variant.id}`);
  }

  const discriminators: Record<string, BuilderScalarValue> = {};
  const fields: BuilderFieldContract[] = [];

  for (const property of ast.propertySignatures) {
    const propertyType = unwrapOptionalType(property.type);

    if (isRootDiscriminator(property.name, propertyType)) {
      discriminators[property.name] = propertyType.literal;
      continue;
    }

    fields.push(
      deriveFieldContract({
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
  literal?: unknown;
  types?: AstNode[];
  from?: AstNode;
  to?: AstNode;
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

const deriveFieldContract = ({
  ast,
  defaultValue,
  path,
  required,
}: {
  ast: AstNode;
  defaultValue: unknown;
  path: string;
  required: boolean;
}): BuilderFieldContract => {
  const normalizedAst = normalizeTerminalAst(ast);

  switch (normalizedAst._tag) {
    case 'StringKeyword':
      return { kind: 'string', path, required, defaultValue };
    case 'NumberKeyword':
      return { kind: 'number', path, required, defaultValue };
    case 'BooleanKeyword':
      return { kind: 'boolean', path, required, defaultValue };
    case 'Literal':
      return { kind: 'literal', path, required, defaultValue, value: normalizedAst.literal as BuilderScalarValue };
    case 'Union':
      return deriveUnionFieldContract({
        ast: normalizedAst as AstNode & { types: AstNode[] },
        defaultValue,
        path,
        required,
      });
    case 'TupleType':
      return deriveArrayFieldContract({ ast: normalizedAst, defaultValue, path, required });
    case 'TypeLiteral':
      return deriveTypeLiteralFieldContract({
        ast: normalizedAst as TypeLiteralAst,
        defaultValue,
        path,
        required,
      });
    default:
      throw new Error(`Unsupported builder field at ${path}: ${normalizedAst._tag}`);
  }
};

const deriveUnionFieldContract = ({
  ast,
  defaultValue,
  path,
  required,
}: {
  ast: AstNode & { types: AstNode[] };
  defaultValue: unknown;
  path: string;
  required: boolean;
}): BuilderFieldContract => {
  const literalOptions = ast.types.map((type) => normalizeTerminalAst(type));

  if (literalOptions.every((type) => type._tag === 'Literal')) {
    return {
      kind: 'enum',
      path,
      required,
      defaultValue,
      options: literalOptions.map((type) => type.literal as BuilderScalarValue),
    };
  }

  if (literalOptions.every((type) => type._tag === 'StringKeyword')) {
    return { kind: 'string', path, required, defaultValue };
  }

  if (literalOptions.every((type) => type._tag === 'NumberKeyword')) {
    return { kind: 'number', path, required, defaultValue };
  }

  if (literalOptions.every((type) => type._tag === 'BooleanKeyword')) {
    return { kind: 'boolean', path, required, defaultValue };
  }

  throw new Error(`Unsupported builder union at ${path}`);
};

const deriveArrayFieldContract = ({
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
}): BuilderFieldContract => {
  const tupleElementCount = ast.elements?.length ?? 0;

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
    element: deriveFieldContract({
      ast: elementType,
      defaultValue: undefined,
      path: `${path}[]`,
      required: true,
    }),
  };
};

const deriveTypeLiteralFieldContract = ({
  ast,
  defaultValue,
  path,
  required,
}: {
  ast: TypeLiteralAst;
  defaultValue: unknown;
  path: string;
  required: boolean;
}): BuilderFieldContract => {
  if (ast.indexSignatures.length > 0) {
    if (ast.propertySignatures.length > 0 || ast.indexSignatures.length !== 1) {
      throw new Error(`Unsupported builder record at ${path}`);
    }

    return {
      kind: 'record',
      path,
      required,
      defaultValue,
      value: deriveFieldContract({
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
    fields: ast.propertySignatures.map((property) =>
      deriveFieldContract({
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
  if ('type' in element) {
    return element.type;
  }

  return element;
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
