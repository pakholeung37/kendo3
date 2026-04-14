import { config } from 'dotenv'

config()

const toNumber = (value: string | undefined, fallback: number) => {
    if (!value) {
        return fallback
    }

    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
        return fallback
    }

    return parsed
}

const port = toNumber(process.env.PORT, 1200)
const listenInaddrAny = process.env.LISTEN_INADDR_ANY === '1'

export const env = {
    appName: 'kendo3',
    host: listenInaddrAny ? '0.0.0.0' : '127.0.0.1',
    port,
    databasePath: process.env.DATABASE_PATH ?? './data/kendo3.sqlite',
    pollScanIntervalMs: toNumber(process.env.POLL_SCAN_INTERVAL_MS, 30_000),
    rssFetchTimeoutMs: toNumber(process.env.RSS_FETCH_TIMEOUT_MS, 15_000),
}
