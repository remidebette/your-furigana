import { useContext } from "react"
import { tokenize, toHiragana } from 'wanakana';
import {
    ROMANIZATION_SYSTEM,
    StrType,
    getStrType,
    patchTokens,
    isHiragana,
    isKatakana,
    isKana,
    isKanji,
    isJapanese,
    hasHiragana,
    hasKatakana,
    hasKana,
    hasKanji,
    hasJapanese,
    toRawHiragana,
    toRawKatakana,
    toRawRomaji,
    kanaToHiragna,
    kanaToKatakana,
    kanaToRomaji
} from "../utils/util";
import { VocabContext } from "./vocabContext";

const regex = new RegExp(/(?:\r\n|\r|\n)/g);

const isNonEmptyString = (val) => typeof val === 'string' && !!val

function JapaneseChar({char, reading}) {
    const {vocab, dispatchVocab} = useContext(VocabContext);

    const deactivate = isNonEmptyString(reading) && char in vocab && vocab[char].split(";").includes(reading);

    const addToVocab = () => {
        if (isNonEmptyString(reading)) {
            if (deactivate) {
                dispatchVocab({
                    type: "delete",
                    char: char,
                    reading: reading
                })
            } else {
                dispatchVocab({
                    type: "add",
                    char: char,
                    reading: reading
                })
            }
        }
    }

    return (<div onClick={addToVocab} style={{ display: "inline" }}>
        {deactivate ? char : <ruby>{char}<rp></rp><rt>{reading}</rt><rp></rp></ruby> }
    </div>)
}

// See https://github.com/hexenq/kuroshiro/blob/3acf1a83e18812410482c8877f3f65f1db264ace/src/kuroshiro.js#L185
async function convert(tokens) {
        let result = [];

        {
            for (const token of tokens) {
                const key = crypto.randomUUID()

                const strType = getStrType(token.surface_form);
                const hiraganaReading = toRawHiragana(token.reading);
                switch (strType) {
                    case StrType.KANJI:
                        result.push(<JapaneseChar key={key} char={token.surface_form} reading={hiraganaReading}/>);
                        break;
                    case StrType.MIXED:
                        // TODO: better handle the case where all kanjis are in vocab

                        // if (
                        //     token.surface_form in vocab &&
                        //     vocab[token.surface_form].split(";").includes(hiraganaReading)
                        // ) {
                        //     console.log(token.surface_form)
                        //     result.push(JapaneseChar(token.surface_form, hiraganaReading, false, vocab, setVocab));
                        //     break;
                        // }

                        let pattern = "";
                        let isLastTokenKanji = false;
                        const subs = []; // recognize kanjis and group them
                        for (const character of token.surface_form) {
                            if (isKanji(character)) {
                                if (!isLastTokenKanji) { // ignore successive kanji tokens (#10)
                                    isLastTokenKanji = true;
                                    pattern += "(.*)";
                                    subs.push(character);
                                }
                                else {
                                    subs[subs.length - 1] += character;
                                }
                            }
                            else {
                                isLastTokenKanji = false;
                                subs.push(character);
                                pattern += isKatakana(character) ? toRawHiragana(character) : character;
                            }
                        }
                        const reg = new RegExp(`^${pattern}$`);
                        const matches = reg.exec(hiraganaReading);
                        if (matches) {
                            let pickKanji = 1;
                            for (const sub_char of subs) {
                                const key = crypto.randomUUID();
                                if (isKanji(sub_char[0])) {
                                    result.push(<JapaneseChar key={key} char={sub_char} reading={matches[pickKanji]}/>);
                                    pickKanji += 1;
                                } 
                                else {
                                    //notations.push([sub_char, 2, toRawHiragana(sub_char)]);
                                    result.push(<JapaneseChar key={key} char={sub_char}/>);
                                }
                            }
                        }
                        else {
                            result.push(<JapaneseChar key={key} char={token.surface_form} reading={hiraganaReading}/>);
                        }
                        break;
                    case StrType.KANA:
                        result.push(<JapaneseChar key={key} char={token.surface_form}/>);
                        break;
                    case StrType.OTHER:
                        // TODO: better handle several \n
                        if (regex.test(token.surface_form)) {
                            result.push(<br />)
                            break;
                        }
                        result.push(<JapaneseChar key={key} char={token.surface_form}/>);
                        break;
                    default:
                        throw new Error("Unknown strType");
                }
            }
            return result;
        }
    }

export { convert };