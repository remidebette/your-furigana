import { isKanji, isHiragana, isKatakana, toRawHiragana } from "./util";

// Split a word into kanji groups with their part of the reading, and kana (okurigana) that
// are matched literally: splitFurigana("取り扱い", "とりあつかい")
//   -> [{ text: "取", reading: "と" }, "り", { text: "扱", reading: "あつか" }, "い"]
// Returns null when the reading doesn't fit the word (e.g. a truncated dictionary reading).

// Characters read together with the kanji around them
const KANJI_LIKE = new Set(["々", "〆", "〇", "ヶ", "ヵ"]);
const MIDDLE_DOT = "・";

// Small kana can be read as their full size version (三ッ矢 -> みつや)
const SMALL_KANA = { "ぁ": "あ", "ぃ": "い", "ぅ": "う", "ぇ": "え", "ぉ": "お", "っ": "つ", "ゃ": "や", "ゅ": "ゆ", "ょ": "よ", "ゎ": "わ" };
const fullSize = (kana) => kana.replace(/[ぁぃぅぇぉっゃゅょゎ]/g, (c) => SMALL_KANA[c]);

function isGroupChar(chars, i) {
    const c = chars[i];
    if (isKanji(c) || KANJI_LIKE.has(c)) return true;
    // ケ between kanji is read か / が (鹿ケ谷, 霞ケ関), not け
    if (c === "ケ") return i > 0 && isKanji(chars[i - 1]) && i + 1 < chars.length && isKanji(chars[i + 1]);
    return false;
}

function parseWord(surface) {
    const chars = [...surface];
    const kinds = chars.map((c, i) => {
        if (isGroupChar(chars, i)) return "group";
        if (c === MIDDLE_DOT) return "skip";
        if (isHiragana(c) || isKatakana(c)) return "kana";
        // Latin letters and digits have a reading too (ＮＴＴ -> えぬてぃーてぃー)
        return /[\p{L}\p{N}]/u.test(c) ? "group" : "skip";
    });
    // A middle dot between two groups belongs to them (小・中学生), as there is nothing to split on
    kinds.forEach((kind, i) => {
        if (chars[i] === MIDDLE_DOT && kinds[i - 1] === "group" && kinds[i + 1] === "group") kinds[i] = "group";
    });

    const parts = [];
    chars.forEach((c, i) => {
        const last = parts[parts.length - 1];
        if (kinds[i] === "group" && last?.kind === "group") last.text += c;
        else parts.push({ kind: kinds[i], text: c });
    });
    return parts;
}

export function splitFurigana(surface, reading) {
    const parts = parseWord(surface);
    let best = null;
    let bestCost = Infinity;

    // Try every way to share the reading between the kanji groups, each getting at least one kana.
    // Several splits can fit (好き嫌い: す+きら or すき+ら): keep the most balanced one, i.e. the
    // smallest maximum of kana per kanji, and the shortest first readings on ties.
    const search = (index, position, pieces, cost) => {
        if (cost >= bestCost) return;
        if (index === parts.length) {
            if (position === reading.length) {
                best = pieces;
                bestCost = cost;
            }
            return;
        }
        const part = parts[index];
        if (part.kind === "skip") return search(index + 1, position, [...pieces, part.text], cost);
        if (part.kind === "kana") {
            const kana = toRawHiragana(part.text);
            const next = position + kana.length;
            if (fullSize(reading.slice(position, next)) === fullSize(kana)) search(index + 1, next, [...pieces, part.text], cost);
            return;
        }
        const size = [...part.text].length;
        for (let end = position + 1; end <= reading.length; end++) {
            const piece = { text: part.text, reading: reading.slice(position, end) };
            search(index + 1, end, [...pieces, piece], Math.max(cost, (end - position) / size));
        }
    };
    search(0, 0, [], 0);
    return best;
}
