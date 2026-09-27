import { StrType, getStrType, toRawHiragana, isNonEmptyString } from './util'

describe('getStrType', () => {
    it('classifies kanji, mixed, kana and other strings', () => {
        expect(getStrType('日本')).toBe(StrType.KANJI)
        expect(getStrType('読み')).toBe(StrType.MIXED)
        expect(getStrType('ひらがなカタカナ')).toBe(StrType.KANA)
        expect(getStrType('abc')).toBe(StrType.OTHER)
    })
})

describe('toRawHiragana', () => {
    it('converts katakana to hiragana', () => {
        expect(toRawHiragana('ニホン')).toBe('にほん')
    })
})

describe('isNonEmptyString', () => {
    it('only accepts non-empty strings', () => {
        expect(isNonEmptyString('a')).toBe(true)
        expect(isNonEmptyString('')).toBe(false)
        expect(isNonEmptyString(null)).toBe(false)
    })
})
