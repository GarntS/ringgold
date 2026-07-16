import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'docs/', 'node_modules/', 'public/solver/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { languageOptions: { globals: { console: 'readonly', process: 'readonly', navigator: 'readonly', window: 'readonly', location: 'readonly', URL: 'readonly', document: 'readonly' } } },
);
