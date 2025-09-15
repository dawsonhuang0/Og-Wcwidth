// generateBitset.ts

/**
 * This file incorporates data from the Unicode Character Database.
 * Distributed under the Unicode Data Files and Software License.
 * See unicode/UNICODE-LICENSE.txt for details.
 */

import fs from "fs";
import https from "https";

const UNICODE_VERSION = "17.0.0";
const URL_UNICODE_DATA = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/UnicodeData.txt`;
const URL_CORE_PROPS = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/DerivedCoreProperties.txt`;
const URL_EAW = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/EastAsianWidth.txt`;
const URL_HANGUL = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/HangulSyllableType.txt`;

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
 * Parse UnicodeData.txt -> Cf (format) characters are width 0,
 * except SOFT HYPHEN (U+00AD).
 */
function parseUnicodeData(data: string): Set<number> {
  const set = new Set<number>();
  for (const line of data.split("\n")) {
    if (!line.trim()) continue;
    const fields = line.split(";");
    const cp = parseInt(fields[0], 16);
    const category = fields[2];
    if (category === "Cf" && cp !== 0x00AD) set.add(cp);
  }
  return set;
}

/**
 * Parse DerivedCoreProperties.txt -> Grapheme_Extend, Variation_Selector,
 * Default_Ignorable_Code_Point.
 */
function parseCoreProps(data: string): Set<number> {
  const set = new Set<number>();
  for (const line of data.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*(\w+)/);
    if (!match) continue;
    const start = parseInt(match[1], 16);
    const end = match[2] ? parseInt(match[2], 16) : start;
    const prop = match[3];
    if (
      prop === "Grapheme_Extend" ||
      prop === "Variation_Selector" ||
      prop === "Default_Ignorable_Code_Point"
    ) {
      for (let cp = start; cp <= end; cp++) set.add(cp);
    }
  }
  return set;
}

/**
 * Parse HangulSyllableType.txt -> Jamo V (medial) and T (final) = width 0.
 */
function parseHangulSyllableType(data: string): Set<number> {
  const set = new Set<number>();
  for (const line of data.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*(\w+)/);
    if (!match) continue;
    const start = parseInt(match[1], 16);
    const end = match[2] ? parseInt(match[2], 16) : start;
    const type = match[3];
    if (type === "V" || type === "T") {
      for (let cp = start; cp <= end; cp++) set.add(cp);
    }
  }
  return set;
}

/**
 * Parse EastAsianWidth.txt -> return Ambiguous ranges
 */
function parseEastAsianAmbiguous(data: string): [number, number][] {
  const ranges: [number, number][] = [];
  for (const line of data.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*(\w)/);
    if (!match) continue;
    const start = parseInt(match[1], 16);
    const end = match[2] ? parseInt(match[2], 16) : start;
    const cls = match[3];
    if (cls === "A") {
      ranges.push([start, end]);
    }
  }
  return ranges;
}

/**
 * Generate a sparse bitset for O(1) lookup.
 */
function generateBitset(codePoints: Set<number>): Record<number, number> {
  const map: Record<number, number> = {};
  for (const cp of codePoints) {
    const idx = cp >> 5;
    const bit = cp & 31;
    map[idx] = (map[idx] ?? 0) | (1 << bit);
  }
  return map;
}

/**
 * Main
 */
async function main() {
  console.log(`Downloading Unicode ${UNICODE_VERSION} data...`);
  const [rawUnicodeData, rawCoreProps, rawEAW, rawHangul] =
    await Promise.all([
      downloadFile(URL_UNICODE_DATA),
      downloadFile(URL_CORE_PROPS),
      downloadFile(URL_EAW),
      downloadFile(URL_HANGUL),
    ]);

  console.log("Parsing sources...");
  const cf = parseUnicodeData(rawUnicodeData);
  const core = parseCoreProps(rawCoreProps);
  const jamo = parseHangulSyllableType(rawHangul);
  const ambiguous = parseEastAsianAmbiguous(rawEAW);

  // Union of all zero-width candidates
  let all = new Set([...cf, ...core, ...jamo]);

  // Exclusions (glibc carve-outs)
  all.delete(0x00AD);
  all.delete(0x115F);
  all.delete(0x3164);
  all.delete(0xFFA0);
  for (let cp = 0xFFF9; cp <= 0xFFFB; cp++) all.delete(cp);
  for (let cp = 0x13430; cp <= 0x1343F; cp++) all.delete(cp);

  console.log(`Total zero-width code points: ${all.size}`);
  console.log(`Total ambiguous ranges: ${ambiguous.length}`);

  // === Write combining.ts ===
  const combiningMap = generateBitset(all);
  const combiningOut = [
    '/**',
    ` * Lookup function for combining/zero-width characters (Unicode ${UNICODE_VERSION}).`,
    ' *',
    ' * - Retrieves the 32-bit mask for a given Unicode block index.',
    ' * - Falls back to 0 if the block has no zero-width characters.',
    ' */',
    'export const combining = (idx: number): number => combiningMap[idx] ?? 0;',
    '',
    `export const combiningMap: Record<number, number> = ${
      JSON.stringify(combiningMap, null, 2).replaceAll('"', '')
    };\n`
  ].join("\n");

  fs.writeFileSync("combining.ts", combiningOut);
  console.log("Done! combining.ts generated.");

  // === Write ambiguous.ts ===
  function expandRanges(ranges: [number, number][]): Set<number> {
    const set = new Set<number>();
    for (const [s, e] of ranges) {
      for (let cp = s; cp <= e; cp++) set.add(cp);
    }
    return set;
  }

  const ambiguousSet = expandRanges(ambiguous);
  const ambiguousMap = generateBitset(ambiguousSet);

  const ambiguousOut = [
    '/**',
    ' * Bitset accessor for East Asian Ambiguous characters.',
    ' *',
    ' * - Uses `ambiguousMap` for sparse bitset lookups.',
    ' * - Returns 0 if a block has no ambiguous characters.',
    ' *',
    ' * @param idx Codepoint block index (ucs >> 5)',
    ' * @returns 32-bit mask of ambiguous characters for this block',
    ' */',
    `export const ambiguous = (idx: number): number => ambiguousMap[idx] ?? 0;`,
    '',
    `export const ambiguousMap: Record<number, number> = ${
      JSON.stringify(ambiguousMap, null, 2).replaceAll('"', '')
    };\n`,
  ].join('\n');

  fs.writeFileSync("ambiguous.ts", ambiguousOut);
  console.log("Done! ambiguous.ts generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
