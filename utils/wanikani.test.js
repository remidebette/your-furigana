import { fetchStartedReadings, subjectsToEntries, WaniKaniError } from './wanikani'

const kanji = (id, characters, readings) => ({ id, object: 'kanji', data: { characters, readings } })
const vocabulary = (id, characters, readings) => ({ id, object: 'vocabulary', data: { characters, readings } })
const reading = (text, accepted = true) => ({ reading: text, accepted_answer: accepted, primary: accepted })

describe('subjectsToEntries', () => {
    it('keeps the accepted readings, split into kanji groups', () => {
        expect(subjectsToEntries([
            kanji(1, '一', [reading('いち'), reading('ひと'), reading('かず', false)]),
            vocabulary(2, '一つ', [reading('ひとつ')]),
            vocabulary(3, '日本語', [reading('にほんご')]),
            vocabulary(4, '〜人', [reading('じん'), reading('にん')]),
            { id: 5, object: 'kana_vocabulary', data: { characters: 'ソフト', readings: [] } },
            { id: 6, object: 'radical', data: { characters: '一' } },
        ])).toEqual([['一', 'いち'], ['一', 'ひと'], ['一', 'ひと'], ['日本語', 'にほんご'], ['人', 'じん'], ['人', 'にん']])
    })
})

describe('fetchStartedReadings', () => {
    // Fake WaniKani API: two pages of assignments, then the subjects asked for by id
    const subjects = { 1: kanji(1, '学', [reading('がく')]), 2: kanji(2, '校', [reading('こう')]), 3: vocabulary(3, '学ぶ', [reading('まなぶ')]) }
    const api = (status = 200) => jest.fn(async (url, { headers }) => {
        expect(headers.Authorization).toBe('Bearer token')
        const json = (body) => ({ ok: status === 200, status, json: async () => body })
        if (url.includes('/assignments') && !url.includes('page=2')) {
            return json({ data: [{ data: { subject_id: 1 } }, { data: { subject_id: 2 } }], pages: { next_url: 'https://api.wanikani.com/v2/assignments?page=2' } })
        }
        if (url.includes('/assignments')) return json({ data: [{ data: { subject_id: 3 } }], pages: { next_url: null } })
        const ids = new URL(url).searchParams.get('ids').split(',')
        return json({ data: ids.map((id) => subjects[id]), pages: { next_url: null } })
    })

    it('follows the pages and returns the readings', async () => {
        const fetchImpl = api()
        const { entries, items } = await fetchStartedReadings('token', { fetchImpl })
        expect(fetchImpl.mock.calls[0][0]).toContain('started=true')
        expect(items).toBe(3)
        expect(entries).toEqual([['学', 'がく'], ['校', 'こう'], ['学', 'まな']])
    })

    it('explains a refused token', async () => {
        await expect(fetchStartedReadings('token', { fetchImpl: api(401) })).rejects.toThrow(WaniKaniError)
        await expect(fetchStartedReadings('token', { fetchImpl: api(401) })).rejects.toThrow(/refused this API key/)
    })
})
