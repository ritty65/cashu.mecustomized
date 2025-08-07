import { promises as fs } from 'fs';
import fg from 'fast-glob';

const files = await fg('../src/i18n/*/index.ts');

for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  let out = '';
  let i = 0;
  let firstSeen = false;

  while (i < text.length) {
    // look for the next “creatorHub:”
    const start = text.indexOf('creatorHub', i);
    if (start === -1) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, start);

    if (firstSeen) {
      // →  Skip this block entirely  ←
      //     1. jump to the first “{”
      //     2. keep a brace-depth counter until we leave the block
      let j = text.indexOf('{', start);
      let depth = 0;
      for (; j < text.length; j++) {
        if (text[j] === '{') depth++;
        if (text[j] === '}') if (--depth === 0) { j++; break; }
      }
      // continue scanning after the block we just skipped
      i = j;
    } else {
      // keep the very first one
      firstSeen = true;
      i = start;
      // copy until we leave **this** block
      let j = text.indexOf('{', start);
      let depth = 0;
      for (; j < text.length; j++) {
        if (text[j] === '{') depth++;
        if (text[j] === '}') if (--depth === 0) { j++; break; }
      }
      out += text.slice(i, j);
      i = j;
    }
  }

  if (text !== out) {
    await fs.writeFile(file, out);
    console.log('fixed  ➜', file);
  }
}
