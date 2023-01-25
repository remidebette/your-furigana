import { useState, useEffect } from "react"
import { usePapaParse } from 'react-papaparse';
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

import { Container, Button, Form } from 'react-bootstrap'
import useForm from "../utils/useForm";
import {JapaneseText} from "../components/rendered_text"
import {defaultDict} from "../utils/const";

export default function Home() {
    const initialState = {
        "apiKey": "",
        "csv": defaultDict,
        "text": ""
    };
    const [hideForm, setHideForm] = useState(false);
    const [vocab, setVocab] = useState(null);

    const [kuroshiro, setKuroshiro] = useState(new Kuroshiro());
    const [isDictReady, setIsDictReady] = useState(false);
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

                setVocab(readings);
            }
        })

    }, [values.csv])

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
    {isDictReady && <JapaneseText text={values.text} vocab={vocab} kuroshiro={kuroshiro}/>}
    </Container>
    </>
  )
}
