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
 */

import { combining } from "./combining";

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

  // binary search in table of non-spacing characters
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

  let width = 0;
  let count = 0;

  for (const char of str) {
    if (n !== undefined && count >= n) break;

    const w = wcwidth(char);
    if (w < 0) return -1;

    width += w;
    count++;
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
  /* sorted list of non-overlapping intervals of East Asian Ambiguous
   * characters, generated by "uniset +WIDTH-A -cat=Me -cat=Mn -cat=Cf c" */
  const ambiguous: number[][] = [
    [ 0x00A1, 0x00A1 ], [ 0x00A4, 0x00A4 ], [ 0x00A7, 0x00A8 ],
    [ 0x00AA, 0x00AA ], [ 0x00AE, 0x00AE ], [ 0x00B0, 0x00B4 ],
    [ 0x00B6, 0x00BA ], [ 0x00BC, 0x00BF ], [ 0x00C6, 0x00C6 ],
    [ 0x00D0, 0x00D0 ], [ 0x00D7, 0x00D8 ], [ 0x00DE, 0x00E1 ],
    [ 0x00E6, 0x00E6 ], [ 0x00E8, 0x00EA ], [ 0x00EC, 0x00ED ],
    [ 0x00F0, 0x00F0 ], [ 0x00F2, 0x00F3 ], [ 0x00F7, 0x00FA ],
    [ 0x00FC, 0x00FC ], [ 0x00FE, 0x00FE ], [ 0x0101, 0x0101 ],
    [ 0x0111, 0x0111 ], [ 0x0113, 0x0113 ], [ 0x011B, 0x011B ],
    [ 0x0126, 0x0127 ], [ 0x012B, 0x012B ], [ 0x0131, 0x0133 ],
    [ 0x0138, 0x0138 ], [ 0x013F, 0x0142 ], [ 0x0144, 0x0144 ],
    [ 0x0148, 0x014B ], [ 0x014D, 0x014D ], [ 0x0152, 0x0153 ],
    [ 0x0166, 0x0167 ], [ 0x016B, 0x016B ], [ 0x01CE, 0x01CE ],
    [ 0x01D0, 0x01D0 ], [ 0x01D2, 0x01D2 ], [ 0x01D4, 0x01D4 ],
    [ 0x01D6, 0x01D6 ], [ 0x01D8, 0x01D8 ], [ 0x01DA, 0x01DA ],
    [ 0x01DC, 0x01DC ], [ 0x0251, 0x0251 ], [ 0x0261, 0x0261 ],
    [ 0x02C4, 0x02C4 ], [ 0x02C7, 0x02C7 ], [ 0x02C9, 0x02CB ],
    [ 0x02CD, 0x02CD ], [ 0x02D0, 0x02D0 ], [ 0x02D8, 0x02DB ],
    [ 0x02DD, 0x02DD ], [ 0x02DF, 0x02DF ], [ 0x0391, 0x03A1 ],
    [ 0x03A3, 0x03A9 ], [ 0x03B1, 0x03C1 ], [ 0x03C3, 0x03C9 ],
    [ 0x0401, 0x0401 ], [ 0x0410, 0x044F ], [ 0x0451, 0x0451 ],
    [ 0x2010, 0x2010 ], [ 0x2013, 0x2016 ], [ 0x2018, 0x2019 ],
    [ 0x201C, 0x201D ], [ 0x2020, 0x2022 ], [ 0x2024, 0x2027 ],
    [ 0x2030, 0x2030 ], [ 0x2032, 0x2033 ], [ 0x2035, 0x2035 ],
    [ 0x203B, 0x203B ], [ 0x203E, 0x203E ], [ 0x2074, 0x2074 ],
    [ 0x207F, 0x207F ], [ 0x2081, 0x2084 ], [ 0x20AC, 0x20AC ],
    [ 0x2103, 0x2103 ], [ 0x2105, 0x2105 ], [ 0x2109, 0x2109 ],
    [ 0x2113, 0x2113 ], [ 0x2116, 0x2116 ], [ 0x2121, 0x2122 ],
    [ 0x2126, 0x2126 ], [ 0x212B, 0x212B ], [ 0x2153, 0x2154 ],
    [ 0x215B, 0x215E ], [ 0x2160, 0x216B ], [ 0x2170, 0x2179 ],
    [ 0x2190, 0x2199 ], [ 0x21B8, 0x21B9 ], [ 0x21D2, 0x21D2 ],
    [ 0x21D4, 0x21D4 ], [ 0x21E7, 0x21E7 ], [ 0x2200, 0x2200 ],
    [ 0x2202, 0x2203 ], [ 0x2207, 0x2208 ], [ 0x220B, 0x220B ],
    [ 0x220F, 0x220F ], [ 0x2211, 0x2211 ], [ 0x2215, 0x2215 ],
    [ 0x221A, 0x221A ], [ 0x221D, 0x2220 ], [ 0x2223, 0x2223 ],
    [ 0x2225, 0x2225 ], [ 0x2227, 0x222C ], [ 0x222E, 0x222E ],
    [ 0x2234, 0x2237 ], [ 0x223C, 0x223D ], [ 0x2248, 0x2248 ],
    [ 0x224C, 0x224C ], [ 0x2252, 0x2252 ], [ 0x2260, 0x2261 ],
    [ 0x2264, 0x2267 ], [ 0x226A, 0x226B ], [ 0x226E, 0x226F ],
    [ 0x2282, 0x2283 ], [ 0x2286, 0x2287 ], [ 0x2295, 0x2295 ],
    [ 0x2299, 0x2299 ], [ 0x22A5, 0x22A5 ], [ 0x22BF, 0x22BF ],
    [ 0x2312, 0x2312 ], [ 0x2460, 0x24E9 ], [ 0x24EB, 0x254B ],
    [ 0x2550, 0x2573 ], [ 0x2580, 0x258F ], [ 0x2592, 0x2595 ],
    [ 0x25A0, 0x25A1 ], [ 0x25A3, 0x25A9 ], [ 0x25B2, 0x25B3 ],
    [ 0x25B6, 0x25B7 ], [ 0x25BC, 0x25BD ], [ 0x25C0, 0x25C1 ],
    [ 0x25C6, 0x25C8 ], [ 0x25CB, 0x25CB ], [ 0x25CE, 0x25D1 ],
    [ 0x25E2, 0x25E5 ], [ 0x25EF, 0x25EF ], [ 0x2605, 0x2606 ],
    [ 0x2609, 0x2609 ], [ 0x260E, 0x260F ], [ 0x2614, 0x2615 ],
    [ 0x261C, 0x261C ], [ 0x261E, 0x261E ], [ 0x2640, 0x2640 ],
    [ 0x2642, 0x2642 ], [ 0x2660, 0x2661 ], [ 0x2663, 0x2665 ],
    [ 0x2667, 0x266A ], [ 0x266C, 0x266D ], [ 0x266F, 0x266F ],
    [ 0x273D, 0x273D ], [ 0x2776, 0x277F ], [ 0xE000, 0xF8FF ],
    [ 0xFFFD, 0xFFFD ], [ 0xF0000, 0xFFFFD ], [ 0x100000, 0x10FFFD ]
  ];

  const ucs = char.codePointAt(0);

  // invalid character
  if (ucs === undefined)
    return -1;

  // binary search in table of non-spacing characters
  if (bisearch(ucs, ambiguous))
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

  let width = 0;
  let count = 0;

  for (const char of str) {
    if (n !== undefined && count >= n) break;

    const w = wcwidthCjk(char);
    if (w < 0) return -1;

    width += w;
    count++;
  }

  return width;
}

/* auxiliary function for binary search in interval table */
function bisearch(ucs: number, table: number[][]): number {
  let min = 0;
  let max = table.length - 1;

  if (ucs < table[min][0] || ucs > table[max][1])
    return 0;

  while (max >= min) {
    const mid = Math.floor((min + max) / 2);
    if (ucs > table[mid][1])
      min = mid + 1;
    else if (ucs < table[mid][0])
      max = mid - 1;
    else
      return 1;
  }

  return 0;
}

export default wcwidth;

module.exports = wcwidth;
module.exports.default = wcwidth;

module.exports.wcwidth = wcwidth;
module.exports.wcswidth = wcswidth;
module.exports.wcwidthCjk = wcwidthCjk;
module.exports.wcswidthCjk = wcswidthCjk;
