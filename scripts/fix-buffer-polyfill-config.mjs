import { promises as fs } from 'fs';
const cfg = 'quasar.config.js';
let txt = await fs.readFile(cfg, 'utf8');

/* ── 1. make sure boot array contains 'buffer-polyfill' ──────────────────── */
txt = txt.replace(
  /boot\s*:\s*\[\s*([\s\S]*?)\s*\]/m,
  (m, inner) => {
    if (inner.includes("'buffer-polyfill'")) return m;          // already in
    inner = inner.trimEnd().replace(/,?\s*$/, '');              // drop extra ,
    return `boot: [
${inner ? '  ' + inner + ',\n' : ''}  'buffer-polyfill',
]`;
  },
);

/* ── 2. ensure vite block has the polyfill bits ──────────────────────────── */
if (!/vite\s*:\s*{[\s\S]*optimizeDeps/.test(txt)) {
  // no vite block at all – inject one before final "});"
  txt = txt.replace(/\)\s*;\s*$/, `
  // added automatically ↓
  vite: {
    optimizeDeps: { include: ['buffer'] },
    build: {
      rollupOptions: {
        plugins: [{
          name: 'buffer-polyfill',
          resolveId(id) { return id === 'buffer' ? 'buffer' : null; },
        }],
      },
    },
  },
});
`);
} else {
  // vite exists – only merge the pieces that might be missing
  if (!/optimizeDeps[\s\S]*include:\s*\[[^\]]*'buffer'/.test(txt)) {
    txt = txt.replace(/optimizeDeps\s*:\s*{[^}]*}/,
      m => m.replace(/}$/, ", include: ['buffer'] }"));
  }
  if (!/name:\s*['"]buffer-polyfill['"]/.test(txt)) {
    txt = txt.replace(/rollupOptions\s*:\s*{[^}]*plugins\s*:\s*\[/,
      m => m + `{
        name: 'buffer-polyfill',
        resolveId(id) { return id === 'buffer' ? 'buffer' : null; },
      },`);
  }
}

await fs.writeFile(cfg, txt, 'utf8');
console.log('✅ quasar.config.js is patched – re-run the build!');
