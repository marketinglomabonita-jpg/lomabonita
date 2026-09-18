import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'
import globals from 'globals'

export default tseslint.config(
  {
    // Solo el código de la app. El tooling Praxis y los artefactos de build quedan fuera.
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      '.claude/**',
      '.agents/**',
      '.graphify/**',
      '.praxis/**',
      'next-env.d.ts',
      'scripts/**',
      '*.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: {
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['*.ts', '*.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },
)
