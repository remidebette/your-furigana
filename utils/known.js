// Is the reading of a word (a group of kanji getting furigana) known?
//
// `known` maps a word or a single kanji to the Set of its known readings. A reading starting
// with "-" is an exception: the word is shown with furigana even if its kanji are known.
//
// Besides exact entries, a compound counts as known when its reading can be built from known
// readings of each of its kanji: 学校 (がっこう) from 学 (がく) and 校 (こう), allowing for the
// usual sound changes (がく -> がっ, ほん -> ぼん). The same voicing applies to a word right after
// another kanji word: 真夏 + 日 (び) is known with 日 (ひ).

export const EXCEPTION_PREFIX = "-";

// Rendaku: the first kana of a kanji reading can become voiced inside a compound (日本 -> にっぽん, 本棚 -> ほんだな)
const VOICED = {
    "か": "が", "き": "ぎ", "く": "ぐ", "け": "げ", "こ": "ご",
    "さ": "ざ", "し": "じ", "す": "ず", "せ": "ぜ", "そ": "ぞ",
    "た": "だ", "ち": "ぢ", "つ": "づ", "て": "で", "と": "ど",
    "は": "ば", "ひ": "び", "ふ": "ぶ", "へ": "べ", "ほ": "ぼ",
};
const SEMI_VOICED = { "は": "ぱ", "ひ": "ぴ", "ふ": "ぷ", "へ": "ぺ", "ほ": "ぽ" };
// Sokuon: a reading ending in つ, く, ち or き can become っ before another kanji (学校 -> がっこう)
const GEMINATING = new Set(["つ", "く", "ち", "き"]);

// Forms a known reading can take: voiced when a kanji precedes it, っ when a kanji follows it
function variants(reading, canBeVoiced, canGeminate) {
    const starts = [reading];
    if (canBeVoiced) {
        for (const table of [VOICED, SEMI_VOICED]) {
            if (table[reading[0]]) starts.push(table[reading[0]] + reading.slice(1));
        }
    }
    if (!canGeminate || reading.length < 2 || !GEMINATING.has(reading[reading.length - 1])) return starts;
    return [...starts, ...starts.map((r) => r.slice(0, -1) + "っ")];
}

function composable(known, word, reading, afterKanji) {
    const chars = [...word];
    if (chars.length < 2) return false;
    // 々 repeats the previous kanji (人々)
    const kanji = chars.map((c, i) => c === "々" && i > 0 ? chars[i - 1] : c);
    const readingsOf = kanji.map((c) => [...(known.get(c) ?? [])].filter((r) => !r.startsWith(EXCEPTION_PREFIX)));
    if (readingsOf.some((readings) => readings.length === 0)) return false;

    // Can reading[position..] be built from the kanji index..end?
    const failed = new Set();
    const fits = (index, position) => {
        if (index === kanji.length) return position === reading.length;
        const key = index * 1000 + position;
        if (failed.has(key)) return false;
        const found = readingsOf[index].some((r) => variants(r, index > 0 || afterKanji, index < kanji.length - 1)
            .some((v) => reading.startsWith(v, position) && fits(index + 1, position + v.length)));
        if (!found) failed.add(key);
        return found;
    };
    return fits(0, 0);
}

// afterKanji: the word directly follows another kanji word, so its first kana can be voiced
// (真夏 + 日 read び, 世紀 + 頃 read ごろ)
export function isKnownReading(known, word, reading, afterKanji = false) {
    const readings = known.get(word);
    if (readings?.has(EXCEPTION_PREFIX + reading)) return false;
    if (readings?.has(reading)) return true;
    if (afterKanji && readings && [...readings].some((r) =>
        !r.startsWith(EXCEPTION_PREFIX) && variants(r, true, false).includes(reading))) return true;
    return composable(known, word, reading, afterKanji);
}
