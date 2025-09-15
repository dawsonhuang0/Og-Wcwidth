import assert from 'assert';

import {
  wcwidth,
  wcswidth,
  wcwidthCjk,
  wcswidthCjk
} from "./src/index";

const OK = '\x1b[1mOK\x1b[0m';

// =============================
// 1. Basic wcwidth
// =============================
process.stdout.write('wcwidth     ');

// Basic ASCII
assert.strictEqual(wcwidth('A'), 1);
assert.strictEqual(wcwidth('a'), 1);
assert.strictEqual(wcwidth(' '), 1);

// Controls
assert.strictEqual(wcwidth('\x07'), -1);
assert.strictEqual(wcwidth('\x7F'), -1);

// Wide
assert.strictEqual(wcwidth('一'), 2);
assert.strictEqual(wcwidth('\uFF21'), 2);

// Combining
assert.strictEqual(wcwidth('\u0300'), 0);

console.log(OK);

// =============================
// 2. wcswidth
// =============================
process.stdout.write('wcswidth    ');
assert.strictEqual(wcswidth('hello'), 5);
assert.strictEqual(wcswidth('ABC'), 3);
assert.strictEqual(wcswidth(''), 0);
assert.strictEqual(wcswidth('你好'), 4);
assert.strictEqual(wcswidth('hello\x07world'), -1);
assert.strictEqual(wcswidth('hello', 3), 3);
assert.strictEqual(wcswidth('你好世', 2), 4);
console.log(OK);

// =============================
// 3. wcwidthCjk
// =============================
process.stdout.write('wcwidthCjk  ');
assert.strictEqual(wcwidthCjk('A'), 1);
assert.strictEqual(wcwidthCjk('一'), 2);
assert.strictEqual(wcwidthCjk('¡'), 2);
assert.strictEqual(wcwidthCjk('°'), 2);
assert.strictEqual(wcwidth('¡'), 1);
assert.notEqual(wcwidthCjk('¡'), wcwidth('¡'));
console.log(OK);

// =============================
// 4. wcswidthCjk
// =============================
process.stdout.write('wcswidthCjk ');
assert.strictEqual(wcswidthCjk('hello'), 5);
assert.strictEqual(wcswidthCjk('你好'), 4);
assert.strictEqual(wcswidthCjk('°C'), 3);
assert.strictEqual(wcswidth('°C'), 2);
assert.strictEqual(wcswidthCjk('°±÷', 2), 4);
console.log(OK);

// =============================
// 5. Edge cases
// =============================
process.stdout.write('Edge cases  ');
assert.strictEqual(wcwidth('\x00'.slice(1)), -1);
assert.strictEqual(wcwidth('\x00'), 0);
assert.strictEqual(wcwidthCjk('\x00'), 0);
assert.strictEqual(wcwidth('\x1F'), -1);
assert.strictEqual(wcwidth('\x9F'), -1);
assert.strictEqual(wcwidth('\xAD'), 1);
assert.strictEqual(wcwidth('\u200B'), 0);
assert.strictEqual(wcwidth('\u1160'), 0);
assert.strictEqual(wcwidth('\u3000'), 2);
assert.strictEqual(wcwidth('\u{10FFFF}'), 1);
assert.strictEqual(wcswidth('', 0), 0);
assert.strictEqual(wcswidth('test', 0), 0);
console.log(OK);

// =============================
// 6. glibc-ext conformance
// =============================
process.stdout.write('glibc-ext   ');
assert.strictEqual(wcwidth('\u{E0100}'), 0);
assert.strictEqual(wcwidth('\u{E01EF}'), 0);
assert.strictEqual(wcwidth('\u2060'), 0);
assert.strictEqual(wcwidth('\uFEFF'), 0);
assert.strictEqual(wcwidth('\uFE13'), 2);
assert.strictEqual(wcwidth('\u{20000}'), 2);
assert.strictEqual(wcwidth('\u{2FFFD}'), 2);
assert.strictEqual(wcwidthCjk('Ω'), 2);
assert.strictEqual(wcwidth('Ω'), 1);
assert.strictEqual(wcwidth('\u115F'), 2);
assert.strictEqual(wcwidth('\u3164'), 1);
const seq = 'a\u0300\u{E0100}一';
assert.strictEqual(wcswidth(seq), [...seq].reduce((s, c) => s + wcwidth(c), 0));
console.log(OK);

