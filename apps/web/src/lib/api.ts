import type { FeedItemsResponse, Source, SourceRun } from './types'

const request = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, {
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
        ...init,
    })

    const payload = (await response.json().catch(() => null)) as { error?: string } | T | null

    if (!response.ok) {
        throw new Error((payload as { error?: string } | null)?.error ?? `Request failed with ${response.status}`)
    }

    return payload as T
}

const withSearchParams = (path: string, params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
        if (value) {
            searchParams.set(key, value)
        }
    }

    const queryString = searchParams.toString()
    return queryString ? `${path}?${queryString}` : path
}

export const api = {
    getSources: async () => request<{ items: Source[] }>('/api/sources'),
    createSource: async (payload: { id?: string; name?: string; endpoint: string; enabled?: boolean }) =>
        request<{ item: Source }>('/api/sources', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    updateSource: async (sourceId: string, payload: { name?: string; endpoint?: string; enabled?: boolean }) =>
        request<{ item: Source }>(`/api/sources/${sourceId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
    enableSource: async (sourceId: string) =>
        request<{ ok: boolean }>(`/api/sources/${sourceId}/enable`, {
            method: 'POST',
        }),
    disableSource: async (sourceId: string) =>
        request<{ ok: boolean }>(`/api/sources/${sourceId}/disable`, {
            method: 'POST',
        }),
    deleteSource: async (sourceId: string) =>
        request<{ ok: boolean }>(`/api/sources/${sourceId}`, {
            method: 'DELETE',
        }),
    fetchSource: async (sourceId: string) =>
        request<{ item: SourceRun }>(`/api/sources/${sourceId}/fetch`, {
            method: 'POST',
        }),
    getFeedItems: async (params: { sourceId?: string; cursor?: string; limit?: number }) =>
        request<FeedItemsResponse>(
            withSearchParams('/api/feed-items', {
                sourceId: params.sourceId,
                cursor: params.cursor,
                limit: params.limit ? String(params.limit) : undefined,
            }),
        ),
    getSourceRuns: async (params: { sourceId?: string; limit?: number }) =>
        request<{ items: SourceRun[] }>(
            withSearchParams('/api/source-runs', {
                sourceId: params.sourceId,
                limit: params.limit ? String(params.limit) : undefined,
            }),
        ),
}
