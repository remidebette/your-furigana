//! Compiles the IPADIC source (CSV and .def files) into Lindera's dictionary files.
//!
//! Usage: build-dict <ipadic source dir> <metadata.json> <output dir>

use std::path::Path;

use lindera_dictionary::builder::DictionaryBuilder;
use lindera_dictionary::dictionary::metadata::Metadata;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    let [_, source, metadata, output] = args.as_slice() else {
        return Err("usage: build-dict <ipadic source dir> <metadata.json> <output dir>".into());
    };
    let metadata = Metadata::load(&std::fs::read(metadata)?)?;
    DictionaryBuilder::new(metadata).build_dictionary(Path::new(source), Path::new(output))?;
    Ok(())
}
