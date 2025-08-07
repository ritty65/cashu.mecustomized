import { promises as fs } from 'fs';
import path from 'path';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Helper: pretty‑print an array of strings on their own lines                */
/* ─────────────────────────────────────────────────────────────────────────── */
const prettyArr = arr => `[\n  ${arr.map(s => `'${s}'`).join(',\n  ')}\n]`;

/* ─── 1 ░░ rebuild the boot array ░░ ──────────────────────────────────────── */
const cfgFile = 'quasar.config.js';
let cfg = await fs.readFile(cfgFile, 'utf8');

cfg = cfg.replace(/boot\s*:\s*\[([\s\S]*?)\]/m, (_, inner) => {
  const items = inner
    .split(/[\n,]/)
    .map(s => s.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter(Boolean);

  const wanted = [
    'polyfills',
    'ndk',
    'base',
    'global-components',
    'cashu',
    'i18n',
    'buffer-polyfill',
  ];
  const uniq = [...new Set([...items, ...wanted])];   // preserve existing + required
  return `boot: ${prettyArr(uniq)}`;
});

/* ─── 2 ░░ ensure Vite polyfill bits ░░ ───────────────────────────────────── */
if (!/optimizeDeps\s*:\s*{[^}]*include\s*:\s*\[[^\]]*'buffer'/s.test(cfg)) {
  const viteBlock =
`vite: {
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

  // insert before the closing export (very tolerant)
  cfg = cfg.replace(/export default defineQuasarConfig\(\{/, m => `${m}\n  ${viteBlock}\n`);
}

/* ─── 3 ░░ write config back ░░ ───────────────────────────────────────────── */
await fs.writeFile(cfgFile, cfg, 'utf8');
console.log('✅ quasar.config.js repaired');

/* ─── 4 ░░ guarantee the boot file exists ░░ ──────────────────────────────── */
const bootPath = path.resolve('src/boot/buffer-polyfill.ts');
await fs.mkdir(path.dirname(bootPath), { recursive: true });
await fs.writeFile(
  bootPath,
  `import { Buffer } from 'buffer';
if (!(window as any).Buffer) { (window as any).Buffer = Buffer; }`,
  'utf8',
);
console.log('✅ src/boot/buffer-polyfill.ts in place');
