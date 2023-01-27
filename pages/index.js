import { useState, useEffect, useReducer } from "react"
import { usePapaParse } from 'react-papaparse';
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"; 
import { Container, Button, Form } from 'react-bootstrap'

import styles from '../styles/japanese.module.css'
import useForm from "../utils/useForm";
import {convert} from "../components/rendered_text"
import {defaultDict} from "../utils/const";
import {
    patchTokens
} from "../utils/util";
import { VocabContext } from "../components/vocabContext";

export default function Home() {
    const initialState = {
        "apiKey": "",
        "csv": defaultDict,
        "text": ""
    };
    const [hideForm, setHideForm] = useState(false);

    const [kuroshiro, setKuroshiro] = useState(new Kuroshiro());
    const [isDictReady, setIsDictReady] = useState(false);

    const [tokens, setTokens] = useState([]);

    const [vocab, dispatchVocab] = useReducer(
        vocabReducer,
        {}  // Init value
    );
    const [furigana, setFurigana] = useState("");
    const { readString } = usePapaParse();

    const {values, setValues, handleChange, handleSubmit} = useForm(
        initialState,
        () => setHideForm(!hideForm)
    );

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

    useEffect(() => {
        const csvString = "kanji,reading\n".concat(values.csv.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''))
        readString(csvString, {
            worker: true,
            header: true,
            delimiter: ',',
            complete: (results) => {
                let readings = {};
                //console.log(results.errors);
                for (const row of results.data) {
                    if ("kanji" in row && "reading" in row) {
                        readings[row["kanji"]] = row["reading"]
                    }
                }

                dispatchVocab({type: "reset", vocab: readings});
            }
        })

    }, [values.csv])

    // Move to parent, separate parsed tokens from furigana to display
    useEffect(() => {
        const async_tokens = async () => {
            const rawTokens = await kuroshiro._analyzer.parse(values.text || "");
            const patched = patchTokens(rawTokens);

            setTokens(patched)
        }
        async_tokens().catch(console.error)
    }, [values.text])

    useEffect(() => {
        const async_furi = async () => {
            const result = await convert(tokens);

            setFurigana(result)
        }
        async_furi().catch(console.error)
    }, [tokens, vocab])

  return (
  <>
    <Container>
        <Form>
            {!hideForm &&
            <>
{/*          <Form.Group controlId="exampleForm.ControlInput1">
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
          </Form.Group>*/}
          <Form.Group controlId="exampleForm.ControlTextarea1">
            <Form.Label>CSV Data</Form.Label>
            <Form.Control
                as="textarea"
                placeholder="Paste here."
                rows={5}
                name="csv"
                value={values.csv}
                onChange={handleChange}
            />
          </Form.Group>
          <Form.Group controlId="exampleForm.ControlTextarea2">
            <Form.Label>Your text</Form.Label>
            <Form.Control
                as="textarea"
                placeholder="Paste here."
                rows={5}
                name="text"
                value={values.text}
                onChange={handleChange}
            />
          </Form.Group>
           </>
           }
          <Button variant="primary" type="submit" onClick={handleSubmit}>
            {hideForm ? "Settings" : "Hide Settings"}
          </Button>
        </Form>
    <br />
    {isDictReady && 
        <div lang="ja" className={styles.japanese}>
            <VocabContext.Provider value={{ vocab, dispatchVocab }}>
                {furigana}
            </VocabContext.Provider>
        </div>
        }
    </Container>
    </>
  )
}


function vocabReducer(vocab, action) {
    switch (action.type) {
        case 'reset': {
            return { ...action.vocab }
        }
        case 'add': {
            return (action.char in vocab) ? { ...vocab, [action.char]: vocab[action.char] + ";" + action.reading } : { ...vocab, [action.char]: action.reading };
        }
        case 'delete': {
            const readings = vocab[action.char].split(";")
            const newReadings = readings.filter((element) => { element === action.reading })
            return { ...vocab, [action.char]: newReadings.join(";") }
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}