import { useState, useEffect } from "react"
import { tokenize, toHiragana } from 'wanakana';
import styles from '../styles/japanese.module.css'
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

const regex = new RegExp(/(?:\r\n|\r|\n)/g);


function JapaneseChar(char, reading) {
    return (<ruby>{char}<rp></rp><rt>{reading}</rt><rp></rp></ruby>)
}


async function convert(str, vocab, kuroshiro) {
        str = str || "";

        let result = [];

        const rawTokens = await kuroshiro._analyzer.parse(str);
        const tokens = patchTokens(rawTokens);

        {
            for (const token of tokens) {
                const strType = getStrType(token.surface_form);
                switch (strType) {
                    case StrType.KANJI:
                        if (token.surface_form in vocab) {
                            console.log(token.surface_form)
                            result.push(token.surface_form);
                            break;
                        }
                        result.push(JapaneseChar(token.surface_form, toRawHiragana(token.reading)));
                        break;
                    case StrType.MIXED:
                        // TODO: better handle the case where all kanjis are in vocab

                        if (token.surface_form in vocab) {
                            console.log(token.surface_form)
                            result.push(token.surface_form);
                            break;
                        }

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
                        const matches = reg.exec(toRawHiragana(token.reading));
                        if (matches) {
                            let pickKanji = 1;
                            for (const sub_char of subs) {
                                if (isKanji(sub_char[0])) {
                                    result.push(JapaneseChar(sub_char, matches[pickKanji]));
                                    pickKanji += 1;
                                }
                                else {
                                    //notations.push([sub_char, 2, toRawHiragana(sub_char)]);
                                    result.push(sub_char);
                                }
                            }
                        }
                        else {
                            result.push(JapaneseChar(token.surface_form, toRawHiragana(token.reading)));
                        }
                        break;
                    case StrType.KANA:
                        result.push(token.surface_form);
                        break;
                    case StrType.OTHER:
                        // TODO: better handle several \n
                        if (regex.test(token.surface_form)) {
                            result.push(<br />)
                            break;
                        }
                        result.push(token.surface_form);
                        break;
                    default:
                        throw new Error("Unknown strType");
                }
            }
            return result;
        }
    }


function JapaneseText({text, vocab, kuroshiro}) {
    const [furigana, setFurigana] = useState("");

    useEffect(() => {
        const async_effect = async () => {
            const result = await convert(text, vocab, kuroshiro);

            setFurigana(result)
        }
        async_effect().catch(console.error)
    },[text, vocab])

    return (<p lang="ja" className={styles.japanese}>{furigana}</p>)

}

export { JapaneseText };