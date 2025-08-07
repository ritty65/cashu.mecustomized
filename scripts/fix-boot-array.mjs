import { promises as fs } from 'fs';

const FILE = 'quasar.config.js';
let code   = await fs.readFile(FILE, 'utf8');

/* ░░ Grab whatever is between boot:[ … ], normalise & dedupe ░░ */
code = code.replace(
  /boot\s*:\s*\[([\s\S]*?)\]/m,
  (_, inner) => {
    const items = inner
      .split(/[\n,]/)              // break on commas or new-lines
      .map(s => s.trim().replace(/^['"`]|['"`]$/g, ''))  // strip quotes
      .filter(Boolean);

    const uniq = [...new Set(items)];
    if (!uniq.includes('buffer-polyfill')) uniq.push('buffer-polyfill');

    return `boot: [
  ${uniq.map(s => `'${s}'`).join(',\n  ')},
]`;
  }
);

await fs.writeFile(FILE, code, 'utf8');
console.log('✅ boot array rebuilt → try the build again');
