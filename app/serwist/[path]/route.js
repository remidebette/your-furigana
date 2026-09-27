import { spawnSync } from 'node:child_process'
import { createSerwistRoute } from '@serwist/turbopack'

// Changes on every deploy so the precached home page gets refreshed
const revision =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ??
    crypto.randomUUID()

// Builds worker/sw.js and serves it at /serwist/sw.js
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
    swSrc: 'worker/sw.js',
    useNativeEsbuild: true,
    // Classic (non-module) worker for the widest browser support
    esbuildOptions: { format: 'iife' },
    additionalPrecacheEntries: [{ url: '/', revision }],
    // The dictionary is cached at runtime instead, see worker/sw.js
    globIgnores: ['public/data/dict/**'],
})
