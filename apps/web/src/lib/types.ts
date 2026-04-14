export type SourceStatus = 'active' | 'error' | 'disabled'

export interface Source {
    id: string
    type: 'rss'
    name: string
    endpoint: string
    enabled: boolean
    status: SourceStatus
    nextPollAt: number
    currentIntervalMin: number
    lastCheckedAt: number | null
    lastSuccessAt: number | null
    lastErrorAt: number | null
    lastErrorMessage: string | null
    consecutiveFailures: number
    itemCount: number
    isBusy: boolean
    createdAt: number
    updatedAt: number
}

export interface FeedItem {
    id: string
    title: string
    summary: string
    link: string
    publishedAt: number
    fetchedAt: number
    sourceId: string
    sourceName: string
}

export interface FeedItemsResponse {
    items: FeedItem[]
    nextCursor: string | null
}

export interface SourceRun {
    id: string
    sourceId: string
    sourceName?: string
    sourceEndpoint?: string
    trigger: 'scheduler' | 'manual'
    status: 'success' | 'unchanged' | 'error'
    httpStatus: number | null
    startedAt: number
    finishedAt: number
    durationMs: number
    parsedCount: number
    newCount: number
    errorMessage: string | null
}
