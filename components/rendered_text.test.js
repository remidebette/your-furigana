import { tokensToSegments, segmentText } from './rendered_text'

// Minimal tokens, as returned by utils/tokens.js
const token = (surface_form, reading, pos = '名詞') => ({ surface_form, reading, pos })

describe('tokensToSegments', () => {
    it('keeps kanji readings and merges the plain text around them', () => {
        const segments = tokensToSegments([
            token('日本', 'ニホン'), token('の', 'ノ', '助詞'), token('新聞', 'シンブン'), token('。', '。', '記号'),
        ])
        expect(segments).toEqual([
            { text: '日本', reading: 'にほん' }, 'の', { text: '新聞', reading: 'しんぶん' }, '。',
        ])
    })

    it('splits kanji and kana in mixed words', () => {
        expect(tokensToSegments([token('読み', 'ヨミ')])).toEqual([{ text: '読', reading: 'よ' }, 'み'])
    })

    it('shows no furigana for words the dictionary has no reading for', () => {
        // patchTokens uses the surface form as reading: the kanji themselves
        expect(tokensToSegments([{ surface_form: '鬱鬱', pos: '名詞' }])).toEqual(['鬱鬱'])
    })

    it('puts the reading over the whole word when it does not fit the kana', () => {
        expect(tokensToSegments([token('河原ぶろ', 'カワラ')])).toEqual([{ text: '河原ぶろ', reading: 'かわら' }])
    })
})

describe('segmentText', () => {
    const analyzer = { parse: jest.fn(async (line) => line ? [token(line, 'ヨミ', '記号')] : []) }

    it('tokenizes each line once and reuses unchanged lines', async () => {
        const cache = new Map()
        const first = await segmentText(analyzer, 'abc\ndef', cache)
        expect(first).toEqual([['abc'], ['def']])
        analyzer.parse.mockClear()
        const second = await segmentText(analyzer, 'abc\nxyz', cache)
        expect(analyzer.parse).toHaveBeenCalledTimes(1)
        expect(second[0]).toBe(first[0])
        expect([...cache.keys()]).toEqual(['abc', 'xyz'])
        expect(await segmentText(analyzer, '', cache)).toEqual([])
    })

    it('shares the segments of repeated lines', async () => {
        const cache = new Map()
        analyzer.parse.mockClear()
        const first = await segmentText(analyzer, 'abc\n\nabc\n', cache)
        expect(analyzer.parse).toHaveBeenCalledTimes(2)
        expect(first[2]).toBe(first[0])
        expect(first[3]).toBe(first[1])
        // Editing the last line keeps the identity of the others
        const second = await segmentText(analyzer, 'abc\n\nabc\nx', cache)
        expect(second.slice(0, 3).every((segments, i) => segments === first[i])).toBe(true)
    })
})