// =============================
// 7. glibc-paranoid tests
// =============================
process.stdout.write('glibc-par   ');
assert.strictEqual(wcwidth('\u2E80'), 2);
assert.strictEqual(wcwidth('\uA4CF'), 2);
assert.strictEqual(wcwidth('\u303F'), 1);
assert.strictEqual(wcwidth('\uFF01'), 2);
assert.strictEqual(wcwidth('\uFF60'), 2);
assert.strictEqual(wcwidth('\uFFE6'), 2);
assert.strictEqual(wcwidth('\u{30000}'), 2);
assert.strictEqual(wcwidth('\u{3FFFD}'), 2);
assert.strictEqual(wcwidth('\uFDD0'), 1);
assert.strictEqual(wcwidth('\uFFFF'), 1);
assert.strictEqual(wcwidth('\u{10FFFF}'), 1);
assert.strictEqual(wcwidth('\u2064'), 0);
assert.strictEqual(wcwidth('\uFFF9'), 1);
assert.strictEqual(wcwidth('\u{13430}'), 1);
assert.strictEqual(wcwidth('\u{1343F}'), 1);
console.log(OK);

// =============================
// 8. glibc carve-outs
// =============================
process.stdout.write('glibc-carve ');
assert.strictEqual(wcwidth('\u00AD'), 1);
assert.strictEqual(wcwidth('\u115F'), 2);
assert.strictEqual(wcwidth('\u3164'), 1);
assert.strictEqual(wcwidth('\uFFA0'), 1);
for (let cp = 0x13430; cp <= 0x1343F; cp++) {
  assert.strictEqual(wcwidth(String.fromCodePoint(cp)), 1);
}
console.log(OK);

// =============================
// 9. ignoreables
// =============================
process.stdout.write('ignoreables ');
assert.strictEqual(wcwidth('\u2060'), 0);
assert.strictEqual(wcwidth('\uFEFF'), 0);
assert.strictEqual(wcwidth('\uFE00'), 0);
assert.strictEqual(wcwidth('\u{E0100}'), 0);
console.log(OK);

// =============================
// 10. glibc-full regression
// =============================
process.stdout.write('glibc-full  ');

// Carve-outs (glibc exceptions that must NOT be zero-width)
const carveOuts: Record<number, number> = {
  0x00AD: 1, // Soft hyphen
  0x115F: 2, // Hangul Choseong Filler
  0x3164: 1, // Hangul Filler
  0xFFA0: 1, // Halfwidth Hangul Filler
};
for (const [cp, expected] of Object.entries(carveOuts)) {
  assert.strictEqual(
    wcwidth(String.fromCodePoint(Number(cp))),
    expected,
    `Carve-out U+${Number(cp).toString(16).toUpperCase()} must be width ${expected}`
  );
}

// Non-ignored format controls (glibc override -> width 1)
for (let cp = 0xFFF9; cp <= 0xFFFB; cp++) {
  assert.strictEqual(
    wcwidth(String.fromCodePoint(cp)),
    1,
    `Interlinear annotation U+${cp.toString(16).toUpperCase()} must be width 1`
  );
}

// Positive zero-width checks (must remain 0)
for (const cp of [0x0300, 0x200B, 0x2060, 0xFE00, 0xE0100, 0xFEFF]) {
  assert.strictEqual(
    wcwidth(String.fromCodePoint(cp)),
    0,
    `Zero-width U+${cp.toString(16).toUpperCase()} must be width 0`
  );
}

// Optional BMP sweep: every result must be -1, 0, 1, or 2
if (process.env.CHECK_SWEEP) {
  for (let cp = 0; cp <= 0xFFFF; cp++) {
    const w = wcwidth(String.fromCodePoint(cp));
    assert.ok(
      [-1, 0, 1, 2].includes(w),
      `Unexpected width ${w} for U+${cp.toString(16).toUpperCase()}`
    );
  }
}

// Optional astral sweep
if (process.env.CHECK_ASTRAL) {
  // Variation Selectors Supplement -> width 0
  for (let cp = 0xE0100; cp <= 0xE01EF; cp++) {
    assert.strictEqual(
      wcwidth(String.fromCodePoint(cp)),
      0,
      `Astral variation selector U+${cp.toString(16).toUpperCase()} must be width 0`
    );
  }

  // CJK Ext B spot checks -> width 2
  for (const cp of [0x20000, 0x21000, 0x22000, 0x2FFFD]) {
    assert.strictEqual(
      wcwidth(String.fromCodePoint(cp)),
      2,
      `CJK Ext B U+${cp.toString(16).toUpperCase()} must be width 2`
    );
  }

  // Emoji spot checks -> width 2
  assert.strictEqual(wcwidth('\u{1F1E6}'), 2, 'Regional indicator (U+1F1E6) must be width 2');
  assert.strictEqual(wcwidth('\u{1F600}'), 2, 'Emoji grinning face (U+1F600) must be width 2');
}
console.log(OK);

console.log('🎉 All tests passed!');
