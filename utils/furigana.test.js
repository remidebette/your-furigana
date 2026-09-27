import { splitFurigana } from './furigana'

// Compact notation for the expectations: 取(と)り扱(あつか)い
const split = (surface, reading) => {
    const pieces = splitFurigana(surface, reading)
    return pieces && pieces.map((p) => typeof p === 'string' ? p : `${p.text}(${p.reading})`).join('')
}

describe('splitFurigana', () => {
    it('splits kanji and okurigana', () => {
        expect(split('取り扱い', 'とりあつかい')).toBe('取(と)り扱(あつか)い')
        expect(split('読み', 'よみ')).toBe('読(よ)み')
        expect(split('日本', 'にほん')).toBe('日本(にほん)')
    })

    it('never leaves a kanji without reading', () => {
        // The previous greedy regex gave 鳶(とびのも)の者() and 買(かい)い入()れ
        expect(split('鳶の者', 'とびのもの')).toBe('鳶(とび)の者(もの)')
        expect(split('買い入れ', 'かいいれ')).toBe('買(か)い入(い)れ')
        expect(split('生き生き', 'いきいき')).toBe('生(い)き生(い)き')
    })

    it('picks the most balanced split when several fit', () => {
        expect(split('好き嫌い', 'すききらい')).toBe('好(す)き嫌(きら)い')
        expect(split('通し柱', 'とおしばしら')).toBe('通(とお)し柱(ばしら)')
        expect(split('五つ紋', 'いつつもん')).toBe('五(いつ)つ紋(もん)')
        expect(split('居た堪らない', 'いたたまらない')).toBe('居(い)た堪(たま)らない')
    })

    it('matches katakana okurigana and small kana read full size', () => {
        expect(split('三ッ矢', 'みつや')).toBe('三(み)ッ矢(や)')
        expect(split('八ッ島', 'やつしま')).toBe('八(や)ッ島(しま)')
    })

    it('reads 々, ヶ and ケ between kanji with the kanji', () => {
        expect(split('麗々しい', 'れいれいしい')).toBe('麗々(れいれい)しい')
        expect(split('ヶ月', 'かげつ')).toBe('ヶ月(かげつ)')
        expect(split('霞ケ関', 'かすみがせき')).toBe('霞ケ関(かすみがせき)')
        expect(split('ケーキ屋', 'けーきや')).toBe('ケーキ屋(や)')
    })

    it('handles middle dots', () => {
        expect(split('小・中学生', 'しょうちゅうがくせい')).toBe('小・中学生(しょうちゅうがくせい)')
        expect(split('ラ・テ欄', 'らてらん')).toBe('ラ・テ欄(らん)')
    })

    it('returns null when the reading does not fit', () => {
        expect(splitFurigana('河原ぶろ', 'かわら')).toBeNull()
    })
})
