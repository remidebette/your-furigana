import Papa from 'papaparse'
import { splitFurigana } from './furigana'
import { EXCEPTION_PREFIX, isKnownReading } from './known'
import { hasKana, toRawHiragana } from './util'

// Known readings are edited as CSV lines, "kanji,reading1;reading2", and kept in memory
// as a Map { kanji => Set { reading1, reading2 } } for constant-time lookups while rendering.
// A reading starting with "-" is an exception, see utils/known.js.

const HEADER_NAMES = ['kanji', 'char']

// The text is looked up by kanji groups (see utils/furigana.js): a word with okurigana is
// stored as its kanji groups, 一つ,ひとつ -> 一,ひと and 入れる,いれる -> 入,い
export function knownEntries(word, reading) {
    if (reading.startsWith(EXCEPTION_PREFIX)) return [[word, reading]]
    const hiragana = toRawHiragana(reading)
    const pieces = hasKana(word) && splitFurigana(word, hiragana)
    if (!pieces) return [[word, hiragana]]
    return pieces.filter((piece) => typeof piece !== 'string').map((piece) => [piece.text, piece.reading])
}

// Adds readings, creating a new Set only for the words that change (their paragraphs re-render)
export function addReadings(known, entries) {
    const result = new Map(known)
    for (const [word, reading] of entries) {
        const readings = result.get(word)
        if (readings?.has(reading)) continue
        result.set(word, new Set(readings).add(reading))
    }
    return result
}

export function csvToKnown(csv) {
    const { data } = Papa.parse(csv.trim(), { skipEmptyLines: true })
    const entries = []
    for (const [word, readings] of data) {
        if (!word || readings === undefined) continue
        // Skip the header line of downloaded / sample files
        if (HEADER_NAMES.includes(word.trim()) && readings.trim() === 'readings') continue
        // A kanji can appear on several lines (e.g. as a kanji and in a vocabulary word): they are merged
        for (const reading of readings.split(';')) {
            if (reading.trim()) entries.push(...knownEntries(word.trim(), reading.trim()))
        }
    }
    return addReadings(new Map(), entries)
}

export function knownToCsv(known) {
    return Papa.unparse([...known].map(([kanji, readings]) => [kanji, [...readings].join(';')]), { newline: '\n' })
}

// Returns a new Map where only the toggled word has a new Set:
// the other entries keep their identity, so unaffected paragraphs don't re-render.
function toggleReading(known, word, reading, afterKanji) {
    const wasKnown = isKnownReading(known, word, reading, afterKanji)
    const readings = new Set(known.get(word))
    readings.delete(reading)
    readings.delete(EXCEPTION_PREFIX + reading)
    const newKnown = new Map(known)
    newKnown.set(word, readings)
    // Known through its kanji (学校 from 学 and 校): only an exception shows its furigana again
    const knownWithoutEntry = isKnownReading(newKnown, word, reading, afterKanji)
    if (wasKnown && knownWithoutEntry) readings.add(EXCEPTION_PREFIX + reading)
    if (!wasKnown && !knownWithoutEntry) readings.add(reading)
    if (!readings.size) newKnown.delete(word)
    return newKnown
}

// csv: the text of the readings textarea as the user typed it,
// or null when it should be generated from `known` (after a toggle).
// edited: csv has changes that are not parsed into `known` yet.
export const initialVocabState = { csv: '', known: new Map(), edited: false }

export function vocabReducer(state, action) {
    switch (action.type) {
        // Initial load or file upload: parse right away
        case 'load-csv': {
            const csv = action.csv.trim()
            return { csv, known: csvToKnown(csv), edited: false }
        }
        // Typing in the readings textarea: parsed later by 'parse-csv' (debounced)
        case 'edit-csv':
            return { ...state, csv: action.csv, edited: true }
        case 'parse-csv':
            return state.edited ? { ...state, known: csvToKnown(state.csv), edited: false } : state
        // Click on a kanji: mark the reading as known, or unknown again
        // (afterKanji: the word follows another kanji word, see utils/known.js)
        case 'toggle': {
            // Apply pending edits of the textarea first, so they are not lost
            const known = state.edited ? csvToKnown(state.csv) : state.known
            return { csv: null, known: toggleReading(known, action.char, action.reading, action.afterKanji), edited: false }
        }
        // Import (e.g. from WaniKani): only adds readings, manual changes are kept
        case 'add-readings': {
            const known = state.edited ? csvToKnown(state.csv) : state.known
            return { csv: null, known: addReadings(known, action.entries), edited: false }
        }
        default:
            throw new Error('Unknown action: ' + action.type)
    }
}

// The readings as CSV text, generated only when needed (display, download, saving)
export function vocabStateToCsv(state) {
    return state.csv ?? knownToCsv(state.known)
}
