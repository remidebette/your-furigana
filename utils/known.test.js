import { isKnownReading } from './known'

const known = (entries) => new Map(Object.entries(entries).map(([word, readings]) => [word, new Set(readings)]))

describe('isKnownReading', () => {
    it('knows exact entries', () => {
        expect(isKnownReading(known({ '日本': ['にほん'] }), '日本', 'にほん')).toBe(true)
        expect(isKnownReading(known({ '日本': ['にほん'] }), '日本', 'にっぽん')).toBe(false)
    })

    it('builds compounds from the readings of their kanji', () => {
        const k = known({ '学': ['がく'], '校': ['こう'], '生': ['せい'], '日': ['に', 'にち'], '本': ['ほん'], '人': ['ひと'] })
        expect(isKnownReading(k, '学生', 'がくせい')).toBe(true)
        expect(isKnownReading(k, '学校', 'がっこう')).toBe(true)   // がく -> がっ
        expect(isKnownReading(k, '人々', 'ひとびと')).toBe(true)   // 々 repeats 人, ひと -> びと
        expect(isKnownReading(k, '学生', 'がくしょう')).toBe(false)
        expect(isKnownReading(k, '大学', 'だいがく')).toBe(false)  // 大 unknown
    })

    it('allows the semi-voiced sound change', () => {
        expect(isKnownReading(known({ '日': ['にち'], '本': ['ほん'] }), '日本', 'にっぽん')).toBe(true)
    })

    it('does not compose a single kanji', () => {
        expect(isKnownReading(known({ '本': ['ほん'] }), '本', 'ぼん')).toBe(false)
    })

    it('lets an exception win over the kanji', () => {
        const k = known({ '学': ['がく'], '校': ['こう'], '学校': ['-がっこう'] })
        expect(isKnownReading(k, '学校', 'がっこう')).toBe(false)
    })

    it('voices the first kana of a word right after another kanji word', () => {
        const k = known({ '日': ['ひ', 'にち'], '頃': ['ころ'], '寿司': ['すし'], '稲': ['いね'], '沿': ['そ'] })
        expect(isKnownReading(k, '日', 'び', true)).toBe(true)        // 真夏 + 日
        expect(isKnownReading(k, '頃', 'ごろ', true)).toBe(true)      // 世紀 + 頃
        expect(isKnownReading(k, '寿司', 'ずし', true)).toBe(true)    // 稲荷 + 寿司
        expect(isKnownReading(k, '日', 'び')).toBe(false)             // not after a kanji word
        expect(isKnownReading(k, '沿', 'ぞ', true)).toBe(true)
        expect(isKnownReading(k, '日', 'ぴ', true)).toBe(true)        // semi-voiced
        expect(isKnownReading(k, '日', 'じつ', true)).toBe(false)     // not a sound change of a known reading
    })

    it('voices the first kanji of a compound right after another kanji word', () => {
        const k = known({ '島': ['しま'], '国': ['くに'] })
        expect(isKnownReading(k, '島国', 'じまぐに', true)).toBe(true)
        expect(isKnownReading(k, '島国', 'じまぐに')).toBe(false)
    })
})
