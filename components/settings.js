import { memo } from "react"
import { Alert, Button, Card, Form, Nav, Spinner } from "react-bootstrap"
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
    apiKey, onApiKeyChange, onImport, importStatus,
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
                        <Nav.Link eventKey="wanikani">WaniKani</Nav.Link>
                    </Nav.Item>
                </Nav>
            </Card.Header>
            <Form onSubmit={(event) => {
                // No page reload: Enter in the token field starts the import
                event.preventDefault()
                if (tab === "wanikani") onImport()
            }}>
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
                                            The readings you know, one kanji or word per line: &quot;kanji,reading1;reading2&quot;. A reading starting with &quot;-&quot; forces the furigana of a word whose kanji you know.
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
                                    <Form.Group controlId="wanikaniApiKey" className="mb-3">
                                        <Form.Label>WaniKani API token</Form.Label>
                                        <Form.Control
                                            type="password"
                                            autoComplete="off"
                                            placeholder="Paste your API token"
                                            name="apiKey"
                                            value={apiKey}
                                            onChange={(event) => onApiKeyChange(event.target.value)}
                                        />
                                        <Form.Text muted>
                                            Create a token (the default read-only permissions are enough) in your{" "}
                                            <a href="https://www.wanikani.com/settings/personal_access_tokens" target="_blank" rel="noreferrer">
                                                WaniKani settings
                                            </a>. It is kept in this browser and only sent to WaniKani.
                                        </Form.Text>
                                    </Form.Group>
                                    <Button type="submit" disabled={!apiKey.trim() || importStatus?.state === "running"}>
                                        {importStatus?.state === "running" && <Spinner size="sm" className="me-2" />}
                                        Import my progress
                                    </Button>
                                    <Form.Text muted className="d-block mt-2">
                                        Adds the readings of every kanji and word you have started on WaniKani to your
                                        readings. Your own changes are kept: import again whenever you level up.
                                    </Form.Text>
                                    {importStatus && importStatus.state !== "running" &&
                                        <Alert variant={importStatus.state === "error" ? "danger" : "success"} className="mt-3 mb-0">
                                            {importStatus.message}
                                        </Alert>
                                    }
                                    {importStatus?.state === "running" &&
                                        <Form.Text className="d-block mt-2">{importStatus.message}</Form.Text>
                                    }
                                </Card.Body>
                            </>
                    }
                })()}

            </Form>
        </Card>
    )
})
