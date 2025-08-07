import { promises as fs } from 'fs';
const FILE = 'quasar.config.js';
let txt = await fs.readFile(FILE, 'utf8');

/* ─── 1 · BOOT ARRAY — keep existing entries, ensure commas & polyfill ─── */
txt = txt.replace(
  /boot\s*:\s*\[([\s\S]*?)\]/m,
  (_, inner) => {
    const items = inner
      .split(/[, \n]/)
      .map(s => s.trim().replace(/^['"`]|['"`]$/g, ''))
      .filter(Boolean);

    const need = [
      'polyfills', 'ndk', 'base', 'global-components',
      'cashu', 'i18n', 'buffer-polyfill'
    ];
    const final = [...new Set([...items, ...need])];
    return `boot: [\n  ${final.map(s => `'${s}'`).join(',\n  ')}\n]`;
  }
);

/* ─── 2 · VITE SECTION — drop any previous copy & write a clean one ─────── */
const viteBlock = `
  // Buffer polyfill for browser build
  vite: {
    optimizeDeps: { include: ['buffer'] },
    build: {
      rollupOptions: {
        plugins: [{
          name: 'buffer-polyfill',
          resolveId (id) { return id === 'buffer' ? 'buffer' : null; }
        }]
      }
    }
  },`;

txt = txt
  // remove any existing "vite:" block (greedy but safe: looks for vite:{…})
  .replace(/vite\s*:\s*\{[\s\S]*?\},?/m, '')
  // insert ours just before the final export object’s closing brace
  .replace(/\}\s*$/m, viteBlock + '\n}');
  
await fs.writeFile(FILE, txt);
console.log('✅  quasar.config.js repaired');
