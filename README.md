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

Today, Kanji memorisation apps (such as Wanikani) can provide to a user a list of the known Kanji pronunciations at a certain time.
With **Your Furigana**, the user can input this list as a CSV and copy-paste any Japanese text from the Web to get just the help he 
needs to read through it.

A sample PoC page is deployed [here](http://your-furigana.vercel.app/).  
This is shared as a showcase of a Next.js architecture

Test it by copying and pasting this [sample CSV file](https://raw.githubusercontent.com/remidebette/your-furigana/master/public/data/assignments_ids.csv) to the *Readings* tab and any text from a [Wikipedia random page in Japanese](https://ja.wikipedia.org/wiki/%E7%89%B9%E5%88%A5:%E3%81%8A%E3%81%BE%E3%81%8B%E3%81%9B%E8%A1%A8%E7%A4%BA)
to the *Text* tab!

## Features

[**React.js hooks**](https://reactjs.org/docs/hooks-intro.html)

- The best way to handle state in React.

[**Next.js**](https://nextjs.org/)

- Makes the Server Side Rendering and development of React apps a pleasure.

[**React Bootstrap**](https://react-bootstrap.github.io/)

- The composable front end framework Bootstrap adapted for React.

[**Kuroshiro**](https://kuroshiro.org/)

- A pure JavaScript Japanese Tokenizer.

[**Kuromoji**](https://www.atilika.com/ja/kuromoji/)

- A Japanese Dictionary used as a morphological analyzer for Kuroshiro.

[**React Papaparse**](https://react-papaparse.js.org/)

- The powerful, in-browser React CSV parser for big boys and girls.

[**Next PWA**](https://www.npmjs.com/package/next-pwa)

- Easily create a Progressive Web App with Next.js.

[**Vercel Deployment**](https://vercel.com/)

- Ready to deploy on Vercel using git integration or the command line

## Installation

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

Generate a fully static project with pre-rendered pages to put directly on a server or any static website hosting platform. Note that you lose the possibility to have server-side rendered pages. With Vercel you should not have to run this command.

```
yarn export
```

## License

Released under the [MIT](https://github.com/remidebette/your-furigana/blob/master/LICENSE.txt) license.
