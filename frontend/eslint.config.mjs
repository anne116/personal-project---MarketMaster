import globals from 'globals';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import airbnbBase from 'eslint-config-airbnb-base';
import airbnbReactRules from 'eslint-config-airbnb/rules/react';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 12,
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    plugins: {
      react,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...airbnbBase.rules,
      ...airbnbReactRules.rules,
      ...prettierConfig.rules,
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          jsxSingleQuote: true,
        },
      ],
      quotes: ['error', 'single'],
      'react/jsx-filename-extension': [
        'warn',
        {
          extensions: ['.js', '.jsx'],
        },
      ],
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
