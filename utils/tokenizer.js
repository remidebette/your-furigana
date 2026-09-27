import initWasm, { Tokenizer } from "../lib/furigana-wasm/furigana_wasm"
import { unpackTokens } from "./tokens"

// IPADIC compiled for Lindera by wasm/build.sh, in the order Tokenizer's constructor takes them
export const DICTIONARY_PATH = "/data/ipadic"
export const DICTIONARY_FILES = [
    "metadata.json", "char_def.bin", "matrix.mtx",
    "dict.trie", "dict.valsidx", "dict.vals", "dict.wordsidx", "dict.words",
    "unk.bin",
]

// The files are served gzipped as they are (not with Content-Encoding): the browser decompresses them
async function fetchGzipped(url) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`)
    const decompressed = response.body.pipeThrough(new DecompressionStream("gzip"))
    return new Uint8Array(await new Response(decompressed).arrayBuffer())
}

export async function createTokenizer() {
    const [, ...files] = await Promise.all([
        initWasm(),
        ...DICTIONARY_FILES.map((file) => fetchGzipped(`${DICTIONARY_PATH}/${file}.gz`)),
    ])
    const tokenizer = new Tokenizer(...files)
    return {
        parse: (text) => text === "" ? [] : unpackTokens(tokenizer.tokenize(text)),
    }
}
