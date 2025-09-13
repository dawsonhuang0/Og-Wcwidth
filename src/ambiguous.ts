/**
 * Bitset accessor for East Asian Ambiguous characters.
 *
 * - Uses `ambiguousMap` for sparse bitset lookups.
 * - Handles large continuous ranges with inline checks to reduce table size.
 *
 * @param idx Codepoint block index (ucs >> 5)
 * @returns 32-bit mask of ambiguous characters for this block, or -1 for
 *          special-case ranges not stored in the map.
 */
export function ambiguous(idx: number): number {
  return (
    idx === 33 ||
    (291 <= idx && idx <= 297 && idx !== 295) ||
    (1792 <= idx && idx <= 1991) ||
    (30720 <= idx && idx <= 34814 && idx !== 32767)
  ) ? -1 : (ambiguousMap[idx] ?? 0);
}

const ambiguousMap: Record<number, number> = {
  5: -136362606,
  6: -1048510400,
  7: 1468872515,
  8: 134873090,
  9: -2129786688,
  10: 798487,
  11: 2240,
  14: 357908480,
  18: 131072,
  19: 2,
  22: -1358877040,
  28: -131072,
  29: -130053,
  30: 1019,
  32: -65534,
  34: 196607,
  256: 863567872,
  257: 1210908919,
  259: -2146435072,
  260: 30,
  261: 4096,
  264: 4719144,
  265: 2118,
  266: 2014838784,
  267: 67047423,
  268: 67043328,
  269: 50331648,
  270: 1310720,
  271: 128,
  272: -467498611,
  273: 821059497,
  274: 266496,
  275: 52467,
  276: 35651788,
  277: -2147483616,
  280: 262144,
  295: -1025,
  298: -61441,
  299: 1048575,
  300: 3997695,
  301: 818676731,
  302: 248259,
  303: 32828,
  304: 1345372768,
  306: 5,
  307: 47035,
  313: 536870912,
  315: -4194304,
  2047: 536870912,
  32767: 1073741823,
  34815: 1073741823
}
