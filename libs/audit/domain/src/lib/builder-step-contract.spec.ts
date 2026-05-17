import { Schema } from 'effect';
import { describe, expect, it } from 'vitest';
import { AUDIT_BUILDER_STEP_VARIANTS, deriveBuilderStepContract } from './builder-step-contract';

describe('builder step contract', () => {
  it('exports every current builder-creatable variant', () => {
    expect(AUDIT_BUILDER_STEP_VARIANTS.map((variant) => variant.id)).toEqual([
      'waitForElement',
      'waitForExpression',
      'change',
      'click',
      'close',
      'doubleClick',
      'emulateNetworkConditions',
      'hover',
      'keyDown',
      'keyUp',
      'navigate',
      'scroll',
      'setViewport',
      'startNavigation',
      'endNavigation',
      'startTimespan',
      'endTimespan',
      'snapshot',
      'clearCache',
      'addCookie',
    ]);
  });

  it('derives contracts for every registered variant', () => {
    expect(() => AUDIT_BUILDER_STEP_VARIANTS.map(deriveBuilderStepContract)).not.toThrow();
  });

  it('derives a click variant contract from the authoring schema', () => {
    const contract = deriveBuilderStepContract(findVariant('click'));

    expect(contract.id).toBe('click');
    expect(contract.discriminators).toEqual({ type: 'click' });
    expect(contract.defaultValue).toEqual({
      type: 'click',
      offsetX: 1,
      offsetY: 1,
      selectors: [],
    });
    expect(contract.fields.map((field) => field.path)).not.toContain('type');
    expect(findField(contract, 'selectors')).toMatchObject({
      kind: 'array',
      path: 'selectors',
      required: true,
    });
  });

  it('represents normalized selectors, records, arrays of structs, and optionals', () => {
    const waitForElement = deriveBuilderStepContract(findVariant('waitForElement'));
    const selectorsField = findField(waitForElement, 'selectors');
    const assertedEventsField = findField(waitForElement, 'assertedEvents');
    const attributesField = findField(waitForElement, 'attributes');
    const visibleField = findField(waitForElement, 'visible');

    expect(selectorsField).toMatchObject({
      kind: 'array',
      path: 'selectors',
      element: {
        kind: 'group',
        path: 'selectors[]',
        fields: [
          {
            kind: 'array',
            path: 'selectors[].segments',
            element: { kind: 'string', path: 'selectors[].segments[]' },
          },
        ],
      },
    });
    expect(assertedEventsField).toMatchObject({
      kind: 'array',
      path: 'assertedEvents',
      required: false,
      element: {
        kind: 'group',
        path: 'assertedEvents[]',
        fields: [
          { kind: 'literal', path: 'assertedEvents[].type', value: 'navigation' },
          { kind: 'string', path: 'assertedEvents[].title', required: false },
          { kind: 'string', path: 'assertedEvents[].url', required: false },
        ],
      },
    });
    expect(attributesField).toMatchObject({
      kind: 'record',
      path: 'attributes',
      value: { kind: 'string', path: 'attributes.*' },
    });
    expect(visibleField).toMatchObject({
      kind: 'boolean',
      path: 'visible',
      required: false,
    });
  });

  it('derives local validation metadata for scalar and container rules', () => {
    const waitForExpression = deriveBuilderStepContract(findVariant('waitForExpression'));
    const navigate = deriveBuilderStepContract(findVariant('navigate'));
    const click = deriveBuilderStepContract(findVariant('click'));
    const urlField = findField(navigate, 'url');

    expect(findField(waitForExpression, 'expression')).toMatchObject({
      kind: 'string',
      validation: { minLength: 1 },
    });
    expect(urlField).toMatchObject({ kind: 'string' });
    expect(urlField.validation?.pattern).toContain('^https:\\/\\/');
    expect(findField(click, 'offsetX')).toMatchObject({
      kind: 'number',
      validation: {
        integer: true,
        minimum: 0,
      },
    });
    expect(findField(click, 'selectors')).toMatchObject({
      kind: 'array',
      element: {
        kind: 'group',
        fields: [
          {
            kind: 'array',
            path: 'selectors[].segments',
            validation: { minItems: 1 },
            element: {
              kind: 'string',
              path: 'selectors[].segments[]',
              validation: { minLength: 1 },
            },
          },
        ],
      },
    });
  });

  it('keeps root discriminators structural and preserves legacy defaults', () => {
    const startNavigation = deriveBuilderStepContract(findVariant('startNavigation'));
    const addCookie = deriveBuilderStepContract(findVariant('addCookie'));

    expect(startNavigation.discriminators).toEqual({
      type: 'customStep',
      step: 'startNavigation',
    });
    expect(startNavigation.fields.map((field) => field.path)).toEqual(['name']);
    expect(addCookie.defaultValue).toEqual({
      type: 'customStep',
      step: 'addCookie',
      name: '',
      value: '',
      url: '',
    });
    expect(findField(addCookie, 'sameSite')).toMatchObject({
      kind: 'enum',
      options: ['Strict', 'Lax', 'None'],
      required: false,
    });
  });

  it('fails loudly for unsupported builder shapes', () => {
    expect(() =>
      deriveBuilderStepContract({
        id: 'unsupported',
        schema: Schema.Struct({
          value: Schema.Union(Schema.String, Schema.Number),
        }),
        defaultValue: {},
      }),
    ).toThrowError('Unsupported builder union at value');
  });
});

const findVariant = (id: string) => {
  const variant = AUDIT_BUILDER_STEP_VARIANTS.find((candidate) => candidate.id === id);

  expect(variant).toBeDefined();

  if (!variant) {
    throw new Error(`Missing builder variant ${id}`);
  }

  return variant;
};

const findField = (contract: { fields: Array<{ path: string }> }, path: string) => {
  const field = contract.fields.find((candidate) => candidate.path === path);

  expect(field).toBeDefined();

  if (!field) {
    throw new Error(`Missing field ${path}`);
  }

  return field;
};
