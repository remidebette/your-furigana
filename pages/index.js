import { useState, useEffect, useReducer } from "react"
import { usePapaParse } from 'react-papaparse';
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { Container, Form, Card, Nav, Spinner } from 'react-bootstrap'

import styles from '../styles/japanese.module.css'
import useForm from "../utils/useForm";
import { convert } from "../components/rendered_text"
import { defaultCSV } from "../utils/const";
import {
    patchTokens,
    isNonEmptyString
} from "../utils/util";
import { VocabContext } from "../components/vocabContext";
import { UploadDownload } from "../components/files";

export default function Home({ hideSettings }) {
    // Settings tab
    const [settingTab, setSettingTab] = useState("text");


    // Settings Form
    const initialFormValues = {
        "apiKey": "",
        "text": ""
    };
    const { formValues, setFormValues, handleFormChange, handleFormSubmit } = useForm(
        initialFormValues,
        () => { }
    );


    // ------ Kuroshiro dictionary -------
    const [dictionary, setDictionary] = useState(null);

    async function initDictionary() {
        const kuroshiro = new Kuroshiro()
        console.log("Initializing kuroshiro")
        const analyzer = new KuromojiAnalyzer({ dictPath: "/data/dict" })
        //const analyzer = new MecabAnalyzer();
        await kuroshiro.init(analyzer)
        setDictionary(kuroshiro)
        console.log("Kuroshiro is ready")
    }

    // Init Kuroshiro at first render
    useEffect(() => {
        initDictionary().catch(console.error)
    }, [])
    // ------------------------------------


    // ------------ Vocab CSV parsing ----------------
    const { readString, jsonToCSV } = usePapaParse();

    function CSV_to_vocab(csv) {
        const csvString = "kanji,readings\n".concat(csv)
        readString(csvString, {
            worker: true,
            header: true,
            delimiter: ',',
            complete: (results) => {
                let readings = {};
                //console.log(results.errors);
                for (const row of results.data) {
                    if ("kanji" in row && "readings" in row) {
                        readings[row["kanji"]] = row["readings"]
                    }
                }

                dispatch({ type: "set-vocab", vocab: readings });
            }
        })
    }

    function vocab_to_CSV(vocab) {
        const results = Object.entries(vocab).map(function (item) {
            return { "kanji": item[0], "readings": item[1] };
        })
        return jsonToCSV(results, { header: false, newline: "\n" })
    }
    // -----------------------------------------------------


    // ------------ Vocab Context ----------------------
    const [context, dispatch] = useReducer(
        vocabReducer,
        {
            csv: "",
            vocab: {}
        }  // Init value
    );

    // Init Csv from LocalStorage
    useEffect(() => {
        if (!dictionary) return
        const storedCSV = localStorage.getItem("csv")
        updateVocab(isNonEmptyString(storedCSV) ? storedCSV : defaultCSV)
    }, [dictionary])


    // Save CSV to LocalStorage
    useEffect(() => {
        if (!dictionary) return
        localStorage.setItem("csv", context.csv)
    }, [context.csv, dictionary])


    function updateVocab(value) {
        dispatch({
            type: "set-csv",
            csv: value
        })
        CSV_to_vocab(value)
        localStorage.setItem("csv", value)
    }
    // -----------------------------------------------


    // --------- Vocab reducer -----------------
    function vocabReducer(context, action) {
        switch (action.type) {
            case 'set-vocab': {
                return { vocab: { ...action.vocab }, csv: context.csv }
            }
            case 'set-csv': {
                const csvString = action.csv.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
                return { vocab: { ...context.vocab }, csv: csvString }
            }
            case 'add': {
                const newVocab = (action.char in context.vocab) ? { ...context.vocab, [action.char]: context.vocab[action.char] + ";" + action.reading } : { ...context.vocab, [action.char]: action.reading };
                return { vocab: newVocab, csv: vocab_to_CSV(newVocab) }
            }
            case 'delete': {
                const readings = context.vocab[action.char].split(";")
                const newReadings = readings.filter((element) => element !== action.reading)
                const newVocab = { ...context.vocab }
                const newReadingsString = newReadings.join(";")
                if (isNonEmptyString(newReadingsString)) {
                    newVocab[action.char] = newReadingsString
                } else {
                    delete newVocab[action.char]
                }
                return { vocab: newVocab, csv: vocab_to_CSV(newVocab) }
            }
            default: {
                throw Error('Unknown action: ' + action.type);
            }
        }
    }
    // -------------------------------------------------


    // ---------- Tokenized Furigana ----------
    const [tokens, setTokens] = useState([]);

    async function parseTextToTokens(text) {
        if (!dictionary) return
        try {
            const rawTokens = await dictionary._analyzer.parse(text)
            const patched = patchTokens(rawTokens)
            const result = await convert(patched)
            setTokens(result)
            localStorage.setItem('text', formValues.text)

        } catch (e) {
            console.error(e)
        }
    }

    // Init Text from Local storage
    useEffect(() => {
        if (!dictionary) return
        const storedText = localStorage.getItem("text")
        if (!storedText) return
        setFormValues(formValues => ({ ...formValues, "text": storedText }))
        parseTextToTokens(storedText).catch(console.error)
    }, [dictionary])

    // Parse Text
    useEffect(() => {
        parseTextToTokens(formValues.text).catch(console.error)
    }, [formValues.text])
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
                                                        value={formValues.text}
                                                        onChange={handleFormChange}
                                                        disabled={!dictionary}
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
                                                    setFile={(content) => { setFormValues({ ...formValues, "text": content }) }}
                                                    downloadName={"your-furigana-" + new Date().toISOString() + ".txt"}
                                                    downloadContent={formValues.text}
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
                                                        value={context.csv}
                                                        onChange={(event) => {
                                                            event.persist();
                                                            updateVocab(event.target.value)
                                                        }}
                                                        disabled={!dictionary}
                                                    />
                                                    <Form.Text id="ControlTextarea1" muted>
                                                        A list of kanjis and readings to ignore, in the format "kanji,reading1;reading2;reading3"
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
                                                        let trimmed = content.trim()
                                                        if (trimmed.startsWith("kanji,readings\n")) {
                                                            trimmed = trimmed.slice(15)
                                                        }
                                                        updateVocab(content)
                                                    }}
                                                    downloadName={"readings-" + new Date().toISOString() + ".csv"}
                                                    downloadContent={"kanji,readings\n".concat(context.csv)}
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
                                                        value={formValues.apiKey}
                                                        onChange={handleFormChange}
                                                    />
                                                </Form.Group>
                                            </Card.Body>
                                        </>
                                }
                            })()}

                        </Form>
                    </Card>
                }

                {!!dictionary ?
                    <div lang="ja" className={styles.japanese} style={{ whiteSpace: "pre-wrap" }}>
                        <VocabContext.Provider value={{ ...context, dispatch }}>
                            {tokens}
                        </VocabContext.Provider>
                    </div>

                    : <div style={{ display: "flex", justifyContent: 'center' }}>
                        <Spinner />
                    </div>
                }

            </Container>
        </>
    )
}