// generate-combining.ts
import fs from "fs";
import https from "https";

const UNICODE_VERSION = "17.0.0";
const URL = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/extracted/DerivedCombiningClass.txt`;

/**
 * Download a text file from Unicode.org
 */
async function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${url}`));
        return;
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

/**
 * Parse DerivedCombiningClass.txt and return all combining code points.
 */
function parseCombining(data: string): Set<number> {
  const combining = new Set<number>();

  for (const line of data.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Example: "0300..036F    ; 230 # Mn   [112] COMBINING GRAVE ACCENT..COMBINING LATIN SMALL LETTER X"
    const match = trimmed.match(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([0-9]+)/);
    if (!match) continue;

    const start = parseInt(match[1], 16);
    const end = match[2] ? parseInt(match[2], 16) : start;
    const cls = parseInt(match[3], 10);

    if (cls > 0) {
      for (let cp = start; cp <= end; cp++) {
        combining.add(cp);
      }
    }
  }

  return combining;
}

/**
 * Generate a bitset array for O(1) lookup.
 */
function generateBitset(codePoints: Set<number>): number[] {
  const maxIndex = (0x10ffff >> 5) + 1; // 32 bits per chunk
  const bitset = new Array(maxIndex).fill(0);

  for (const cp of codePoints) {
    const idx = cp >> 5;
    const bit = cp & 31;
    bitset[idx] |= 1 << bit;
  }

  return bitset;
}

/**
 * Main: download, parse, generate, save
 */
async function main() {
  console.log(`Downloading Unicode ${UNICODE_VERSION} combining data...`);
  const raw = await downloadFile(URL);

  console.log("Parsing...");
  const combiningPoints = parseCombining(raw);
  console.log(`Found ${combiningPoints.size} combining characters`);

  console.log("Generating bitset...");
  const bitset = generateBitset(combiningPoints);

  // export

  const combiningMap = {};

  for (let i = 0; i < bitset.length; i++) {
    if (bitset[i] !== 0) combiningMap[i] = bitset[i];
  }

  const exportMap = [
    '/**',
    ` * Lookup function for combining character bitset (Unicode ${UNICODE_VERSION}).`,
    ' *',
    ' * - Retrieves the 32-bit word for a given Unicode block index.',
    ' * - Falls back to `0` if the block has no combining marks.',
    ' *',
    ' * @param idx Block index (ucs >> 5)',
    ' * @returns 32-bit mask of combining codepoints in that block',
    ' */',
    'export const combining = (idx: number): number => combiningMap[idx] ?? 0;',
    '',
    `export const combiningMap: Record<number, number> = ${
      JSON.stringify(combiningMap, null, 2).replaceAll('"', '')
    };\n`
  ].join('\n');

  fs.writeFileSync("combining.ts", exportMap);

  console.log("Done! Files written: combining.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
