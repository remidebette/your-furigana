// Tokens come out of the WebAssembly tokenizer as one packed string (see wasm/src/lib.rs):
// "surface US reading US pos RS surface US reading US pos ..."
const FIELD_SEPARATOR = "\u001f"
const TOKEN_SEPARATOR = "\u001e"

// Returns tokens as used by patchTokens and tokensToSegments
export function unpackTokens(packed) {
    if (packed === "") return []
    return packed.split(TOKEN_SEPARATOR).map((token) => {
        const [surface_form, reading, pos] = token.split(FIELD_SEPARATOR)
        return { surface_form, reading, pos }
    })
}
