import 'bootstrap/dist/css/bootstrap.min.css'

import Head from 'next/head'
import Link from 'next/link'

import { useState } from "react"

import { Navbar, Nav, Button } from 'react-bootstrap'

import { Footer } from '../components/footer'
import { SerwistProvider } from '@serwist/turbopack/react'

function MyApp({ Component, pageProps }) {
    const [hideSettings, setHideSettings] = useState(false);

    return (
        <SerwistProvider
            swUrl="/serwist/sw.js"
            disable={process.env.NODE_ENV === 'development'}
            reloadOnOnline={false}
            options={{ type: 'classic' }}
        >
            <Head>
                <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover' />
                <meta name='description' content='Display furigana according to your own level on any text.' />
                <meta name='keywords' content='wanikani' />
                <title>Your Furigana</title>
            </Head>

            <Navbar sticky="top" expand="lg" style={{ "padding": "1rem" }} bg="white">
                <Navbar.Brand as={Link} href="/">Your Furigana</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                    <Button
                        variant="primary"
                        onClick={() => setHideSettings(!hideSettings)}
                    >
                        {hideSettings ? "Show settings" : "Hide settings"}
                    </Button>

                    <Nav className="mr-auto" variant="pills">

                        {/*              <Link href="/settings" passHref><Nav.Link>Settings</Nav.Link></Link>
                        <Link href="/list" passHref><Nav.Link>List</Nav.Link></Link>
                        <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                            <Link href="#action/3.1" passHref><NavDropdown.Item>Action</NavDropdown.Item></Link>
                            <Link href="#action/3.2" passHref><NavDropdown.Item>Another action</NavDropdown.Item></Link>
                            <Link href="#action/3.3" passHref><NavDropdown.Item>Something</NavDropdown.Item></Link>
                            <NavDropdown.Divider />
                            <Link href="#action/3.4" passHref><NavDropdown.Item>Separated link</NavDropdown.Item></Link>
                        </NavDropdown>*/}
                    </Nav>
                    {/*          <Form inline>
                        <FormControl type="text" placeholder="Search" className="mr-sm-2" />
                        <Button variant="outline-success">Search</Button>
                    </Form>*/}
                </Navbar.Collapse>
            </Navbar>
            <Component {...pageProps} hideSettings={hideSettings} />

            <Footer />
        </SerwistProvider>
    )
}

export default MyApp
