import { defaultCache } from '@serwist/turbopack/worker'
import { CacheableResponsePlugin, CacheFirst, NetworkOnly, Serwist } from 'serwist'

const DICT_CACHE = 'ipadic-dict'
const DICT_FILES = [
    'metadata.json', 'char_def.bin', 'matrix.mtx',
    'dict.trie', 'dict.valsidx', 'dict.vals', 'dict.wordsidx', 'dict.words',
    'unk.bin',
].map((file) => `/data/ipadic/${file}.gz`)

const serwist = new Serwist({
    // Injected at build time: the app shell (Next.js static assets, the home page, public files)
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // The IPADIC dictionary (~10 MB) never changes: fetch it once on first use,
        // then always serve it from the cache so the app works offline.
        {
            matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/data/ipadic/'),
            handler: new CacheFirst({
                cacheName: DICT_CACHE,
                plugins: [new CacheableResponsePlugin({ statuses: [200] })],
            }),
        },
        // WaniKani API: personal data fetched with the user's token, never cached
        {
            matcher: ({ url }) => url.hostname === 'api.wanikani.com',
            handler: new NetworkOnly(),
        },
        ...defaultCache,
    ],
})

serwist.addEventListeners()

// On a first visit the page usually loads the dictionary before this worker controls it,
// so fill the cache in the background (mostly served from the HTTP cache, not re-downloaded).
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.open(DICT_CACHE).then((cache) =>
            Promise.all(
                DICT_FILES.map(async (url) => {
                    if (!(await cache.match(url))) await cache.add(url)
                }),
            ),
        ).catch(console.error),
    )
})
