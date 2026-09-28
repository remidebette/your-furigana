import { memo } from "react"
import styles from "../styles/japanese.module.css"
import {
    StrType,
    getStrType,
    patchTokens,
    isKanji,
    toRawHiragana,
    isNonEmptyString
} from "../utils/util";
import { splitFurigana } from "../utils/furigana";
import { isKnownReading } from "../utils/known";

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

export function tokensToSegments(tokens) {
    const segments = [];
    for (const token of patchTokens(tokens)) {
        const surface = token.surface_form;
        const reading = toRawHiragana(token.reading);
        const type = getStrType(surface);
        // No furigana for kana and symbols, nor for words the dictionary doesn't know
        // (their "reading" is the surface form itself, kanji included)
        if (type === StrType.KANA || type === StrType.OTHER || [...reading].some(isKanji)) {
            pushSegment(segments, surface);
            continue;
        }
        // TODO: better handle the case where all kanjis are in vocab
        const pieces = splitFurigana(surface, reading);
        if (!pieces) {
            // The reading doesn't fit the word: show it over the whole word
            pushSegment(segments, surface, reading);
            continue;
        }
        for (const piece of pieces) {
            if (typeof piece === "string") pushSegment(segments, piece);
            else pushSegment(segments, piece.text, piece.reading);
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
    // Tokenize each distinct line once: repeated lines (blank ones especially) share their segments
    const segmentsByLine = new Map(await Promise.all([...new Set(lines)].map(async (line) =>
        [line, cache.get(line) ?? tokensToSegments(await analyzer.parse(line))]
    )));
    cache.clear();
    segmentsByLine.forEach((segments, line) => cache.set(line, segments));
    return lines.map((line) => segmentsByLine.get(line));
}

// Only re-renders when its own known state changes, not when another reading is toggled
const JapaneseChar = memo(function JapaneseChar({ char, reading, known, afterKanji, onToggle }) {
    return (
        <span onClick={() => onToggle(char, reading, afterKanji)}>
            {known ? char : <ruby>{char}<rt>{reading}</rt></ruby>}
        </span>
    )
})

// Re-render a paragraph only if its text changed or one of its kanji was toggled
// (a toggle replaces the Set of that kanji only, see utils/vocab.js)
// A word's known state depends on its own entry and on each of its kanji (utils/known.js)
function sameParagraph(prev, next) {
    if (prev.segments !== next.segments || prev.onToggle !== next.onToggle) return false
    if (prev.knownReadings === next.knownReadings) return true
    const same = (key) => prev.knownReadings.get(key) === next.knownReadings.get(key)
    return next.segments.every((segment) => typeof segment === "string"
        || (same(segment.text) && [...segment.text].every(same)))
}

const Paragraph = memo(function Paragraph({ segments, knownReadings, onToggle }) {
    if (segments.length === 0) return <div className={styles.paragraph}><br /></div>
    return (
        <div className={styles.paragraph}>
            {segments.map((segment, i) => {
                if (typeof segment === "string") return segment
                // Directly after another kanji word (no kana between): its first kana can be voiced
                const afterKanji = typeof segments[i - 1] === "object"
                return <JapaneseChar
                    key={i}
                    char={segment.text}
                    reading={segment.reading}
                    known={isKnownReading(knownReadings, segment.text, segment.reading, afterKanji)}
                    afterKanji={afterKanji}
                    onToggle={onToggle}
                />
            })}
        </div>
    )
}, sameParagraph)

// paragraphs: one array of segments per line of the text, reused as long as the line is unchanged
export const FuriganaText = memo(function FuriganaText({ paragraphs, knownReadings, onToggle }) {
    return paragraphs.map((segments, i) =>
        <Paragraph key={i} segments={segments} knownReadings={knownReadings} onToggle={onToggle} />
    )
})
