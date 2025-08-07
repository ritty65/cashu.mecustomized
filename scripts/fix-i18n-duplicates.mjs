import { promises as fs } from "fs";
import fg from "fast-glob";

const files = await fg("../src/i18n/*/index.ts");

for (const file of files) {
  let txt = await fs.readFile(file, "utf8");

  // keep the FIRST "creatorHub" object, drop the rest
  const parts = txt.split(/creatorHub\s*:/);
  if (parts.length > 2) {
    const kept = parts.shift(); // code before the first block
    const first = parts.shift(); // the first block itself
    const rest = parts.join("creatorHub:"); // everything after duplicates
    txt = kept + "creatorHub:" + first + rest;
    await fs.writeFile(file, txt);
    console.log("deduped ➜", file);
  }
}
