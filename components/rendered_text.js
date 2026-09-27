import { memo } from "react"
import styles from "../styles/japanese.module.css"
import {
    StrType,
    getStrType,
    patchTokens,
    isKatakana,
    isKanji,
    toRawHiragana,
    isNonEmptyString
} from "../utils/util";

// A segment is either a plain string, or { text, reading } for kanji that can get furigana.
// Adjacent plain strings are merged to keep the number of rendered nodes low.
function pushSegment(segments, text, reading) {
    if (isNonEmptyString(reading)) {
        segments.push({ text, reading })
    } else if (typeof segments[segments.length - 1] === "string") {
        segments[segments.length - 1] += text
    } else {
        segments.push(text)
    }
}

// See https://github.com/hexenq/kuroshiro/blob/3acf1a83e18812410482c8877f3f65f1db264ace/src/kuroshiro.js#L185
export function tokensToSegments(tokens) {
    const segments = [];
    for (const token of patchTokens(tokens)) {
        const hiraganaReading = toRawHiragana(token.reading);
        switch (getStrType(token.surface_form)) {
            case StrType.KANJI:
                pushSegment(segments, token.surface_form, hiraganaReading);
                break;
            case StrType.MIXED: {
                // TODO: better handle the case where all kanjis are in vocab
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
                const matches = new RegExp(`^${pattern}$`).exec(hiraganaReading);
                if (matches) {
                    let pickKanji = 1;
                    for (const sub_char of subs) {
                        if (isKanji(sub_char[0])) {
                            pushSegment(segments, sub_char, matches[pickKanji]);
                            pickKanji += 1;
                        }
                        else {
                            pushSegment(segments, sub_char);
                        }
                    }
                }
                else {
                    pushSegment(segments, token.surface_form, hiraganaReading);
                }
                break;
            }
            case StrType.KANA:
            case StrType.OTHER:
                pushSegment(segments, token.surface_form);
                break;
            default:
                throw new Error("Unknown strType");
        }
    }
    return segments;
}

// Split the text into lines and tokenize each one, reusing the segments of unchanged lines
// (same array instance, so their memoized <Paragraph> doesn't re-render).
// `cache` maps a line to its segments and only keeps the lines of the latest text.
export async function segmentText(analyzer, text, cache) {
    if (text === "") return [];
    const lines = text.split(/\r?\n/);
    const paragraphs = await Promise.all(lines.map(async (line) =>
        cache.get(line) ?? tokensToSegments(await analyzer.parse(line))
    ));
    cache.clear();
    lines.forEach((line, i) => cache.set(line, paragraphs[i]));
    return paragraphs;
}

// Only re-renders when its own known state changes, not when another reading is toggled
const JapaneseChar = memo(function JapaneseChar({ char, reading, known, onToggle }) {
    return (
        <span onClick={() => onToggle(char, reading)}>
            {known ? char : <ruby>{char}<rt>{reading}</rt></ruby>}
        </span>
    )
})

// Re-render a paragraph only if its text changed or one of its kanji was toggled
// (a toggle replaces the Set of that kanji only, see utils/vocab.js)
function sameParagraph(prev, next) {
    if (prev.segments !== next.segments || prev.onToggle !== next.onToggle) return false
    if (prev.knownReadings === next.knownReadings) return true
    return next.segments.every((segment) => typeof segment === "string"
        || prev.knownReadings.get(segment.text) === next.knownReadings.get(segment.text))
}

const Paragraph = memo(function Paragraph({ segments, knownReadings, onToggle }) {
    if (segments.length === 0) return <div className={styles.paragraph}><br /></div>
    return (
        <div className={styles.paragraph}>
            {segments.map((segment, i) => typeof segment === "string"
                ? segment
                : <JapaneseChar
                    key={i}
                    char={segment.text}
                    reading={segment.reading}
                    known={knownReadings.get(segment.text)?.has(segment.reading) ?? false}
                    onToggle={onToggle}
                />
            )}
        </div>
    )
}, sameParagraph)

// paragraphs: one array of segments per line of the text, reused as long as the line is unchanged
export const FuriganaText = memo(function FuriganaText({ paragraphs, knownReadings, onToggle }) {
    return paragraphs.map((segments, i) =>
        <Paragraph key={i} segments={segments} knownReadings={knownReadings} onToggle={onToggle} />
    )
})
