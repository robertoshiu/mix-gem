/**
 * @fileoverview Unit tests for the local `no-jsx-unicode-escape` rule.
 *
 * Uses ESLint's RuleTester with the TypeScript parser so TSX (JSX) syntax is
 * understood. Includes the required one passing and one failing fixture, plus
 * extra cases that pin down the intended boundary (JSX text / string-literal
 * attributes flagged; `{ ... }` expressions and plain .ts strings not).
 *
 * This test runs in the project-default `jsdom` environment (the shared
 * `jest.setup.js` assumes a DOM, so a `node`-env override would break on its
 * `window`/`HTMLElement` setup). The only thing jsdom is missing for ESLint's
 * RuleTester here is the `structuredClone` global, which is polyfilled below.
 */
'use strict';

// jsdom in this project does not expose `structuredClone`, but ESLint's
// RuleTester (via @eslint/object-schema) requires it. Node provides it
// natively; fall back to a structured-ish clone if absent.
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (value) =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

const { RuleTester } = require('eslint');
const tsParser = require('@typescript-eslint/parser');
const rule = require('../no-jsx-unicode-escape');

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

// `\\u` in these JS string literals becomes the two characters `\` + `u` in the
// fixture source — i.e. a literal `\u` escape as written in a .tsx file. That
// is exactly what the rule scans the source text for.
const ESC = '\\u2080'; // literal backslash-u-2080 in fixture source
const ESC_LAMBDA = '\\u03bb'; // literal backslash-u-03bb
const ESC_CODEPOINT = '\\u{1F600}'; // literal code-point form

ruleTester.run('no-jsx-unicode-escape', rule, {
  valid: [
    // --- The required passing fixture: real character in JSX text. ---
    {
      name: 'real unicode character in JSX text is fine',
      code: 'const X = () => <span>D₀ avg</span>;',
    },

    // --- \u inside a {} expression (template literal) is decoded by JS. ---
    {
      name: 'unicode escape inside a JSX expression container is allowed',
      code: 'const X = () => <span>{`D' + ESC + ' avg`}</span>;',
    },

    // --- \u inside a {} attribute expression is allowed. ---
    {
      name: 'unicode escape in a {} attribute expression is allowed',
      code: 'const X = () => <i data-label={`E' + ESC + '`} />;',
    },

    // --- \u in a plain .ts string literal (not JSX) is allowed. ---
    {
      name: 'unicode escape in an ordinary string literal is allowed',
      code: 'const label = "EWMA ' + ESC_LAMBDA + '";',
    },

    // --- An escaped backslash followed by a literal "u" is not a \u escape. ---
    {
      name: 'escaped backslash before u is not a unicode escape',
      code: 'const X = () => <span>path\\\\unit</span>;',
    },

    // --- Attribute value that is a real character, not an escape. ---
    {
      name: 'real character in a string-literal attribute is allowed',
      code: 'const X = () => <i label="D₀ avg" />;',
    },
  ],

  invalid: [
    // --- The required failing fixture: \u escape in JSX text. ---
    {
      name: 'unicode escape in JSX text renders verbatim and is flagged',
      code: 'const X = () => <span>D' + ESC + ' avg</span>;',
      errors: [{ messageId: 'jsxUnicodeEscape', data: { context: 'text' } }],
    },

    // --- \u escape in a double-quoted JSX attribute value. ---
    {
      name: 'unicode escape in a string-literal attribute is flagged',
      code: 'const X = () => <i label="EWMA ' + ESC_LAMBDA + '" />;',
      errors: [
        { messageId: 'jsxUnicodeEscape', data: { context: 'attribute value' } },
      ],
    },

    // --- Code-point form `\u{...}` in a string-literal attribute is flagged.
    // Note: `\u{...}` cannot appear in raw JSX *text* because the `{` opens a
    // JSX expression container; the realistic place it shows up verbatim is a
    // quoted attribute value, so that is what is exercised here. ---
    {
      name: 'code-point unicode escape in a string-literal attribute is flagged',
      code: 'const X = () => <i title="emoji ' + ESC_CODEPOINT + '" />;',
      errors: [
        { messageId: 'jsxUnicodeEscape', data: { context: 'attribute value' } },
      ],
    },
  ],
});
