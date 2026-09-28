import { csvToKnown, knownToCsv, knownEntries, vocabReducer, initialVocabState, vocabStateToCsv } from './vocab'
import { isKnownReading } from './known'

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

describe('knownEntries', () => {
    it('stores words with okurigana as their kanji groups', () => {
        expect(knownEntries('一つ', 'ひとつ')).toEqual([['一', 'ひと']])
        expect(knownEntries('取り扱い', 'とりあつかい')).toEqual([['取', 'と'], ['扱', 'あつか']])
        expect(knownEntries('アメリカ人', 'アメリカじん')).toEqual([['人', 'じん']])
        expect(knownEntries('日本', 'ニホン')).toEqual([['日本', 'にほん']])
        expect(knownEntries('学校', '-がっこう')).toEqual([['学校', '-がっこう']])
    })

    it('fixes old csv files storing whole words', () => {
        expect(knownToCsv(csvToKnown('一つ,ひとつ\n入る,はいる'))).toBe('一,ひと\n入,はい')
    })
})

describe('toggle with compounds', () => {
    const state = vocabReducer(initialVocabState, { type: 'load-csv', csv: '学,がく\n校,こう' })

    it('adds an exception to show the furigana of a compound known through its kanji', () => {
        const shown = vocabReducer(state, { type: 'toggle', char: '学校', reading: 'がっこう' })
        expect(isKnownReading(shown.known, '学校', 'がっこう')).toBe(false)
        expect(vocabStateToCsv(shown)).toBe('学,がく\n校,こう\n学校,-がっこう')
        const hidden = vocabReducer(shown, { type: 'toggle', char: '学校', reading: 'がっこう' })
        expect(isKnownReading(hidden.known, '学校', 'がっこう')).toBe(true)
        expect(vocabStateToCsv(hidden)).toBe('学,がく\n校,こう')
    })
})

describe('add-readings', () => {
    it('only adds, keeping manual changes and the Sets that do not change', () => {
        const state = vocabReducer(initialVocabState, { type: 'load-csv', csv: '日,にち\n学校,-がっこう' })
        const added = vocabReducer(state, { type: 'add-readings', entries: [['日', 'にち'], ['月', 'がつ']] })
        expect(vocabStateToCsv(added)).toBe('日,にち\n学校,-がっこう\n月,がつ')
        expect(added.known.get('日')).toBe(state.known.get('日'))
    })
})

describe('toggle after a kanji word', () => {
    it('shows the furigana of a voiced reading known through the plain one, then hides it again', () => {
        const state = vocabReducer(initialVocabState, { type: 'load-csv', csv: '日,ひ' })
        const shown = vocabReducer(state, { type: 'toggle', char: '日', reading: 'び', afterKanji: true })
        expect(isKnownReading(shown.known, '日', 'び', true)).toBe(false)
        expect(vocabStateToCsv(shown)).toBe('日,ひ;-び')
        const hidden = vocabReducer(shown, { type: 'toggle', char: '日', reading: 'び', afterKanji: true })
        expect(vocabStateToCsv(hidden)).toBe('日,ひ')
    })
})
