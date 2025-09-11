# Og-Wcwidth

A TypeScript/JavaScript port of Markus Kuhn’s **wcwidth** and **wcswidth** 
implementations, replicating the original C code for Unicode terminal width 
handling.  
These functions are defined in IEEE Std 1003.1 (POSIX).

### References:
- [OpenGroup wcwidth()](http://www.opengroup.org/onlinepubs/007904975/functions/wcwidth.html)  
- [OpenGroup wcswidth()](http://www.opengroup.org/onlinepubs/007904975/functions/wcswidth.html)


## Getting Started

Install Og-Wcwidth via npm:

```bash
npm i og-wcwidth
```


## Usage

<h3>JavaScript / TypeScript:</h3>

```ts
import wcwidth from 'og-wcwidth';

const example1 = wcwidth('a'); // 1
const example2 = wcwidth('好'); // 2
const example3 = wcwidth('😊'); // 2
```

or

```ts
import { wcwidth, wcswidth, wcswidthCjk } from 'og-wcwidth';

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
Feel free to [open an issue](https://github.com/dawsonhuang0/Og-Wcwidth/issues).


## Acknowledgments

- Original [implementation](http://www.cl.cam.ac.uk/~mgk25/ucs/wcwidth.c) by Markus Kuhn. 

## License

Distributed under the MIT License.  
See [`LICENSE`](LICENSE) for more information.
