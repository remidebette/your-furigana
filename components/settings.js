import { memo } from "react"
import { Form, Card, Nav } from "react-bootstrap"
import { UploadDownload } from "./files"

// File names get the time of the download
const textFileName = () => "your-furigana-" + new Date().toISOString() + ".txt"
const readingsFileName = () => "readings-" + new Date().toISOString() + ".csv"

// Memoized: toggling a reading in the text doesn't re-render the settings
// (every callback prop must be stable, see pages/index.js)
export const SettingsCard = memo(function SettingsCard({
    tab, onTabChange,
    text, onTextChange,
    csvText, onCsvChange, onCsvUpload,
    apiKey, onApiKeyChange,
    disabled
}) {
    return (
        <Card className="mb-3">
            <Card.Header>
                <Nav
                    variant="tabs"
                    activeKey={tab}
                    onSelect={onTabChange}
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
            <Form>
                {(function () {
                    switch (tab) {
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
                                            onChange={(event) => onTextChange(event.target.value)}
                                            disabled={disabled}
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
                                        setFile={onTextChange}
                                        downloadName={textFileName}
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
                                            onChange={(event) => onCsvChange(event.target.value)}
                                            disabled={disabled}
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
                                        setFile={onCsvUpload}
                                        downloadName={readingsFileName}
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
                                            onChange={(event) => onApiKeyChange(event.target.value)}
                                        />
                                    </Form.Group>
                                </Card.Body>
                            </>
                    }
                })()}

            </Form>
        </Card>
    )
})
