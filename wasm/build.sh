#!/usr/bin/env bash
# Builds the Japanese tokenizer used by the app:
#   - lib/furigana-wasm/       the WebAssembly module and its JS bindings
#   - public/data/ipadic/*.gz  the IPADIC dictionary, compiled for Lindera and gzipped
# Only needed when changing the Rust code or upgrading Lindera: the outputs are committed.
#
# Requires: rustup target add wasm32-unknown-unknown
#           cargo install wasm-bindgen-cli --version 0.2.129
set -euo pipefail
cd "$(dirname "$0")"

WASM_OUT=../lib/furigana-wasm
DICT_OUT=../public/data/ipadic

# IPADIC 2.7.0 source, converted to UTF-8, from npm (integrity-checked by npm).
# Set IPADIC_SRC to use another copy of the source.
if [ -z "${IPADIC_SRC:-}" ]; then
    mkdir -p target/ipadic-src
    (cd target/ipadic-src && npm pack --silent mecab-ipadic-seed@0.0.2 > /dev/null && tar xzf mecab-ipadic-seed-0.0.2.tgz)
    IPADIC_SRC=target/ipadic-src/package/lib/dict
fi

echo "Compiling the dictionary from $IPADIC_SRC"
rm -rf target/ipadic
cargo run --quiet --release --bin build-dict -- "$IPADIC_SRC" ipadic-metadata.json target/ipadic
rm -rf "$DICT_OUT" && mkdir -p "$DICT_OUT"
for file in target/ipadic/*; do
    gzip -9 --no-name --stdout "$file" > "$DICT_OUT/$(basename "$file").gz"
done
# IPADIC license: its copyright notice must accompany any copy (-c drops two stray bytes at its end)
iconv -f UTF-8 -t UTF-8 -c "$IPADIC_SRC/COPYING" > "$DICT_OUT/COPYING"

echo "Testing the tokenizer"
cargo test --quiet --release --lib

echo "Compiling the tokenizer"
cargo build --quiet --release --lib --target wasm32-unknown-unknown
rm -rf "$WASM_OUT"
wasm-bindgen --target web --out-dir "$WASM_OUT" target/wasm32-unknown-unknown/release/furigana_wasm.wasm

echo "Writing the license notices"
python3 notices.py ../public/THIRD_PARTY_NOTICES.txt "$DICT_OUT/COPYING"

du -sh "$DICT_OUT" "$WASM_OUT"/*.wasm
