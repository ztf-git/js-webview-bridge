import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'
// 添加Prettier
import prettierRecommended from 'eslint-plugin-prettier/recommended'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.browser }
  },
  js.configs.recommended, // ✅ Flat Config 写法
  ...tseslint.configs.recommended,
  prettierRecommended
])
