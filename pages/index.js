import { useState, useEffect, useReducer, useRef, useMemo, useCallback } from "react"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { Container, Spinner } from 'react-bootstrap'

import styles from '../styles/japanese.module.css'
import { FuriganaText, segmentText } from "../components/rendered_text"
import { defaultCSV } from "../utils/const";
import { isNonEmptyString } from "../utils/util";
import { useDebouncedValue } from "../utils/hooks";
import { loadItem, saveItem } from "../utils/storage";
import { vocabReducer, initialVocabState, vocabStateToCsv } from "../utils/vocab";
import { SettingsCard } from "../components/settings";

// Wait for a pause in typing before re-rendering the furigana or parsing the readings
const TEXT_DEBOUNCE_MS = 150
const CSV_DEBOUNCE_MS = 300

export default function Home({ hideSettings }) {
    // Settings tab
    const [settingTab, setSettingTab] = useState("text");
    const [apiKey, setApiKey] = useState("");


    // ------ Kuromoji analyzer -------
    const [analyzer, setAnalyzer] = useState(null);

    useEffect(() => {
        let cancelled = false
        const newAnalyzer = new KuromojiAnalyzer({ dictPath: "/data/dict" })
        newAnalyzer.init().then(() => {
            if (cancelled) return
            setAnalyzer(newAnalyzer)
            // Ask the browser not to evict the cached dictionary (used offline) under storage pressure
            navigator.storage?.persist?.().catch(console.error)
        }).catch(console.error)
        return () => { cancelled = true }
    }, [])
    // ------------------------------------


    // ------------ Known readings ----------------
    const [vocabState, dispatch] = useReducer(vocabReducer, initialVocabState);
    const knownReadings = vocabState.known;
    const onToggle = useCallback((char, reading) => dispatch({ type: "toggle", char, reading }), []);

    // Stable callbacks, so the memoized <SettingsCard> skips re-rendering on toggles
    const csvParseTimeout = useRef(null)
    const editCsv = useCallback((value) => {
        dispatch({ type: "edit-csv", csv: value })
        clearTimeout(csvParseTimeout.current)
        csvParseTimeout.current = setTimeout(() => dispatch({ type: "parse-csv" }), CSV_DEBOUNCE_MS)
    }, [])
    const uploadCsv = useCallback((content) => {
        const trimmed = content.trim()
        dispatch({
            type: "load-csv",
            // Drop the header line added by the download button
            csv: trimmed.startsWith("kanji,readings\n") ? trimmed.slice(15) : trimmed
        })
    }, [])

    // Only generate the CSV text while the readings tab is shown, not on every toggle
    const showCsv = !hideSettings && settingTab === "readings"
    const csvText = useMemo(() => showCsv ? vocabStateToCsv(vocabState) : "", [showCsv, vocabState])
    // -----------------------------------------------


    // ---------- Text and furigana ----------
    const [text, setText] = useState("");
    const debouncedText = useDebouncedValue(text, TEXT_DEBOUNCE_MS);
    const [paragraphs, setParagraphs] = useState([]);
    const segmentCache = useRef(new Map());

    useEffect(() => {
        if (!analyzer) return
        let cancelled = false
        segmentText(analyzer, debouncedText, segmentCache.current)
            .then((result) => { if (!cancelled) setParagraphs(result) })
            .catch(console.error)
        return () => { cancelled = true }
    }, [analyzer, debouncedText])
    // ------------------------------------------


    // ---------- Local storage ----------
    const [loaded, setLoaded] = useState(false);

    // Restore the previous session. localStorage is only available in the browser, so this can't
    // happen during the static render: setting state once after hydration is intended here.
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        const storedCSV = loadItem("csv")
        dispatch({ type: "load-csv", csv: isNonEmptyString(storedCSV) ? storedCSV : defaultCSV })
        setText(loadItem("text") ?? "")
        setLoaded(true)
    }, [])
    /* eslint-enable react-hooks/set-state-in-effect */

    // Save after a pause, once the debounced value has caught up (never the initial empty state)
    const debouncedVocabState = useDebouncedValue(vocabState, CSV_DEBOUNCE_MS);
    useEffect(() => {
        if (loaded && debouncedVocabState === vocabState) saveItem("csv", vocabStateToCsv(vocabState))
    }, [loaded, debouncedVocabState, vocabState])

    useEffect(() => {
        if (loaded && debouncedText === text) saveItem("text", text)
    }, [loaded, debouncedText, text])

    // Don't lose the last changes if the page is closed during the debounce
    const latest = useRef(null)
    useEffect(() => {
        latest.current = loaded ? { vocabState, text } : null
    }, [loaded, vocabState, text])
    useEffect(() => {
        const flush = () => {
            if (!latest.current) return
            saveItem("csv", vocabStateToCsv(latest.current.vocabState))
            saveItem("text", latest.current.text)
        }
        window.addEventListener("pagehide", flush)
        return () => window.removeEventListener("pagehide", flush)
    }, [])
    // ------------------------------------------


    return (
        <>
            <Container>
                {!hideSettings &&
                    <SettingsCard
                        tab={settingTab}
                        onTabChange={setSettingTab}
                        text={text}
                        onTextChange={setText}
                        csvText={csvText}
                        onCsvChange={editCsv}
                        onCsvUpload={uploadCsv}
                        apiKey={apiKey}
                        onApiKeyChange={setApiKey}
                        disabled={!analyzer}
                    />
                }

                {analyzer ?
                    <div lang="ja" className={styles.japanese} style={{ whiteSpace: "pre-wrap" }}>
                        <FuriganaText paragraphs={paragraphs} knownReadings={knownReadings} onToggle={onToggle} />
                    </div>

                    : <div style={{ display: "flex", justifyContent: 'center' }}>
                        <Spinner />
                    </div>
                }

            </Container>
        </>
    )
}