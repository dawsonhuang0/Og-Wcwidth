# Wcwidth-O1

[![npm](https://img.shields.io/npm/v/wcwidth-o1.svg)](https://www.npmjs.com/package/wcwidth-o1)

A TypeScript/JavaScript port of Markus Kuhn’s **wcwidth** and **wcswidth** 
implementations, optimized to O(1).  
These functions are defined in IEEE Std 1003.1 (POSIX).

### Superior Performance
- ⚡️ Instant *O*(1) lookup time
- 🌏 Full Unicode 17.0 coverage

### References:
- [OpenGroup wcwidth()](http://www.opengroup.org/onlinepubs/007904975/functions/wcwidth.html)  
- [OpenGroup wcswidth()](http://www.opengroup.org/onlinepubs/007904975/functions/wcswidth.html)


## Getting Started

Install Wcwidth-O1 via npm:

```bash
npm i wcwidth-o1
```


## Usage

<h3>JavaScript / TypeScript:</h3>

```ts
import wcwidth from 'wcwidth-o1';

const example1 = wcwidth('a'); // 1
const example2 = wcwidth('好'); // 2
const example3 = wcwidth('😊'); // 2
```

or

```ts
import { wcwidth, wcswidth, wcswidthCjk } from 'wcwidth-o1';

const example = wcwidth('a'); // 1

const example1 = wcswidth('hi'); // 2
const example2 = wcswidth('안녕하세요'); // 10
const example3 = wcswidth('😊こんにちは'); // 12

const example4 = wcswidthCjk('°C'); // 3
```

### Function Parameters:

**wcwidth()**, **wcwidthCjk()**:
- `char`: A single-character string to measure.

**wcswidth()**, **wcswidthCjk()**:
- `str`: Input string to evaluate.
- `n`: Max characters to process (defaults to full length).


## Updating Unicode Data

When a new Unicode version is released, the `ambiguous` and `combining` lookup bitsets must be regenerated.

### 1. Generate new bitsets

```bash
npx tsx unicode/generateBitset.ts
```

This will produce updated `ambiguous.ts` and `combining.ts` files under `unicode/`.

### 2. Optimize repetitive masks

Example of unoptimized output:

```ts
export const ambiguous = (idx: number): number => ambiguousMap[idx] ?? 0;

const map: Record<number, number> = {
  1: 2947937,
  2: -1,
  3: -1,
  4: -1,
  ... // assume 5-99 are -1
  100: -1,
  101: 394231
};
```

Optimized version:

```ts
export const ambiguous = (idx: number): number =>
  2 <= idx && idx <= 100 ? -1 : (ambiguousMap[idx] ?? 0);

// example
const map: Record<number, number> = {
  1: 2947937,
  101: 394231
};
```

### 3. Replace files

Copy the optimized `ambiguous.ts` and `combining.ts` into `src/`.  
The Unicode update is then complete.


## Behind Wcwidth

In fixed-width terminals, most Latin characters take up one column, while East 
Asian (CJK) ideographs usually take up two. The challenge is deciding how many 
“cells” each Unicode character should occupy so that text aligns correctly.

The Unicode standard defines width classes:
- **Wide (W)** and **Fullwidth (F)** - always 2 columns  
- **Halfwidth (H)** and **Narrow (Na)** - always 1 column  
- **Ambiguous (A)** - 1 column normally, but 2 in CJK compatibility mode  
- **Neutral (N)** - treated as 1 column here for simplicity  

Other rules include:
- `U+0000` (null) - width 0  
- Control characters - `-1`  
- Combining marks - width 0  
- Soft hyphen (`U+00AD`) - width 1  
- Zero width space (`U+200B`) - width 0  

This logic originates from Markus Kuhn’s reference implementation and is widely 
used in terminal emulators to ensure consistent alignment.

See [Unicode TR#11](http://www.unicode.org/unicode/reports/tr11/) for more details.


## Feedback

Found something odd?  
Feel free to [open an issue](https://github.com/dawsonhuang0/Wcwidth-O1/issues).


## Acknowledgments

- Original [implementation](http://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c) by Markus Kuhn. 

## License

Distributed under the MIT License.  
See [`LICENSE`](LICENSE) for more information.
