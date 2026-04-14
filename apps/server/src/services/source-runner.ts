import { and, eq, sql } from 'drizzle-orm'

import { db } from '../db/client'
import { feedItems, sourceRuns, sources, type SourceRow } from '../db/schema'
import { computeNextPollIntervalMinutes, DEFAULT_POLL_INTERVAL_MINUTES } from '../lib/time'
import { HttpStatusError } from './rss-adapter'
import { resolveSourceAdapter } from './source-adapters'

export type SourceRunTrigger = 'scheduler' | 'manual'
export type SourceRunStatus = 'success' | 'unchanged' | 'error'

export interface SourceRunResult {
    id: string
    sourceId: string
    trigger: SourceRunTrigger
    status: SourceRunStatus
    httpStatus: number | null
    startedAt: number
    finishedAt: number
    durationMs: number
    parsedCount: number
    newCount: number
    errorMessage: string | null
    responseEtag: string | null
    responseLastModified: string | null
}

const nextPollAtFromNow = (minutes: number) => Date.now() + minutes * 60_000

export const fetchAndStoreSource = async (source: SourceRow, trigger: SourceRunTrigger): Promise<SourceRunResult> => {
    const adapter = resolveSourceAdapter(source.type)
    const startedAt = Date.now()
    const runId = crypto.randomUUID()

    try {
        const result = await adapter.fetch(source)
        const finishedAt = Date.now()
        const nextIntervalMin = computeNextPollIntervalMinutes({
            currentIntervalMin: source.currentIntervalMin || DEFAULT_POLL_INTERVAL_MINUTES,
            status: result.status,
            ttlHintMin: result.ttlHintMin,
            newCount: result.items.length,
        })

        let newCount = 0

        db.transaction((tx) => {
            for (const item of result.items) {
                const existingItem = tx
                    .select({
                        id: feedItems.id,
                    })
                    .from(feedItems)
                    .where(and(eq(feedItems.sourceId, source.id), eq(feedItems.dedupeKey, item.dedupeKey)))
                    .get()

                if (existingItem) {
                    continue
                }

                tx.insert(feedItems)
                    .values({
                        id: crypto.randomUUID(),
                        sourceId: source.id,
                        externalId: item.externalId,
                        dedupeKey: item.dedupeKey,
                        title: item.title,
                        summary: item.summary,
                        link: item.link,
                        publishedAt: item.publishedAt,
                        fetchedAt: finishedAt,
                        createdAt: finishedAt,
                    })
                    .run()

                newCount += 1
            }

            tx.insert(sourceRuns)
                .values({
                    id: runId,
                    sourceId: source.id,
                    trigger,
                    status: result.status,
                    httpStatus: result.httpStatus,
                    startedAt,
                    finishedAt,
                    durationMs: finishedAt - startedAt,
                    parsedCount: result.parsedCount,
                    newCount,
                    errorMessage: null,
                    responseEtag: result.responseEtag,
                    responseLastModified: result.responseLastModified,
                    createdAt: finishedAt,
                })
                .run()

            tx.update(sources)
                .set({
                    etag: result.responseEtag ?? source.etag,
                    lastModified: result.responseLastModified ?? source.lastModified,
                    nextPollAt: nextPollAtFromNow(nextIntervalMin),
                    currentIntervalMin: nextIntervalMin,
                    lastCheckedAt: finishedAt,
                    lastSuccessAt: finishedAt,
                    lastErrorAt: null,
                    lastErrorMessage: null,
                    consecutiveFailures: 0,
                    updatedAt: finishedAt,
                })
                .where(eq(sources.id, source.id))
                .run()
        })

        return {
            id: runId,
            sourceId: source.id,
            trigger,
            status: result.status,
            httpStatus: result.httpStatus,
            startedAt,
            finishedAt,
            durationMs: finishedAt - startedAt,
            parsedCount: result.parsedCount,
            newCount,
            errorMessage: null,
            responseEtag: result.responseEtag,
            responseLastModified: result.responseLastModified,
        }
    } catch (error) {
        const finishedAt = Date.now()
        const nextIntervalMin = computeNextPollIntervalMinutes({
            currentIntervalMin: source.currentIntervalMin || DEFAULT_POLL_INTERVAL_MINUTES,
            status: 'error',
        })
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        const httpStatus = error instanceof HttpStatusError ? error.status : null

        db.transaction((tx) => {
            tx.insert(sourceRuns)
                .values({
                    id: runId,
                    sourceId: source.id,
                    trigger,
                    status: 'error',
                    httpStatus,
                    startedAt,
                    finishedAt,
                    durationMs: finishedAt - startedAt,
                    parsedCount: 0,
                    newCount: 0,
                    errorMessage,
                    responseEtag: null,
                    responseLastModified: null,
                    createdAt: finishedAt,
                })
                .run()

            tx.update(sources)
                .set({
                    nextPollAt: nextPollAtFromNow(nextIntervalMin),
                    currentIntervalMin: nextIntervalMin,
                    lastCheckedAt: finishedAt,
                    lastErrorAt: finishedAt,
                    lastErrorMessage: errorMessage,
                    consecutiveFailures: sql`${sources.consecutiveFailures} + 1`,
                    updatedAt: finishedAt,
                })
                .where(eq(sources.id, source.id))
                .run()
        })

        return {
            id: runId,
            sourceId: source.id,
            trigger,
            status: 'error',
            httpStatus,
            startedAt,
            finishedAt,
            durationMs: finishedAt - startedAt,
            parsedCount: 0,
            newCount: 0,
            errorMessage,
            responseEtag: null,
            responseLastModified: null,
        }
    }
}
