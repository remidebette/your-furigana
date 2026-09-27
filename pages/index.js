import { useState, useEffect, useReducer, useRef, useMemo, useCallback } from "react"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { Container, Form, Card, Nav, Spinner } from 'react-bootstrap'

import styles from '../styles/japanese.module.css'
import { FuriganaText, segmentText } from "../components/rendered_text"
import { defaultCSV } from "../utils/const";
import { isNonEmptyString } from "../utils/util";
import { useDebouncedValue } from "../utils/hooks";
import { loadItem, saveItem } from "../utils/storage";
import { vocabReducer, initialVocabState, vocabStateToCsv } from "../utils/vocab";
import { UploadDownload } from "../components/files";

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

    const csvParseTimeout = useRef(null)
    function editCsv(value) {
        dispatch({ type: "edit-csv", csv: value })
        clearTimeout(csvParseTimeout.current)
        csvParseTimeout.current = setTimeout(() => dispatch({ type: "parse-csv" }), CSV_DEBOUNCE_MS)
    }

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
                    <Card className="mb-3">
                        <Card.Header>
                            <Nav
                                variant="tabs"
                                defaultActiveKey="text"
                                onSelect={(selectedTab) => setSettingTab(selectedTab)}
                            >
                                <Nav.Item>
                                    <Nav.Link eventKey="text">Text</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="readings">Readings</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="wanikani" disabled
                                    >
                                        Wanikani
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Header>
                        {/*<Card.Title>Special title treatment</Card.Title>
                            <Card.Text>
                                With supporting text below as a natural lead-in to additional content.
                </Card.Text>*/}

                        <Form>
                            {(function () {
                                switch (settingTab) {
                                    case "text":
                                        return <>
                                            <Card.Body>
                                                <Form.Group
                                                    controlId="exampleForm.ControlTextarea2"
                                                    className="mb-3"
                                                >
                                                    <Form.Label>Your text</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        placeholder="Paste here."
                                                        rows={5}
                                                        name="text"
                                                        value={text}
                                                        onChange={(event) => setText(event.target.value)}
                                                        disabled={!analyzer}
                                                    />
                                                    <Form.Text id="ControlTextarea2" muted>
                                                        Please type or paste some japanese text
                                                    </Form.Text>
                                                </Form.Group>
                                            </Card.Body>
                                            <Card.Footer>
                                                <UploadDownload
                                                    controlId="formFile"
                                                    className="mb-3"
                                                    //style={{ display: "flex" }}
                                                    label="Or upload / download the text file"
                                                    setFile={setText}
                                                    downloadName={"your-furigana-" + new Date().toISOString() + ".txt"}
                                                    downloadContent={text}
                                                ></UploadDownload>
                                            </Card.Footer>
                                        </>

                                    case "readings":
                                        return <>
                                            <Card.Body>
                                                <Form.Group
                                                    controlId="exampleForm.ControlTextarea1"
                                                    className="mb-3"
                                                >
                                                    <Form.Label>Readings Data</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        placeholder="Paste here."
                                                        rows={5}
                                                        name="csv"
                                                        value={csvText}
                                                        onChange={(event) => editCsv(event.target.value)}
                                                        disabled={!analyzer}
                                                    />
                                                    <Form.Text id="ControlTextarea1" muted>
                                                        A list of kanjis and readings to ignore, in the format &quot;kanji,reading1;reading2;reading3&quot;
                                                    </Form.Text>
                                                </Form.Group>
                                            </Card.Body>
                                            <Card.Footer>
                                                <UploadDownload
                                                    controlId="formFile2"
                                                    className="mb-3"
                                                    //style={{ display: "flex" }}
                                                    label="Or upload / download the readings file"
                                                    setFile={(content) => {
                                                        const trimmed = content.trim()
                                                        dispatch({
                                                            type: "load-csv",
                                                            // Drop the header line added by the download button
                                                            csv: trimmed.startsWith("kanji,readings\n") ? trimmed.slice(15) : trimmed
                                                        })
                                                    }}
                                                    downloadName={"readings-" + new Date().toISOString() + ".csv"}
                                                    downloadContent={"kanji,readings\n".concat(csvText)}
                                                ></UploadDownload>
                                            </Card.Footer>
                                        </>
                                    case "wanikani":
                                        return <>
                                            <Card.Body>
                                                <Form.Group controlId="exampleForm.ControlInput1">
                                                    <Form.Label>API Key</Form.Label>
                                                    <Form.Control
                                                        placeholder="API Key"
                                                        aria-label="API Key"
                                                        aria-describedby="api-key"
                                                        required
                                                        name="apiKey"
                                                        value={apiKey}
                                                        onChange={(event) => setApiKey(event.target.value)}
                                                    />
                                                </Form.Group>
                                            </Card.Body>
                                        </>
                                }
                            })()}

                        </Form>
                    </Card>
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