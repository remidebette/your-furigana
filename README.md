<h1 align="center">Your Furigana</h1>
<h3 align="center">A reading helper for Japanese intermediate learners</h3>

## About

Intermediate learners of Japanese want to be able to read text that contains chinese characters, the Kanji.

To help with the reading of a particular character, the Japanese writing system comes with "Furigana", pronunciation help written on top of rare Kanji:

<h4 align="center"><ruby>日本<rp></rp><rt>にほん</rt><rp></rp></ruby></h4>

Usually, reading japanese text, the delicate situation of the intermediate learner is that he does not want to be reminded of the pronunciations of Kanji he already learned,
since he is trying to master them. 

On the contrary, Furigana can be a precious tool when one wishes to read real-life Japanese text which never contains only text 
he might already know. 

Today, Kanji memorisation apps (such as WaniKani) know which Kanji pronunciations a user has learned at a certain time.
With **Your Furigana**, the user imports this progress from WaniKani (or edits a list of known readings as a CSV) and copy-pastes
any Japanese text from the Web to get just the help he needs to read through it. Compounds are recognised from the readings of
their Kanji: knowing 学 (がく) and 校 (こう) is enough to read 学校 (がっこう) without help, and a click on any word toggles its furigana.

A sample PoC page is deployed [here](http://your-furigana.vercel.app/).  
This is shared as a showcase of a Next.js architecture

Test it with your WaniKani API token in the *WaniKani* tab, or by copying and pasting this [sample CSV file](https://raw.githubusercontent.com/remidebette/your-furigana/master/public/data/assignments_ids.csv) to the *Readings* tab and any text from a [Wikipedia random page in Japanese](https://ja.wikipedia.org/wiki/%E7%89%B9%E5%88%A5:%E3%81%8A%E3%81%BE%E3%81%8B%E3%81%9B%E8%A1%A8%E7%A4%BA)
to the *Text* tab!

## Features

[**React.js hooks**](https://reactjs.org/docs/hooks-intro.html)

- The best way to handle state in React.

[**Next.js**](https://nextjs.org/)

- Makes the Server Side Rendering and development of React apps a pleasure.

[**React Bootstrap**](https://react-bootstrap.github.io/)

- The composable front end framework Bootstrap adapted for React.

[**Lindera**](https://github.com/lindera/lindera) in WebAssembly

- A Rust morphological analyzer, compiled to a small WebAssembly module (`wasm/`) to split Japanese text into words and find their readings.

[**IPADIC**](https://github.com/taku910/mecab)

- The Japanese dictionary used by the analyzer.

[**Papa Parse**](https://www.papaparse.com/)

- The powerful, in-browser CSV parser for big boys and girls.

[**Serwist**](https://serwist.pages.dev/)

- Makes the app an installable Progressive Web App that works offline, including the Japanese dictionary.

[**Vercel Deployment**](https://vercel.com/)

- Ready to deploy on Vercel using git integration or the command line

## Installation

Requires Node.js 20.9 or later (Node 22 LTS recommended).

Clone the repository and install the dependencies:

```shell
git clone https://github.com/remidebette/your-furigana && yarn && yarn dev
```

## Usage

### Development

Serve with hot reload at localhost:3000.

```
yarn dev
```

### Build

Build for production: next.js automatically renders static HTML pages when possible. Then if you deploy on Vercel you can have both statically rendered pages and server-side rendered pages (as lambdas functions).

```
yarn build
```

Launch a server for server-side rendering (after building the application):

```
yarn start
```

### Progressive Web App

The service worker (`worker/sw.js`) is built by Serwist through the `app/serwist/[path]` route and served at `/serwist/sw.js`.
It is disabled with `yarn dev`: use `yarn build && yarn start` to try it, then check *Application* in the browser dev tools.

The app shell is precached. The dictionary (`public/data/ipadic`, ~10 MB) is kept out of the precache so it is not
downloaded again on each deploy: it is cached once at runtime, then always served from the cache.

### Japanese tokenizer (WebAssembly)

The text is split into words, with their readings, by [Lindera](https://github.com/lindera/lindera) compiled to WebAssembly
(`wasm/`, ~40 lines of Rust). The dictionary is not embedded in the module: the app downloads the IPADIC files from
`public/data/ipadic` and hands them to the tokenizer, which returns all the tokens of a text in one packed string.

The build outputs (`lib/furigana-wasm/`, `public/data/ipadic/` and `public/THIRD_PARTY_NOTICES.txt`) are committed, so
the Rust toolchain is only needed to change the Rust code or upgrade Lindera:

```shell
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.129
wasm/build.sh
```

### Lint and test

```
yarn lint
yarn test
```

## License

The dictionary and the libraries compiled into the tokenizer come with their own licenses, all permissive: see
[THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt), also linked from the footer of the app.

Released under the [MIT](https://github.com/remidebette/your-furigana/blob/master/LICENSE.txt) license.
