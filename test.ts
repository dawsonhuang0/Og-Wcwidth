import assert from 'assert';

import {
  wcwidth,
  wcswidth,
  wcwidthCjk,
  wcswidthCjk
} from "./src/index";

const OK = '\x1b[1mOK\x1b[0m';

// Test wcwidth function
process.stdout.write('wcwidth     ');

// Basic ASCII characters (width 1)
assert.strictEqual(wcwidth('A'), 1, 'ASCII "A" should have width 1');
assert.strictEqual(wcwidth('a'), 1, 'ASCII "a" should have width 1');
assert.strictEqual(wcwidth(' '), 1, 'Space should have width 1');

// Control characters (width -1)
assert.strictEqual(wcwidth('\x07'), -1, 'Bell character should have width -1');
assert.strictEqual(wcwidth('\x7F'), -1, 'DEL character should have width -1');

// Wide characters (width 2)
assert.strictEqual(wcwidth('一'), 2, 'CJK character should have width 2');
assert.strictEqual(wcwidth('\uFF21'), 2, 'Fullwidth "A" should have width 2');

// Combining characters (width 0)
assert.strictEqual(wcwidth('\u0300'), 0, 'Combining grave accent should have width 0');

console.log(OK);

// Test wcswidth function
process.stdout.write('wcswidth    ');

// Basic strings
assert.strictEqual(wcswidth('hello'), 5, '"hello" should have width 5');
assert.strictEqual(wcswidth('ABC'), 3, '"ABC" should have width 3');
assert.strictEqual(wcswidth(''), 0, 'Empty string should have width 0');

// String with wide characters
assert.strictEqual(wcswidth('你好'), 4, 'Chinese "你好" should have width 4');

// String with control characters (should return -1)
assert.strictEqual(wcswidth('hello\x07world'), -1, 'String with control char should return -1');

// Test with length limit
assert.strictEqual(wcswidth('hello', 3), 3, '"hello" limited to 3 chars should have width 3');
assert.strictEqual(wcswidth('你好世', 2), 4, 'Chinese limited to 2 chars should have width 4');

console.log(OK);

// Test wcwidthCjk function
process.stdout.write('wcwidthCjk  ');

// Basic ASCII (same as wcwidth)
assert.strictEqual(wcwidthCjk('A'), 1, 'ASCII "A" should have width 1 in CJK mode');

// Wide characters (same as wcwidth)
assert.strictEqual(wcwidthCjk('一'), 2, 'CJK character should have width 2 in CJK mode');

// Ambiguous characters (different from wcwidth - should be width 2)
assert.strictEqual(wcwidthCjk('¡'), 2, 'Inverted exclamation should have width 2 in CJK mode');
assert.strictEqual(wcwidthCjk('°'), 2, 'Degree sign should have width 2 in CJK mode');

// Compare with regular wcwidth for ambiguous chars
assert.strictEqual(wcwidth('¡'), 1, 'Inverted exclamation should have width 1 in regular mode');
assert.notEqual(wcwidthCjk('¡'), wcwidth('¡'), 'CJK and regular should differ for ambiguous chars');

console.log(OK);

// Test wcswidthCjk function
process.stdout.write('wcswidthCjk ');

// Basic strings (same as wcswidth)
assert.strictEqual(wcswidthCjk('hello'), 5, '"hello" should have width 5 in CJK mode');
assert.strictEqual(wcswidthCjk('你好'), 4, 'Chinese should have width 4 in CJK mode');

// Strings with ambiguous characters
assert.strictEqual(wcswidthCjk('°C'), 3, '"°C" should have width 3 in CJK mode');
assert.strictEqual(wcswidth('°C'), 2, '"°C" should have width 2 in regular mode (degree is width 1)');

// With length limit
assert.strictEqual(wcswidthCjk('°±÷', 2), 4, 'Ambiguous chars limited to 2 should have width 4 in CJK mode');

console.log(OK);

// Edge cases and error conditions
process.stdout.write('Edge cases  ');

// Invalid code points
assert.strictEqual(wcwidth('\x00'.slice(1)), -1, 'Negative code point should return -1 (invalid)');

// Null char
assert.strictEqual(wcwidth('\x00'), 0, 'Null should be width 0');
assert.strictEqual(wcwidthCjk('\x00'), 0, 'Null should have width 0 in CJK mode');

// Control characters
assert.strictEqual(wcwidth('\x1F'), -1, 'Unit separator should be -1');
assert.strictEqual(wcwidth('\x9F'), -1, 'C1 control should be -1');

// Soft hyphen
assert.strictEqual(wcwidth('\xAD'), 1, 'Soft hyphen should be width 1');

// Zero width space
assert.strictEqual(wcwidth('\u200B'), 0, 'Zero width space should be width 0');

// Hangul Jamo medial vowel
assert.strictEqual(wcwidth('\u1160'), 0, 'Hangul Jamo medial vowel should be width 0');

// Wide characters check
assert.strictEqual(wcwidth('\u3000'), 2, 'Ideographic space should be width 2');

// Very large code points
assert.strictEqual(wcwidth('\u{10FFFF}'), 1, 'Max Unicode code point should have width 1');

// Empty string edge cases
assert.strictEqual(wcswidth('', 0), 0, 'Empty string with limit 0 should return 0');
assert.strictEqual(wcswidth('test', 0), 0, 'Any string with limit 0 should return 0');

