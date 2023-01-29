import '../styles/index.css'

import Head from 'next/head'
import Link from 'next/link'

import { useState } from "react"

import { Navbar, Nav, NavDropdown, Form, FormControl, Button } from 'react-bootstrap'

function MyApp({ Component, pageProps }) {
    const [hideSettings, setHideSettings] = useState(false);

    return (
        <>
            <Head>
        /*        <meta charSet='utf-8' />
                <meta httpEquiv='X-UA-Compatible' content='IE=edge' />*/
                <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover' />
                <meta name='description' content='Display furigana according to your own level on any text.' />
                <meta name='keywords' content='wanikani' />
                <title>Your Furigana</title>
        /*

                <link rel='manifest' href='/manifest.json' />
                <link rel='icon' sizes='16x16' type='image/png' href='/icons/favicon-16x16.png' />
                <link rel='icon' sizes='32x32' type='image/png' href='/icons/favicon-32x32.png' />
                <link rel='apple-touch-icon' sizes='57x57' href='/icons/apple-icon-57x57.png' />
                <link rel='apple-touch-icon' sizes='60x60' href='/icons/apple-icon-60x60.png' />
                <link rel='apple-touch-icon' sizes='72x72' href='/icons/apple-icon-72x72.png' />
                <link rel='apple-touch-icon' sizes='76x76' href='/icons/apple-icon-76x76.png' />
                <link rel='apple-touch-icon' sizes='114x114' href='/icons/apple-icon-114x114.png' />
                <link rel='apple-touch-icon' sizes='120x120' href='/icons/apple-icon-120x120.png' />
                <link rel='apple-touch-icon' sizes='144x144' href='/icons/apple-icon-144x144.png' />
                <link rel='apple-touch-icon' sizes='152x152' href='/icons/apple-icon-152x152.png' />
                <link rel='apple-touch-icon' sizes='180x180' href='/icons/apple-icon-180x180.png' />
                <link rel='icon' sizes='16x16' type='image/png' href='/icons/favicon-16x16.png' />
                <link rel='icon' sizes='32x32' type='image/png' href='/icons/favicon-32x32.png' />
                <link rel='icon' sizes='96x96' type='image/png' href='/icons/favicon-96x96.png' />
                <link rel='icon' sizes='192x192' type='image/png' href='/icons/android-icon-192x192.png' />

                <link rel='mask-icon' href='/icons/safari-pinned-tab.svg' color='#5bbad5' />
                <link rel='shortcut icon' href='/icons/favicon.ico' />
                */


                <meta name='theme-color' content='#000000' />

                <meta name='application-name' content='' />
                <meta name='apple-mobile-web-app-capable' content='yes' />
                <meta name='apple-mobile-web-app-status-bar-style' content='default' />
                <meta name='apple-mobile-web-app-title' content='' />
                <meta name='format-detection' content='telephone=no' />
                <meta name='mobile-web-app-capable' content='yes' />
                <meta name='msapplication-config' content='/icons/browserconfig.xml' />
                <meta name='msapplication-TileColor' content='#2B5797' />
                <meta name='msapplication-TileImage' content='/icons/ms-icon-144x144.png' />
                <meta name='msapplication-tap-highlight' content='no' />

                <meta name='twitter:card' content='' />
                <meta name='twitter:url' content='https://yourdomain.com' />
                <meta name='twitter:title' content='' />
                <meta name='twitter:description' content='' />
                <meta name='twitter:image' content='https://yourdomain.com/icons/android-icon-192x192.png' />
                <meta name='twitter:creator' content='@DavidWShadow' />
                <meta property='og:type' content='website' />
                <meta property='og:title' content='' />
                <meta property='og:description' content='' />
                <meta property='og:site_name' content='' />
                <meta property='og:url' content='https://yourdomain.com' />
                <meta property='og:image' content='https://yourdomain.com/icons/apple-icon.png' />
                */
            </Head>

            <Navbar sticky="top" expand="lg" style={{ "padding": "1rem" }} bg="white">
                <Link href="/" passHref><Navbar.Brand>Your Furigana</Navbar.Brand></Link>
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

            <footer className="page-footer font-small pt-4" style={{ "color": "#999999" }}>
                <div className="footer-copyright text-center py-3">More info on&nbsp;
                    <a href="https://github.com/remidebette/your-furigana" style={{ "color": "#999999" }}>Github</a>
                </div>

            </footer>
        </>
    )
}

export default MyApp
