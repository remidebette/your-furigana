import { tokensToSegments, segmentText } from './rendered_text'

// Minimal kuromoji-like tokens
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
})