console.log(OK);

// Extreme Unicode / glibc WIDTH conformance
process.stdout.write('glibc-ext   ');

// Astral combining marks (Variation Selectors Supplement)
assert.strictEqual(wcwidth('\u{E0100}'), 0, 'Variation Selector-17 (astral) should be width 0');
assert.strictEqual(wcwidth('\u{E01EF}'), 0, 'Variation Selector-256 (astral) should be width 0');

// Default ignorable code points
assert.strictEqual(wcwidth('\u2060'), 0, 'Word Joiner should be width 0');
assert.strictEqual(wcwidth('\uFEFF'), 0, 'Zero Width No-Break Space should be width 0');

// East Asian Wide/Fullwidth ranges
assert.strictEqual(wcwidth('\uFE13'), 2, 'Presentation form (U+FE13) should be width 2');
assert.strictEqual(wcwidth('\u{20000}'), 2, 'CJK Extension B (U+20000) should be width 2');
assert.strictEqual(wcwidth('\u{2FFFD}'), 2, 'Last CJK Extension B (U+2FFFD) should be width 2');

// East Asian Ambiguous
assert.strictEqual(wcwidthCjk('Ω'), 2, 'Greek Omega should be width 2 in CJK mode');
assert.strictEqual(wcwidth('Ω'), 1, 'Greek Omega should be width 1 in regular mode');
assert.notEqual(wcwidthCjk('Ω'), wcwidth('Ω'), 'CJK and regular should differ for Omega');

// Hangul edge cases
assert.strictEqual(wcwidth('\u115F'), 2, 'Hangul Choseong Filler (U+115F) should be width 2');
assert.strictEqual(wcwidth('\u3164'), 1, 'Hangul Filler (U+3164) should be width 1');

// Consistency: wcswidth = sum of wcwidth
const seq = 'a\u0300\u{E0100}一'; // "a" + combining grave + astral selector + CJK
let sum = 0;
for (const c of seq) sum += wcwidth(c);
assert.strictEqual(wcswidth(seq), sum, 'wcswidth should equal sum of wcwidth per codepoint');

console.log(OK);

// Paranoid boundary + noncharacter tests
process.stdout.write('glibc-par   ');

// --- Range edge tests ---

// CJK block starts at U+2E80, ends at U+A4CF (except U+303F)
assert.strictEqual(wcwidth('\u2E80'), 2, 'U+2E80 (CJK Radicals) should be width 2');
assert.strictEqual(wcwidth('\uA4CF'), 2, 'U+A4CF (Yi Radicals end) should be width 2');
assert.strictEqual(wcwidth('\u303F'), 1, 'U+303F (CJK Half Fill Space) is exception width 1');

// Fullwidth/compatibility forms
assert.strictEqual(wcwidth('\uFF01'), 2, 'U+FF01 (Fullwidth Exclamation) should be width 2');
assert.strictEqual(wcwidth('\uFF60'), 2, 'U+FF60 (Fullwidth Right White Parenthesis) should be width 2');
assert.strictEqual(wcwidth('\uFFE6'), 2, 'U+FFE6 (Fullwidth Won Sign) should be width 2');

// Astral CJK Extension B range
assert.strictEqual(wcwidth('\u{20000}'), 2, 'U+20000 (CJK Ext B start) should be width 2');
assert.strictEqual(wcwidth('\u{2FFFD}'), 2, 'U+2FFFD (CJK Ext B end) should be width 2');

// Astral CJK Extension C/D/E/F ranges (spot check starts)
assert.strictEqual(wcwidth('\u{30000}'), 2, 'U+30000 (CJK Ext G start) should be width 2');
assert.strictEqual(wcwidth('\u{3FFFD}'), 2, 'U+3FFFD (CJK Ext G end) should be width 2');

// --- Noncharacters ---

// Plane 0 noncharacters
assert.strictEqual(wcwidth('\uFDD0'), 1, 'U+FDD0 noncharacter should be width 1');
assert.strictEqual(wcwidth('\uFDEF'), 1, 'U+FDEF noncharacter should be width 1');
assert.strictEqual(wcwidth('\uFFFE'), 1, 'U+FFFE noncharacter should be width 1');
assert.strictEqual(wcwidth('\uFFFF'), 1, 'U+FFFF noncharacter should be width 1');

// Plane 1 noncharacters
assert.strictEqual(wcwidth('\u{1FFFE}'), 1, 'U+1FFFE noncharacter should be width 1');
assert.strictEqual(wcwidth('\u{1FFFF}'), 1, 'U+1FFFF noncharacter should be width 1');

// Last plane noncharacters
assert.strictEqual(wcwidth('\u{10FFFE}'), 1, 'U+10FFFE noncharacter should be width 1');
assert.strictEqual(wcwidth('\u{10FFFF}'), 1, 'U+10FFFF noncharacter should be width 1');

// --- Random ignorable sanity checks ---
assert.strictEqual(wcwidth('\u2064'), 0, 'U+2064 INVISIBLE PLUS should be width 0');
assert.strictEqual(wcwidth('\uFFF9'), 0, 'U+FFF9 INTERLINEAR ANNOTATION ANCHOR should be width 0');

console.log(OK);

console.log('🎉 All tests passed!');
