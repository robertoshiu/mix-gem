/**
 * @fileoverview Flags literal `\uXXXX` escape sequences that appear inside JSX
 * text nodes or JSX string-literal attribute values.
 *
 * Why this rule exists:
 *   JSX does NOT interpret `\u` escape sequences the way a JavaScript string
 *   literal does. Writing `D₀ avg` as JSX *text* (or as a double/single
 *   quoted JSX attribute value like `label="D₀ avg"`) renders the literal
 *   characters `D₀ avg` on screen instead of `D₀ avg`. A `\u` escape is
 *   only decoded when it lives inside a real JS expression — a template
 *   literal, a string literal, etc. — which in JSX means inside `{ ... }`.
 *
 * What this rule flags:
 *   - JSXText nodes (the raw text between JSX tags).
 *   - JSX attribute values that are plain string literals (e.g. `title="..."`).
 *
 * What this rule deliberately does NOT flag:
 *   - `\u` escapes inside `{ ... }` JSX expression containers (template
 *     literals, string literals, function calls such as `ctx.fillText`, etc.) —
 *     those are real JS and ARE decoded.
 *   - `\u` escapes in ordinary `.ts` string literals outside JSX.
 *
 * `no-restricted-syntax` cannot express this because it matches AST node
 * *types*, not the textual content of a node — hence this small local rule.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
'use strict';

// Matches a literal backslash-u escape as it would appear in source text:
//   - `\uXXXX`        (exactly 4 hex digits, the common BMP form)
//   - `\u{...}`       (1-6 hex digits, the ES2015 code-point form)
// A leading even/odd backslash check guards against a `\\u` (escaped
// backslash followed by a literal "u"), which is not a unicode escape.
const UNICODE_ESCAPE = /\\u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]{1,6}\})/;

/**
 * Returns true if `text` contains a `\u` escape that is not preceded by an
 * even-counted run of backslashes (i.e. the backslash before `u` is not itself
 * escaped). This avoids false positives on `\\uXXXX`.
 *
 * @param {string} text Raw source text to scan.
 * @returns {boolean} Whether a live `\u` escape is present.
 */
function hasUnicodeEscape(text) {
  const re = new RegExp(UNICODE_ESCAPE.source, 'g');
  let match;
  while ((match = re.exec(text)) !== null) {
    // Count the run of backslashes immediately preceding the matched `\u`.
    // The match starts at the backslash of `\u`, so look back from there.
    let backslashes = 0;
    let i = match.index - 1;
    while (i >= 0 && text[i] === '\\') {
      backslashes += 1;
      i -= 1;
    }
    // The matched `\` is consumed by the regex; if the number of *preceding*
    // backslashes is even, the matched backslash is a real escape introducer.
    if (backslashes % 2 === 0) {
      return true;
    }
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'disallow literal \\uXXXX escape sequences in JSX text and JSX string-literal attribute values (JSX does not decode them)',
      recommended: false,
    },
    schema: [],
    messages: {
      jsxUnicodeEscape:
        'Literal "\\u" escape in JSX {{context}} will render verbatim — JSX does not decode \\u. Move the symbol into a {} expression (e.g. a constant or template literal) or paste the real character.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();

    /**
     * @param {import('eslint').Rule.Node} node
     * @param {string} ctxLabel Human-readable location for the message.
     */
    function report(node, ctxLabel) {
      context.report({
        node,
        messageId: 'jsxUnicodeEscape',
        data: { context: ctxLabel },
      });
    }

    return {
      // Raw text between JSX tags, e.g. `<span>D₀ avg</span>`.
      JSXText(node) {
        if (hasUnicodeEscape(sourceCode.getText(node))) {
          report(node, 'text');
        }
      },

      // String-literal attribute values, e.g. `label="D₀ avg"`.
      // Attribute values written as `{ ... }` are JSXExpressionContainer nodes,
      // not Literal nodes, so they are correctly ignored here.
      JSXAttribute(node) {
        const value = node.value;
        if (
          value &&
          value.type === 'Literal' &&
          typeof value.value === 'string'
        ) {
          if (hasUnicodeEscape(sourceCode.getText(value))) {
            report(value, 'attribute value');
          }
        }
      },
    };
  },
};
