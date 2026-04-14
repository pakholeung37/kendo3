import Parser from 'rss-parser'

import { env } from '../env'
import { extractSummary } from '../lib/text'
import { parseFeedTtl } from '../lib/time'
import type { SourceRow } from '../db/schema'
import type { AdapterFetchResult, NormalizedFeedItem, SourceAdapter } from './source-adapters'

interface ParsedFeedItem {
    guid?: string
    id?: string
    title?: string
    link?: string
    pubDate?: string
    isoDate?: string
    description?: string
    summary?: string
    content?: string
    contentSnippet?: string
    contentEncoded?: string
}

interface ParsedFeed {
    ttl?: string
    items?: ParsedFeedItem[]
}

const parser = new Parser({
    customFields: {
        feed: ['ttl'],
        item: [['content:encoded', 'contentEncoded'], 'summary', 'description'],
    },
})

const normalizeComparableLink = (link: string) => {
    try {
        const url = new URL(link)
        url.hash = ''
        return url.toString()
    } catch {
        return link.trim()
    }
}

const normalizeLink = (value: string | undefined, source: SourceRow) => {
    if (!value) {
        return source.endpoint
    }

    try {
        return new URL(value, source.endpoint).toString()
    } catch {
        return source.endpoint
    }
}

const parsePublishedAt = (item: ParsedFeedItem, fallback: number) => {
    const candidates = [item.pubDate, item.isoDate]

    for (const candidate of candidates) {
        if (!candidate) {
            continue
        }

        const parsed = Date.parse(candidate)

        if (Number.isFinite(parsed)) {
            return parsed
        }
    }

    return fallback
}

const normalizeItem = (item: ParsedFeedItem, source: SourceRow, fetchedAt: number): NormalizedFeedItem | null => {
    const title = item.title?.trim()

    if (!title) {
        return null
    }

    const link = normalizeLink(item.link, source)
    const comparableLink = normalizeComparableLink(link)
    const externalId = item.guid?.trim() || item.id?.trim() || null
    const publishedAt = parsePublishedAt(item, fetchedAt)
    const dedupeKey = externalId ?? (comparableLink || `${title}|${publishedAt}`)

    return {
        externalId,
        dedupeKey,
        title,
        summary: extractSummary(item.description, item.contentSnippet, item.summary, item.contentEncoded, item.content),
        link,
        publishedAt,
    }
}

export class HttpStatusError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'HttpStatusError'
        this.status = status
    }
}

export const fetchRssSource = async (source: SourceRow): Promise<AdapterFetchResult> => {
    const headers = new Headers({
        Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml;q=0.9, */*;q=0.8',
        'User-Agent': 'kendo3/0.1',
    })

    if (source.etag) {
        headers.set('If-None-Match', source.etag)
    }

    if (source.lastModified) {
        headers.set('If-Modified-Since', source.lastModified)
    }

    const response = await fetch(source.endpoint, {
        headers,
        signal: AbortSignal.timeout(env.rssFetchTimeoutMs),
    })

    const responseEtag = response.headers.get('etag')
    const responseLastModified = response.headers.get('last-modified')

    if (response.status === 304) {
        return {
            status: 'unchanged',
            httpStatus: response.status,
            parsedCount: 0,
            items: [],
            responseEtag,
            responseLastModified,
            ttlHintMin: null,
        }
    }

    if (!response.ok) {
        throw new HttpStatusError(response.status, `Upstream returned ${response.status}`)
    }

    const text = await response.text()
    const feed = (await parser.parseString(text)) as ParsedFeed
    const fetchedAt = Date.now()
    const seenDedupeKeys = new Set<string>()
    const items: NormalizedFeedItem[] = []

    for (const rawItem of feed.items ?? []) {
        const normalizedItem = normalizeItem(rawItem, source, fetchedAt)

        if (!normalizedItem || seenDedupeKeys.has(normalizedItem.dedupeKey)) {
            continue
        }

        seenDedupeKeys.add(normalizedItem.dedupeKey)
        items.push(normalizedItem)
    }

    return {
        status: 'success',
        httpStatus: response.status,
        parsedCount: items.length,
        items,
        responseEtag,
        responseLastModified,
        ttlHintMin: parseFeedTtl(feed.ttl),
    }
}

export const rssAdapter: SourceAdapter = {
    type: 'rss',
    fetch: fetchRssSource,
}
