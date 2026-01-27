import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'

const tsTypeCheckedRecommended = typescriptEslint.plugin.configs['flat/recommended-type-checked'].map((cfg) =>
  cfg.files ? cfg : { ...cfg, files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'] }
)

export default [
  globalIgnores([
    'dist/**',
    '**/node_modules/',
    '**/tests/**',
    '**/types/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '.next/**',
    'public/**',
    'coverage/**',
    'build/**',
    'out/**',
    'logs/**',
    '.vscode/**',
    '.mastra/**',
    '.kilocode/**',
    '.github/**',
    '*.log',
    'memory-bank/**',
    'memories/**',
    'docs/**.md',
    'components/ui/**',
    'node_modules/@crawlee/http/internals/http-crawler.d.ts',
    'node_modules/@mdx-js/loader/index.d.cts',
    'docker/**',
    '.spec/**',
    '.specstory/**',
    '.kiro/**',
    '.codacy/**',
    'LICENSE',
    'CHANGELOG.md',
    'README.md',
    'CONTRIBUTING.md',
    'vitest.config.ts',
    'globalSetup.ts',
    'testSetup.ts',
    'vite.config.ts',
    'scripts/**',
    'node_modules',
    '/node_modules',
    'node_modules/**/*.{ts,tsx,js,jsx,.d.ts,.d.cts,.d.mts}',
    '.voltagent/',
    '.next/',
    'app/**/*.tsx',
    '.gemini/**',
    '.github/prompts/**/*.md',
    '.github/chatmodes/*.md',
  ]),
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.next,
  prettierConfig,
  ...typescriptEslint.plugin.configs['flat/recommended'],
  ...tsTypeCheckedRecommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescriptEslint.plugin,
    },
    languageOptions: {
      parser: typescriptEslint.parser,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },

    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {}],
      'no-console': 'warn',
      'no-var': 'warn',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-const': 'warn',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/consistent-type-definitions': [
        'error',
        'interface',
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/array-type': [
        'error',
        { default: 'array-simple' },
      ],
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          default: ['signature', 'field', 'constructor', 'method'],
        },
      ],
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
      '@typescript-eslint/prefer-regexp-exec': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare':
        'error',

      'no-undef': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',

      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'no-trailing-spaces': 'warn',
      'eol-last': 'warn',
    },
  },
]
