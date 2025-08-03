import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'
import prettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        languageOptions: {
            globals: globals.node
        },
        plugins: {
            import: importPlugin,
            'no-relative-import-paths': noRelativeImportPaths,
            'simple-import-sort': simpleImportSort,
            'unused-imports': unusedImports,
            prettier
        },
        rules: {
            'no-relative-import-paths/no-relative-import-paths': [
                'error',
                { allowSameFolder: false, rootDir: 'src', prefix: '@' }
            ],
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_'
                }
            ],
            // 禁用可能与 simple-import-sort 冲突的规则
            'import/order': 'off',
            'sort-imports': 'off',
            // Prettier 规则
            'prettier/prettier': 'error'
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json'
                }
            }
        }
    }
]
