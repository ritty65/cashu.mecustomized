import { promises as fs } from 'fs';
import path from 'path';

/* -------------------------------------------------------------------------- */
/* 1.  make the boot file                                                     */
/* -------------------------------------------------------------------------- */
const bootDir = path.resolve('src/boot');
await fs.mkdir(bootDir, { recursive: true });
await fs.writeFile(
  path.join(bootDir, 'buffer-polyfill.ts'),
  `import { Buffer } from 'buffer';

if (!(window as any).Buffer) {
  (window as any).Buffer = Buffer;   // make Buffer globally available
}
`,
  'utf8'
);

/* -------------------------------------------------------------------------- */
/* 2.  patch quasar.config.js                                                 */
/* -------------------------------------------------------------------------- */
const cfgPath = path.resolve('quasar.config.js');
let code = await fs.readFile(cfgPath, 'utf8');

/* ── add boot entry ───────────────────────────────────────────────────────── */
if (!code.includes("'buffer-polyfill'")) {
  code = code.replace(
    /boot:\s*\[((?:[^[\]]|\[[^\]]*\])*)]/m,
    (_m, body) => `boot: [
${body.trimEnd()}
    'buffer-polyfill',
  ]`
  );
}

/* ── add/merge vite block --------------------------------------------------- */
if (!code.includes('buffer-polyfill') || !code.includes("optimizeDeps")) {
  const viteBlock = `
  /* === added automatically ==================================== */
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
  // crude but safe: drop the block just before the final "});"
  code = code.replace(/\)\s*;\s*$/, viteBlock + '\n});');
}

await fs.writeFile(cfgPath, code, 'utf8');
console.log('✅  Buffer polyfill wired in – now rebuild!');
