import Papa from 'papaparse'

// Known readings are edited as CSV lines, "kanji,reading1;reading2", and kept in memory
// as a Map { kanji => Set { reading1, reading2 } } for constant-time lookups while rendering.

const HEADER_NAMES = ['kanji', 'char']

export function csvToKnown(csv) {
    const { data } = Papa.parse(csv.trim(), { skipEmptyLines: true })
    const known = new Map()
    for (const [kanji, readings] of data) {
        if (!kanji || readings === undefined) continue
        // Skip the header line of downloaded / sample files
        if (HEADER_NAMES.includes(kanji.trim()) && readings.trim() === 'readings') continue
        // A kanji can appear on several lines (e.g. as a kanji and in a vocabulary word): merge them
        const set = known.get(kanji.trim()) ?? new Set()
        for (const reading of readings.split(';')) {
            if (reading.trim()) set.add(reading.trim())
        }
        known.set(kanji.trim(), set)
    }
    return known
}

export function knownToCsv(known) {
    return Papa.unparse([...known].map(([kanji, readings]) => [kanji, [...readings].join(';')]), { newline: '\n' })
}

// Returns a new Map where only the toggled kanji has a new Set:
// the other entries keep their identity, so unaffected paragraphs don't re-render.
function toggleReading(known, char, reading) {
    const readings = new Set(known.get(char))
    if (readings.has(reading)) readings.delete(reading)
    else readings.add(reading)
    const newKnown = new Map(known)
    if (readings.size) newKnown.set(char, readings)
    else newKnown.delete(char)
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
        case 'toggle': {
            // Apply pending edits of the textarea first, so they are not lost
            const known = state.edited ? csvToKnown(state.csv) : state.known
            return { csv: null, known: toggleReading(known, action.char, action.reading), edited: false }
        }
        default:
            throw new Error('Unknown action: ' + action.type)
    }
}

// The readings as CSV text, generated only when needed (display, download, saving)
export function vocabStateToCsv(state) {
    return state.csv ?? knownToCsv(state.known)
}
