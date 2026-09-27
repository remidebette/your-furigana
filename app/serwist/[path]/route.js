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
    // Serwist's default patterns, plus the tokenizer's .wasm (emitted in .next/static/media)
    globPatterns: [
        '.next/static/**/*.{js,css,html,ico,apng,png,avif,jpg,jpeg,jfif,pjpeg,pjp,gif,svg,webp,json,webmanifest,wasm}',
        'public/**/*',
    ],
    // The dictionary is cached at runtime instead, and the notices are only read on demand
    globIgnores: ['public/data/ipadic/**', 'public/THIRD_PARTY_NOTICES.txt'],
})
