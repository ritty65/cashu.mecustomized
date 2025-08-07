import { promises as fs } from 'fs';
const file = 'quasar.config.js';
let txt = await fs.readFile(file, 'utf8');

/* --------------------------------------------------------------------------
   1. Replace the entire boot array with a clean, comma-perfect version
   -------------------------------------------------------------------------- */
txt = txt.replace(
  /boot\s*:\s*\[[\s\S]*?\],?/m,
  `boot: [
    'polyfills',
    'ndk',
    'base',
    'global-components',
    'cashu',
    'i18n',
    'buffer-polyfill',
  ],`
);

/* --------------------------------------------------------------------------
   2. Remove ANY existing vite block (if we injected one earlier)
   -------------------------------------------------------------------------- */
txt = txt.replace(/vite\s*:\s*\{[\s\S]*?\},?/m, '');

/* --------------------------------------------------------------------------
   3. Insert a fresh vite block – just before the final closing brace of the
      Quasar config object.  This guarantees syntactically-valid JS.
   -------------------------------------------------------------------------- */
const viteBlock = `
  // ► Buffer polyfill ◄
  vite: {
    optimizeDeps: { include: ['buffer'] },
    build: {
      rollupOptions: {
        plugins: [
          {
            name: 'buffer-polyfill',
            resolveId(id) { return id === 'buffer' ? 'buffer' : null; },
          },
        ],
      },
    },
  },`;

txt = txt.replace(/\n\}\s*\)\s*;?\s*$/, viteBlock + '\n});');

await fs.writeFile(file, txt);
console.log('✅  quasar.config.js rebuilt (boot + vite)');
