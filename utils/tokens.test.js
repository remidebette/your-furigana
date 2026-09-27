import { unpackTokens } from './tokens'

describe('unpackTokens', () => {
    it('unpacks surface, reading and part of speech', () => {
        expect(unpackTokens('日本語\u001fニホンゴ\u001f名詞\u001e \u001f\u001f記号\u001eＸＹＺ\u001f\u001f名詞')).toEqual([
            { surface_form: '日本語', reading: 'ニホンゴ', pos: '名詞' },
            { surface_form: ' ', reading: '', pos: '記号' },
            { surface_form: 'ＸＹＺ', reading: '', pos: '名詞' },
        ])
    })

    it('returns no token for an empty string', () => {
        expect(unpackTokens('')).toEqual([])
    })
})
