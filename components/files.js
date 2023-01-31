import { Form, Button, InputGroup } from 'react-bootstrap'
import { BsDownload } from "react-icons/bs";
import { readFileAsync, arrayBufferToString } from "../utils/files";

export function UploadDownload({ label, setFile, downloadName, downloadContent, ...props }) {
    async function uploadHandler(event) {
        event.persist();

        // TODO: add a file size limit with some error handling?
        let contentBuffer = await readFileAsync(event.target.files[0]);
        setFile(arrayBufferToString(contentBuffer));
    }

    function downloadTxtFile() {
        const file = new Blob([downloadContent], { type: "text/plain" });

        const element = document.createElement("a")
        element.href = URL.createObjectURL(file);
        element.download = downloadName;

        document.body.appendChild(element)
        element.click();
    }
    return <Form.Group {...props}>
        <Form.Label>{label}</Form.Label>
        <InputGroup>
            <Form.Control type="file" onChange={uploadHandler} />
            <Button
                variant="secondary"
                onClick={() => downloadTxtFile()}
            >
                <BsDownload />
            </Button>
        </InputGroup>

    </Form.Group>
}
