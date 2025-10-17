import { TABLE } from "./table";

/**
 * Determine number of column positions required for CH.
 * 
 * - Accepts a single Unicode character as input.
 *
 * @param char A single Unicode character.
 * @returns Width of the character: 0, 1, 2, or -1 if not printable.
 */
export function wcwidth(char: string): number {
  const cp = char.codePointAt(0);
  if (cp === undefined) return -1;

  const res = wcwidthTableLookup(cp);
  return res === 0xFF ? -1 : res;
}

/**
 * Determine number of column positions required for first N wide characters 
 * (or fewer if S ends before this) in S.
 * 
 * - Stops early and returns -1 if any character is non-printable.
 * - If `n` is given, only the first `n` characters are considered.
 *
 * @param str Input string to measure.
 * @param n Optional maximum number of characters to process.
 * @returns Total display width or -1 if any character is unprintable.
 */
export function wcswidth(str: string, n?: number): number {
  if (!str) return 0;

  const chars = Array.from(str);
  let width = 0;

  for (let i = 0; i < chars.length; i++) {
    if (n !== undefined && i >= n) break;

    const w = wcwidth(chars[i]);
    if (w < 0) return -1;

    width += w;
  }

  return width;
}

/**
 * Low-level lookup for wcwidth.
 * 
 * @param cp Unicode code point (0–0x10FFFF)
 * @returns 0, 1, 2 if valid, else 0xFF
 */
function wcwidthTableLookup(cp: number): number {
  const view = new DataView(TABLE.buffer, TABLE.byteOffset, TABLE.byteLength);

  const shift1 = view.getUint32(0, true);
  const bound = view.getUint32(4, true);

  const index1 = cp >>> shift1;
  if (index1 >= bound) return 0xFF;

  const lookup1 = view.getUint32(20 + index1 * 4, true);
  if (!lookup1) return 0xFF;

  const shift2 = view.getUint32(8, true);
  const mask2 = view.getUint32(12, true);
  const index2 = (cp >>> shift2) & mask2;

  const lookup2 = view.getUint32(lookup1 + index2 * 4, true);
  if (!lookup2) return 0xFF;

  const mask3 = view.getUint32(16, true);
  const index3 = cp & mask3;
  const lookup3 = TABLE[lookup2 + index3];

  return lookup3;
}

export default wcwidth;

module.exports = wcwidth;
module.exports.default = wcwidth;

module.exports.wcwidth = wcwidth;
module.exports.wcswidth = wcswidth;
