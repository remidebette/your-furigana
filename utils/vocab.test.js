import { csvToKnown, knownToCsv, vocabReducer, initialVocabState, vocabStateToCsv } from './vocab'

const asObject = (known) => Object.fromEntries([...known].map(([k, v]) => [k, [...v]]))

describe('csvToKnown', () => {
    it('parses lines, skips the header and blank lines', () => {
        expect(asObject(csvToKnown('kanji,readings\n日本,にほん;にっぽん\n\n月, がつ \n'))).toEqual({
            '日本': ['にほん', 'にっぽん'],
            '月': ['がつ'],
        })
        expect(asObject(csvToKnown('char,readings\n一,いち'))).toEqual({ '一': ['いち'] })
    })

    it('merges kanji listed on several lines', () => {
        expect(asObject(csvToKnown('一,いち;ひと\n一,いち\n方,かた\n方,ほう'))).toEqual({
            '一': ['いち', 'ひと'],
            '方': ['かた', 'ほう'],
        })
    })

    it('ignores incomplete lines', () => {
        expect(asObject(csvToKnown('日\n月,がつ'))).toEqual({ '月': ['がつ'] })
    })
})

describe('knownToCsv', () => {
    it('round-trips with csvToKnown', () => {
        const csv = '日本,にほん;にっぽん\n月,がつ'
        expect(knownToCsv(csvToKnown(csv))).toBe(csv)
    })
})

describe('vocabReducer', () => {
    const loaded = vocabReducer(initialVocabState, { type: 'load-csv', csv: '  日,にち\n月,がつ\n' })

    it('loads and trims a csv', () => {
        expect(loaded.csv).toBe('日,にち\n月,がつ')
        expect(asObject(loaded.known)).toEqual({ '日': ['にち'], '月': ['がつ'] })
    })

    it('toggles a reading on and off', () => {
        const added = vocabReducer(loaded, { type: 'toggle', char: '日', reading: 'ひ' })
        expect(asObject(added.known)['日']).toEqual(['にち', 'ひ'])
        expect(vocabStateToCsv(added)).toBe('日,にち;ひ\n月,がつ')
        const removed = vocabReducer(added, { type: 'toggle', char: '日', reading: 'にち' })
        const empty = vocabReducer(removed, { type: 'toggle', char: '日', reading: 'ひ' })
        expect(vocabStateToCsv(empty)).toBe('月,がつ')
    })

    it('only replaces the Set of the toggled kanji', () => {
        const added = vocabReducer(loaded, { type: 'toggle', char: '日', reading: 'ひ' })
        expect(added.known.get('月')).toBe(loaded.known.get('月'))
        expect(added.known.get('日')).not.toBe(loaded.known.get('日'))
        expect(loaded.known.get('日').has('ひ')).toBe(false)
    })

    it('keeps the typed csv until parse-csv', () => {
        const edited = vocabReducer(loaded, { type: 'edit-csv', csv: '日,にち\n火,か\n' })
        expect(vocabStateToCsv(edited)).toBe('日,にち\n火,か\n')
        expect(edited.known.has('火')).toBe(false)
        expect(vocabReducer(edited, { type: 'parse-csv' }).known.has('火')).toBe(true)
    })

    it('keeps pending textarea edits when toggling before they are parsed', () => {
        const edited = vocabReducer(loaded, { type: 'edit-csv', csv: '日,にち\n火,か' })
        const toggled = vocabReducer(edited, { type: 'toggle', char: '日', reading: 'ひ' })
        expect(vocabStateToCsv(toggled)).toBe('日,にち;ひ\n火,か')
        expect(vocabReducer(toggled, { type: 'parse-csv' })).toBe(toggled)
    })
})
