import { knownEntries } from "./vocab"

// WaniKani API v2: https://docs.api.wanikani.com
const API = "https://api.wanikani.com/v2"
const REVISION = "20170710"
// Subjects are requested by ids, in batches to keep the URLs short
const SUBJECTS_PER_REQUEST = 500

export class WaniKaniError extends Error {}

// Fetches every page of a collection
async function fetchCollection(url, apiKey, fetchImpl) {
    const items = []
    for (let next = url; next;) {
        const response = await fetchImpl(next, {
            headers: { Authorization: `Bearer ${apiKey}`, "Wanikani-Revision": REVISION },
        })
        if (response.status === 401) throw new WaniKaniError("WaniKani refused this API key: check it on your WaniKani settings page.")
        if (response.status === 429) throw new WaniKaniError("Too many requests to WaniKani: try again in a minute.")
        if (!response.ok) throw new WaniKaniError(`WaniKani answered with an error (${response.status}): try again later.`)
        const body = await response.json()
        items.push(...body.data)
        next = body.pages?.next_url
    }
    return items
}

// Readings of kanji and vocabulary subjects, as [word, reading] entries for the known readings.
// Only the readings WaniKani accepts as answers (the ones it teaches).
export function subjectsToEntries(subjects) {
    const entries = []
    for (const subject of subjects) {
        if (subject.object !== "kanji" && subject.object !== "vocabulary") continue
        // Vocabulary like 〜人 are suffixes: the 〜 is not part of the text
        const word = subject.data.characters?.replace(/[〜~]/g, "")
        if (!word) continue
        for (const reading of subject.data.readings ?? []) {
            if (reading.accepted_answer) entries.push(...knownEntries(word, reading.reading))
        }
    }
    return entries
}

// Everything the user has started learning (lessons done): kanji and vocabulary
export async function fetchStartedReadings(apiKey, { fetchImpl = fetch, onProgress = () => {} } = {}) {
    onProgress("Fetching your WaniKani progress…")
    const assignments = await fetchCollection(
        `${API}/assignments?started=true&subject_types=kanji,vocabulary`, apiKey, fetchImpl)
    const ids = [...new Set(assignments.map((assignment) => assignment.data.subject_id))]

    const subjects = []
    for (let start = 0; start < ids.length; start += SUBJECTS_PER_REQUEST) {
        onProgress(`Fetching the readings of ${ids.length} kanji and words… (${start}/${ids.length})`)
        const batch = ids.slice(start, start + SUBJECTS_PER_REQUEST)
        subjects.push(...await fetchCollection(`${API}/subjects?ids=${batch.join(",")}`, apiKey, fetchImpl))
    }
    return { entries: subjectsToEntries(subjects), items: subjects.length }
}
