/**
 * @fileoverview Local ESLint plugin for equipment-monitor.
 *
 * Exposed as the `local` plugin in eslint.config.mjs. Add rules here as
 * `local/<rule-name>` once they are required in the flat config.
 *
 * @type {import('eslint').ESLint.Plugin}
 */
'use strict';

const noJsxUnicodeEscape = require('./no-jsx-unicode-escape');

module.exports = {
  meta: {
    name: 'eslint-plugin-local',
    version: '1.0.0',
  },
  rules: {
    'no-jsx-unicode-escape': noJsxUnicodeEscape,
  },
};
