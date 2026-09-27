//! Japanese tokenizer for the browser: Lindera with the IPADIC dictionary.
//!
//! The dictionary is not embedded, to keep the .wasm small: the app downloads its files
//! and passes them to `Tokenizer::new`.

use std::borrow::Cow;
use std::sync::Arc;

use lindera::dictionary::Dictionary;
use lindera::mode::Mode;
use lindera::segmenter::Segmenter;
use lindera_dictionary::dictionary::character_definition::CharacterDefinition;
use lindera_dictionary::dictionary::connection_cost_matrix::ConnectionCostMatrix;
use lindera_dictionary::dictionary::metadata::Metadata;
use lindera_dictionary::dictionary::prefix_dictionary::PrefixDictionary;
use lindera_dictionary::dictionary::unknown_dictionary::UnknownDictionary;
use wasm_bindgen::prelude::*;

// IPADIC details: part of speech is the first field, the reading the eighth
const POS: usize = 0;
const READING: usize = 7;

/// Separators of the packed output (ASCII unit and record separators)
const FIELD_SEPARATOR: char = '\u{1f}';
const TOKEN_SEPARATOR: char = '\u{1e}';

fn js_error(error: impl std::fmt::Display) -> JsError {
    JsError::new(&error.to_string())
}

#[wasm_bindgen]
pub struct Tokenizer {
    segmenter: Segmenter,
}

#[wasm_bindgen]
impl Tokenizer {
    /// Builds the tokenizer from the dictionary files produced by `build-dict`.
    #[wasm_bindgen(constructor)]
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        metadata: Vec<u8>,
        char_def: Vec<u8>,
        matrix: Vec<u8>,
        trie: Vec<u8>,
        vals_idx: Vec<u8>,
        vals: Vec<u8>,
        words_idx: Vec<u8>,
        words: Vec<u8>,
        unk: Vec<u8>,
    ) -> Result<Tokenizer, JsError> {
        let metadata = Metadata::load(&metadata).map_err(js_error)?;
        metadata.validate_format_version().map_err(js_error)?;
        let dictionary = Dictionary {
            prefix_dictionary: Arc::new(
                PrefixDictionary::load(trie, vals_idx, vals, words_idx, words).map_err(js_error)?,
            ),
            connection_cost_matrix: Arc::new(ConnectionCostMatrix::load(matrix).map_err(js_error)?),
            character_definition: Arc::new(CharacterDefinition::load(&char_def).map_err(js_error)?),
            unknown_dictionary: Arc::new(UnknownDictionary::load(&unk).map_err(js_error)?),
            metadata: Arc::new(metadata),
        };
        // Keep spaces as tokens: the text is rendered from the token surfaces
        let segmenter = Segmenter::new(Mode::Normal, dictionary, None).keep_whitespace(true);
        Ok(Tokenizer { segmenter })
    }

    /// Tokenizes `text` into one packed string, to cross the JS boundary once instead of
    /// creating a JS object per token: `surface US reading US pos RS surface US ...`
    /// (the reading is empty for unknown words).
    pub fn tokenize(&self, text: &str) -> Result<String, JsError> {
        let mut tokens = self.segmenter.segment(Cow::Borrowed(text)).map_err(js_error)?;
        let mut packed = String::with_capacity(text.len() * 3);
        for (i, token) in tokens.iter_mut().enumerate() {
            if i > 0 {
                packed.push(TOKEN_SEPARATOR);
            }
            packed.push_str(&token.surface);
            packed.push(FIELD_SEPARATOR);
            let reading = token.get_detail(READING).unwrap_or("*");
            if reading != "*" {
                packed.push_str(reading);
            }
            packed.push(FIELD_SEPARATOR);
            packed.push_str(token.get_detail(POS).unwrap_or(""));
        }
        Ok(packed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Needs the dictionary compiled by build.sh in target/ipadic
    fn tokenizer() -> Tokenizer {
        let file = |name: &str| std::fs::read(format!("target/ipadic/{name}")).expect("run build.sh first");
        Tokenizer::new(
            file("metadata.json"), file("char_def.bin"), file("matrix.mtx"),
            file("dict.trie"), file("dict.valsidx"), file("dict.vals"), file("dict.wordsidx"), file("dict.words"),
            file("unk.bin"),
        )
        .unwrap_or_else(|_| panic!("could not load the dictionary"))
    }

    fn tokens(packed: &str) -> Vec<Vec<&str>> {
        packed.split(TOKEN_SEPARATOR).map(|t| t.split(FIELD_SEPARATOR).collect()).collect()
    }

    #[test]
    fn tokenizes_with_readings_and_part_of_speech() {
        let packed = tokenizer().tokenize("日本語を読む").unwrap_or_default();
        assert_eq!(tokens(&packed), vec![vec!["日本語", "ニホンゴ", "名詞"], vec!["を", "ヲ", "助詞"], vec!["読む", "ヨム", "動詞"]]);
    }

    #[test]
    fn keeps_every_character_of_the_text() {
        let text = "Next.js 16 と React で  日本語 🎸\tＴｅｓｔ　全角 abc";
        let packed = tokenizer().tokenize(text).unwrap_or_default();
        let joined: String = tokens(&packed).iter().map(|t| t[0]).collect();
        assert_eq!(joined, text);
    }

    #[test]
    fn leaves_the_reading_of_unknown_words_empty() {
        let packed = tokenizer().tokenize("ＸＹＺ").unwrap_or_default();
        assert!(tokens(&packed).iter().all(|t| t[1].is_empty()));
    }
}
