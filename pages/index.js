import { useState, useEffect } from "react"
import Papa from 'papaparse'
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

import { Container, Button, Form } from 'react-bootstrap'
import useForm from "../utils/useForm";
import {JapaneseText} from "../components/rendered_text"

export default function Home() {
    const initialState = {
        "apiKey": "",
        "csv": "",
        "text": ""
    };
    const [hideForm, setHideForm] = useState(false);
    const [vocab, setVocab] = useState(null);

    const [kuroshiro, setKuroshiro] = useState(new Kuroshiro());
    const [isDictReady, setIsDictReady] = useState(false);

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
        const ret = Papa.parse(values.csv.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''));
        let readings = {};
        for (const row of ret.data) {
            readings[row[0]] = row[1].split(";")
        }

        setVocab(readings);
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
