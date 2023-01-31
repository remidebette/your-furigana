import { useState, useEffect, useReducer } from "react"
import { usePapaParse } from 'react-papaparse';
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"; 
import { Container, Button, Form, Card, Nav } from 'react-bootstrap'

import styles from '../styles/japanese.module.css'
import useForm from "../utils/useForm";
import {convert} from "../components/rendered_text"
import {defaultDict} from "../utils/const";
import {
    patchTokens,
    isNonEmptyString
} from "../utils/util";
import { VocabContext } from "../components/vocabContext";

export default function Home({hideSettings}) {
    // Form
    const initialState = {
        "apiKey": "",
        "text": ""
    };
    const [settingKey , setSettingKey] = useState("text");
    const { values, setValues, handleChange, handleSubmit } = useForm(
        initialState,
        () => { }
    );

    // Kuroshiro
    const [kuroshiro, setKuroshiro] = useState(new Kuroshiro());
    const [isDictReady, setIsDictReady] = useState(false);

    // Vocab CSV parsing
    const { readString, jsonToCSV } = usePapaParse();


    // TODO: maintain the CSV updated after a change in Vocab
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

    // Vocab context
    const [context, dispatch] = useReducer(
        vocabReducer,
        {
            vocab: {},
            csv: defaultDict
        }  // Init value
    );

    // Text display
    const [tokens, setTokens] = useState([]);
    const [furigana, setFurigana] = useState("");

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

                dispatch({type: "set-vocab", vocab: readings});
            }
        })
    }

    function vocab_to_CSV(vocab) {
        const results = Object.entries(vocab).map(function (item) {
            return { "kanji": item[0], "readings": item[1] };
        })
        const csv = jsonToCSV(results, {header: false})

        return csv
    }

    // Initialize Kuroshiro
    useEffect(() => {
        const async_init = async () => {
            console.log("Initializing kuroshiro");
            const analyzer = new KuromojiAnalyzer({dictPath: "/data/dict"});
            //const analyzer = new MecabAnalyzer();
            await kuroshiro.init(analyzer);
            setIsDictReady(true);
            console.log("Kuroshiro is ready");
        }
        async_init().catch(console.error)
    }, [])

    // Set Vocab Context from Form CSV. Only the very first time
    useEffect(() => {
        CSV_to_vocab(context.csv)
    }, [])

    // Parse main text to Tokens
    useEffect(() => {
        const async_tokens = async () => {
            const rawTokens = await kuroshiro._analyzer.parse(values.text || "");
            const patched = patchTokens(rawTokens);

            setTokens(patched)
        }
        async_tokens().catch(console.error)
    }, [values.text])

    // Convert tokens to displayable React components
    useEffect(() => {
        const async_furi = async () => {
            const result = await convert(tokens);

            setFurigana(result)
        }
        async_furi().catch(console.error)
    }, [tokens, context.vocab])

    function DownloadButton({ filename, fileContent, ...props }) {
        function downloadTxtFile() {
            const file = new Blob([fileContent], { type: "text/plain" });

            const element = document.createElement("a")
            element.href = URL.createObjectURL(file);
            element.download = filename;

            document.body.appendChild(element)
            element.click();
        }

        return <Button
            {...props}
            onClick={() => downloadTxtFile()}
        >
            Download File
        </Button>;
    }

    return (
        <>
            <Container>
                {!hideSettings &&
                    <Card className="mb-3">
                        <Card.Header>
                            <Nav 
                                variant="tabs" 
                                defaultActiveKey="text"
                                onSelect={(selectedKey) => setSettingKey(selectedKey)}
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
                        <Card.Body>
                            {/*<Card.Title>Special title treatment</Card.Title>
                            <Card.Text>
                                With supporting text below as a natural lead-in to additional content.
                </Card.Text>*/}
                            
                            <Form>
                                {(function () {
                                    switch (settingKey) {
                                        case "text":
                                            return <Form.Group
                                                controlId="exampleForm.ControlTextarea2"
                                                className="mb-3"
                                            >
                                                <Form.Label>Your text</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    placeholder="Paste here."
                                                    rows={5}
                                                    name="text"
                                                    value={values.text}
                                                    onChange={handleChange}
                                                />
                                                <Form.Text id="ControlTextarea2" muted>
                                                    Please type or paste some japanese text
                                                </Form.Text>
                                            </Form.Group>

                                        case "readings":
                                            return <><Form.Group
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
                                                        dispatch({
                                                            type: "set-csv",
                                                            csv: event.target.value
                                                        })
                                                        CSV_to_vocab(event.target.value)
                                                    }}
                                                />
                                                <Form.Text id="ControlTextarea1" muted>
                                                    A list of kanjis and readings to ignore, in the format "kanji,reading1;reading2;reading3"
                                                </Form.Text>
                                            </Form.Group>
                                            <DownloadButton 
                                                variant="secondary"
                                                filename="readings.csv"
                                                fileContent={"kanji,readings\n".concat(context.csv)}
                                            >
                                                DownloadFile
                                            </DownloadButton>
                                            </>
                                        case "wanikani": 
                                            return <Form.Group controlId="exampleForm.ControlInput1">
                                                <Form.Label>API Key</Form.Label>
                                                <Form.Control
                                                    placeholder="API Key"
                                                    aria-label="API Key"
                                                    aria-describedby="api-key"
                                                    required
                                                    name="apiKey"
                                                    value={values.apiKey}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                    }
                                })()}





                            </Form>
                        </Card.Body>
                    </Card>
                }

                <br />

                {isDictReady && 
                    <div lang="ja" className={styles.japanese}>
                        <VocabContext.Provider value={{ ...context, dispatch }}>
                            {furigana}
                        </VocabContext.Provider>
                    </div>
                }

            </Container>
        </>
    )
}
