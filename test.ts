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

console.log('🎉 All tests passed!');
