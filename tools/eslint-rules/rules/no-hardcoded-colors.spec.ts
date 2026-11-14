import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { findHardcodedColors, rule, RULE_NAME } from './no-hardcoded-colors';

const values = (css: string) => findHardcodedColors(css).map((color) => color.value);

describe('findHardcodedColors', () => {
  it('finds hex, functional and keyword colours in declaration values', () => {
    expect(values('a { color: #667085; border: 1px solid rgb(0 0 0 / 12%); background: white; }')).toEqual([
      '#667085',
      'rgb(0 0 0 / 12%)',
      'white',
    ]);
  });

  it('finds literals used as var() fallbacks and inside color-mix()', () => {
    expect(values('a { color: var(--mat-sys-primary, #0b57d0); }')).toEqual(['#0b57d0']);
    expect(values('a { background: color-mix(in srgb, var(--mat-sys-outline) 60%, white); }')).toEqual(['white']);
  });

  it('accepts tokens and non-colour keywords', () => {
    expect(
      values(`
        a {
          color: var(--mat-sys-on-surface);
          background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
          border: 1px solid currentColor;
          box-shadow: var(--mat-sys-level2);
          outline: 2px solid var(--ui-success);
        }
      `),
    ).toEqual([]);
  });

  it('does not read selectors, comments or strings as colours', () => {
    expect(values('#fab:hover { display: block; } /* color: red */ a::before { content: "red #fff"; }')).toEqual([]);
  });

  it('does not treat colour words in unrelated properties as colours', () => {
    expect(values('a { font-family: Tan, sans-serif; animation-name: red; }')).toEqual([]);
  });

  it('ignores custom property names that contain a colour word', () => {
    expect(values('a { color: var(--brand-red); }')).toEqual([]);
  });
});

const ruleTester = new RuleTester({ languageOptions: { parser: tseslint.parser } });

ruleTester.run(RULE_NAME, rule, {
  valid: [
    '@Component({ styles: `a { color: var(--mat-sys-primary); }` }) class A {}',
    '@Component({ styles: [`a { color: var(--mat-sys-primary); }`] }) class A {}',
    '@Component({ template: `<p style="margin: 0">Text</p>` }) class A {}',
    // Only component metadata is checked.
    "const palette = { styles: 'a { color: #fff; }' };",
  ],
  invalid: [
    {
      code: '@Component({ styles: `\n  a { color: #fff; }\n` }) class A {}',
      errors: [{ messageId: 'hardcoded', data: { value: '#fff' }, line: 2, column: 14, endColumn: 18 }],
    },
    {
      code: "@Component({ styles: ['a { color: red; }', `b { fill: #000; }`] }) class A {}",
      errors: [
        { messageId: 'hardcoded', data: { value: 'red' } },
        { messageId: 'hardcoded', data: { value: '#000' } },
      ],
    },
    {
      code: '@Component({ template: `<span style="color: red;">{{ value }}</span>` }) class A {}',
      errors: [{ messageId: 'hardcoded', data: { value: 'red' }, line: 1, column: 45 }],
    },
  ],
});
