import type { Rule } from 'eslint';

// ESLint's node type without the parent link, which the nodes inside component metadata are typed without.
type Node = Rule.Node extends infer T ? (T extends unknown ? Omit<T, 'parent'> : never) : never;

// Rejects literal colours in Angular component styles. Colour comes from the theme
// (`--mat-sys-*` and `--ui-*`), so a literal is either a missing token or a value that will not
// follow the scheme. See docs/conventions/design-system.md.

const NAMED_COLORS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood ' +
    'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod ' +
    'darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon ' +
    'darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray ' +
    'dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green ' +
    'greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon ' +
    'lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon ' +
    'lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen ' +
    'magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue ' +
    'mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy ' +
    'oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip ' +
    'peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown ' +
    'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal ' +
    'thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'
  ).split(' '),
);

// Properties whose value can carry a colour keyword. Hex and functional colours are checked everywhere.
const COLOR_PROPERTY =
  /^(--.*|.*color|background|border(-.*)?|outline|box-shadow|text-shadow|fill|stroke|text-decoration|column-rule|filter)$/;

const DECLARATION = /([\w-]+)\s*:\s*([^;{}]+)(?=[;}]|$)/g;
const HEX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi;
const WORD = /(?<![\w-])[a-z]+(?![\w(-])/gi;

export const RULE_NAME = 'no-hardcoded-colors';

interface FoundColor {
  readonly value: string;
  readonly index: number;
}

/** Blanks out comments and quoted strings so their contents are not read as declarations. */
function mask(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\/|"[^"]*"|'[^']*'/g, (match) => ' '.repeat(match.length));
}

export function findHardcodedColors(css: string): FoundColor[] {
  const found: FoundColor[] = [];
  const source = mask(css);
  for (const declaration of source.matchAll(DECLARATION)) {
    const [, property, value] = declaration;
    const valueStart = declaration.index + declaration[0].length - value.length;
    const report = (match: RegExpMatchArray) => found.push({ value: match[0], index: valueStart + (match.index ?? 0) });

    for (const match of value.matchAll(HEX)) report(match);
    for (const match of value.matchAll(COLOR_FUNCTION)) {
      // A colour computed from tokens, e.g. `rgb(from var(--mat-sys-primary) r g b / 50%)`, is fine.
      if (!match[1].includes('var(')) report(match);
    }
    if (COLOR_PROPERTY.test(property.toLowerCase())) {
      // Skip the names inside `var(--…)`; a custom property may be called anything.
      const keywords = value.replace(/var\(\s*--[\w-]+/g, (match) => ' '.repeat(match.length));
      for (const match of keywords.matchAll(WORD)) {
        if (NAMED_COLORS.has(match[0].toLowerCase())) report(match);
      }
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

const INLINE_STYLE = /\bstyle\s*=\s*"([^"]*)"/g;

function findInTemplate(template: string): FoundColor[] {
  const found: FoundColor[] = [];
  for (const attribute of template.matchAll(INLINE_STYLE)) {
    const start = attribute.index + attribute[0].length - attribute[1].length - 1;
    for (const color of findHardcodedColors(attribute[1])) {
      found.push({ value: color.value, index: start + color.index });
    }
  }
  return found;
}

export const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow literal colours in Angular component styles; use theme tokens',
    },
    schema: [],
    messages: {
      hardcoded:
        "Use a theme token instead of the literal colour '{{value}}' (--mat-sys-* or --ui-*). " +
        'See docs/conventions/design-system.md.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    /** Reports every colour in a string-like node, pointing at the colour itself where possible. */
    function check(node: Node, find: (text: string) => FoundColor[]): void {
      if (node.type === 'TemplateLiteral') {
        for (const quasi of node.quasis) {
          if (!quasi.range) continue;
          // `range` covers the delimiters: a backtick or `}` before the text.
          const textStart = quasi.range[0] + 1;
          for (const color of find(quasi.value.raw)) {
            const start = textStart + color.index;
            context.report({
              loc: {
                start: sourceCode.getLocFromIndex(start),
                end: sourceCode.getLocFromIndex(start + color.value.length),
              },
              messageId: 'hardcoded',
              data: { value: color.value },
            });
          }
        }
      } else if (node.type === 'Literal' && typeof node.value === 'string') {
        for (const color of find(node.value)) {
          context.report({ node, messageId: 'hardcoded', data: { value: color.value } });
        }
      } else if (node.type === 'ArrayExpression') {
        for (const element of node.elements) if (element && element.type !== 'SpreadElement') check(element, find);
      }
    }

    return {
      // Decorators come from the TypeScript parser and are not part of the ESTree types.
      Decorator(node: { expression: Node }) {
        const call = node.expression;
        if (call.type !== 'CallExpression' || call.callee.type !== 'Identifier' || call.callee.name !== 'Component') {
          return;
        }
        const metadata = call.arguments[0];
        if (!metadata || metadata.type !== 'ObjectExpression') return;
        for (const property of metadata.properties) {
          if (property.type !== 'Property' || property.key.type !== 'Identifier') continue;
          if (property.key.name === 'styles') check(property.value, findHardcodedColors);
          if (property.key.name === 'template') check(property.value, findInTemplate);
        }
      },
    };
  },
};
