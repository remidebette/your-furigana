import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
    render() {
        return (
            <Html lang="fr">
                <Head>
                    <link rel='manifest' href='/manifest.webmanifest' />
                    <link rel='icon' type='image/png' sizes='32x32' href='/icons/favicon-32.png' />
                    <link rel='apple-touch-icon' href='/icons/apple-touch-icon.png' />
                    <meta name='theme-color' content='#c0392b' />
                    <meta name='mobile-web-app-capable' content='yes' />
                    <meta name='apple-mobile-web-app-title' content='Furigana' />
                    <meta name='apple-mobile-web-app-status-bar-style' content='default' />
                    <link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap' />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument
