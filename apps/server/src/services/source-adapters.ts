import type { SourceRow } from '../db/schema'
import { rssAdapter } from './rss-adapter'

export type SourceType = 'rss'

export interface NormalizedFeedItem {
    externalId: string | null
    dedupeKey: string
    title: string
    summary: string
    link: string
    publishedAt: number
}

export interface AdapterFetchResult {
    status: 'success' | 'unchanged'
    httpStatus: number
    parsedCount: number
    items: NormalizedFeedItem[]
    responseEtag: string | null
    responseLastModified: string | null
    ttlHintMin: number | null
}

export interface SourceAdapter {
    type: SourceType
    fetch(source: SourceRow): Promise<AdapterFetchResult>
}

const adapterRegistry: Record<SourceType, SourceAdapter> = {
    rss: rssAdapter,
}

export const resolveSourceAdapter = (type: SourceRow['type']) => {
    if (type !== 'rss') {
        throw new Error(`Unsupported source type: ${type}`)
    }

    return adapterRegistry[type]
}
