import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import jsconfigPaths from './vitest-jsconfig-paths'
import path from 'path'

export default defineConfig({
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['test/vitest/setup-file.js'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'test/vitest/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
  },
  resolve: {
    alias: [
      { find: /^@cashu\/cashu-ts$/, replacement: path.resolve(__dirname, 'src/compat/cashu-ts.ts') },
      { find: 'src', replacement: path.resolve(__dirname, 'src') },
      { find: 'app', replacement: path.resolve(__dirname) },
      { find: 'components', replacement: path.resolve(__dirname, 'src/components') },
      { find: 'layouts', replacement: path.resolve(__dirname, 'src/layouts') },
      { find: 'pages', replacement: path.resolve(__dirname, 'src/pages') },
      { find: 'assets', replacement: path.resolve(__dirname, 'src/assets') },
      { find: 'boot', replacement: path.resolve(__dirname, 'src/boot') },
      { find: 'stores', replacement: path.resolve(__dirname, 'src/stores') },
    ],
  },
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    quasar({
      sassVariables: 'src/quasar-variables.scss',
    }),
    jsconfigPaths(),
  ],
})
