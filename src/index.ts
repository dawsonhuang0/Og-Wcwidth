/*
 * Markus Kuhn -- 2007-05-26 (Unicode 5.0)
 *
 * Permission to use, copy, modify, and distribute this software
 * for any purpose and without fee is hereby granted. The author
 * disclaims all warranties with regard to this software.
 *
 * Latest version: http://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c
 * 
 * ----------------------------------------------------------------------------
 * 
 * Dawson Huang -- 11 Sep 2025
 * Translated wcwidth implementation from C to TypeScript.
 * 
 * Dawson Huang -- 13 Sep 2025
 * - Optimized wcwidth and wcswidth implementation by adopting bitset lookup.
 * - Extended combining ranges to full Unicode 15.1 coverage.
 *
 * Dawson Huang -- 16 Sep 2025
 * Extended combining and ambiguous ranges to full Unicode 17.0 coverage.
 */

import { combining } from "./combining";
import { ambiguous } from "./ambiguous";

/* The following two functions define the column width of an ISO 10646
 * character as follows:
 *
 *    - The null character (U+0000) has a column width of 0.
 *
 *    - Other C0/C1 control characters and DEL will lead to a return
 *      value of -1.
 *
 *    - Non-spacing and enclosing combining characters (general
 *      category code Mn or Me in the Unicode database) have a
 *      column width of 0.
 *
 *    - SOFT HYPHEN (U+00AD) has a column width of 1.
 *
 *    - Other format characters (general category code Cf in the Unicode
 *      database) and ZERO WIDTH SPACE (U+200B) have a column width of 0.
 *
 *    - Hangul Jamo medial vowels and final consonants (U+1160-U+11FF)
 *      have a column width of 0.
 *
 *    - Spacing characters in the East Asian Wide (W) or East Asian
 *      Full-width (F) category as defined in Unicode Technical
 *      Report #11 have a column width of 2.
 *
 *    - All remaining characters (including all printable
 *      ISO 8859-1 and WGL4 characters, Unicode control characters,
 *      etc.) have a column width of 1.
 *
 * This implementation assumes that JavaScript strings are valid UTF-16
 * and code points are obtained via `String.prototype.codePointAt`.
 */

/**
 * Determines the display width of a Unicode code point.
 *
 * - Returns `0`, `1`, or `2` based on Unicode width rules.
 * - Returns `-1` for control characters or invalid cases.
 *
 * @param char - A single-character string to measure.
 * @returns The display width of `ucs` in terminal columns.
 */
export function wcwidth(char: string): number {
  const ucs = char.codePointAt(0);

  // invalid character
  if (ucs === undefined)
    return -1;

  // test for 8-bit control characters
  if (ucs === 0)
    return 0;
  if (ucs < 32 || (ucs >= 0x7f && ucs < 0xa0))
    return -1;

  // bitset lookup for non-spacing characters
  const isCombining = (ucs: number): boolean =>
    ucs <= 0x10ffff && ((combining(ucs >> 5) >>> (ucs & 31)) & 1) !== 0;

  if (isCombining(ucs))
    return 0;

  // if we arrive here, ucs is not a combining or C0/C1 control character

  // ucs is still in combining
  if (ucs < 0x1100)
    return 1;

  // Hangul Jamo init. consonants
  if (ucs <= 0x115f || ucs === 0x2329 || ucs === 0x232a)
    return 2;

  // Hangul Filler
  if (ucs === 0x3164)
    return 1;

  // CJK ... Yi
  if (ucs >= 0x2e80 && ucs <= 0xa4cf && ucs !== 0x303f)
    return 2;

  return (
    // Hangul Syllables
    (0xac00 <= ucs && ucs <= 0xd7a3) ||

    // CJK Compatibility Ideographs
    (0xf900 <= ucs && ucs <= 0xfaff) ||

    // Vertical forms
    (0xfe10 <= ucs && ucs <= 0xfe19) ||

    // CJK Compatibility Forms
    (0xfe30 <= ucs && ucs <= 0xfe6f) ||

    // Fullwidth Forms
    (0xff00 <= ucs && ucs <= 0xff60) ||
    (0xffe0 <= ucs && ucs <= 0xffe6) ||
    (0x20000 <= ucs && ucs <= 0x2fffd) ||
    (0x30000 <= ucs && ucs <= 0x3fffd)
  ) ? 2 : 1;
}

/**
 * Computes the display width of a Unicode string up to `n` characters.
 *
 * - Iterates code points and sums their widths using `wcwidth`.
 * - Returns `-1` if any code point has undefined width.
 *
 * @param str - Input string to evaluate.
 * @param n - Max characters to process (defaults to full length).
 * @returns The total display width in terminal columns.
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

/*
 * The following functions are the same as wcwidth() and
 * wcswidth(), except that spacing characters in the East Asian
 * Ambiguous (A) category as defined in Unicode Technical Report #11
 * have a column width of 2. This variant might be useful for users of
 * CJK legacy encodings who want to migrate to UCS without changing
 * the traditional terminal character-width behaviour. It is not
 * otherwise recommended for general use.
 */

/**
 * Computes the column width of a Unicode code point (CJK variant).
 * 
 * - Useful for CJK legacy environments; not recommended for general use.
 * - Same rules as {@link wcwidth}, except East Asian Ambiguous (A) characters
 *   are treated as width 2 (per Unicode TR#11).
 * - Returns `0`, `1`, or `2` depending on the character.
 * - Returns `-1` for control or undefined characters.
 *
 * @param char - A single-character string to measure.
 * @returns Column width in terminal cells, or -1 on error.
 */
export function wcwidthCjk(char: string): number {
  const ucs = char.codePointAt(0);

  // invalid character
  if (ucs === undefined)
    return -1;

  // bitset lookup for non-spacing characters
  const isAmbiguous = (ucs: number): boolean =>
    ucs <= 0x10ffff && ((ambiguous(ucs >> 5) >>> (ucs & 31)) & 1) !== 0;

  if (isAmbiguous(ucs))
    return 2;

  return wcwidth(char);
}

/**
 * Computes the display width of a Unicode string (CJK variant).
 *
 * - Useful for CJK legacy environments; not recommended for general use.
 * - Same rules as {@link wcswidth}, except East Asian Ambiguous (A) characters
 *   are treated as width 2 (per Unicode TR#11).
 * - Returns `-1` if any character in the string is invalid or a control code.
 *
 * @param str - Input string to evaluate.
 * @param n - Max characters to process (defaults to full length).
 * @returns Total display width in terminal cells, or -1 on error.
 */
export function wcswidthCjk(str: string, n?: number): number {
  if (!str) return 0;

  const chars = Array.from(str);
  let width = 0;

  for (let i = 0; i < chars.length; i++) {
    if (n !== undefined && i >= n) break;

    const w = wcwidthCjk(chars[i]);
    if (w < 0) return -1;

    width += w;
  }

  return width;
}

export default wcwidth;

module.exports = wcwidth;
module.exports.default = wcwidth;

module.exports.wcwidth = wcwidth;
module.exports.wcswidth = wcswidth;
module.exports.wcwidthCjk = wcwidthCjk;
module.exports.wcswidthCjk = wcswidthCjk;
