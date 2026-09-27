import { defaultCache } from '@serwist/turbopack/worker'
import { CacheableResponsePlugin, CacheFirst, Serwist } from 'serwist'

const DICT_CACHE = 'kuromoji-dict'
const DICT_FILES = [
    'base.dat.gz',
    'cc.dat.gz',
    'check.dat.gz',
    'tid.dat.gz',
    'tid_map.dat.gz',
    'tid_pos.dat.gz',
    'unk.dat.gz',
    'unk_char.dat.gz',
    'unk_compat.dat.gz',
    'unk_invoke.dat.gz',
    'unk_map.dat.gz',
    'unk_pos.dat.gz',
].map((file) => `/data/dict/${file}`)

const serwist = new Serwist({
    // Injected at build time: the app shell (Next.js static assets, the home page, public files)
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        // The kuromoji dictionary (~18 MB) never changes: fetch it once on first use,
        // then always serve it from the cache so the app works offline.
        {
            matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/data/dict/'),
            handler: new CacheFirst({
                cacheName: DICT_CACHE,
                plugins: [new CacheableResponsePlugin({ statuses: [200] })],
            }),
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
