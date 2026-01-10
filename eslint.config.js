import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

export default [
  ...compat.config({ extends: ['@vue/eslint-config-typescript'] }),
  {
    ignores: ['test/**'],
  },
];
