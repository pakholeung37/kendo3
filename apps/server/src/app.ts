import { and, count, desc, eq, isNull, or, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'

import { db } from './db/client'
import { feedItems, sourceRuns, sources, type SourceRow } from './db/schema'
import { deriveSourceStatus } from './lib/status'
import { DEFAULT_POLL_INTERVAL_MINUTES } from './lib/time'
import { deriveSourceName } from './lib/text'
import { SourceBusyError, type SourcePoller } from './services/poller'
import type { SourceRunResult } from './services/source-runner'

const createSourceSchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    endpoint: z.url(),
    enabled: z.boolean().optional(),
})

const updateSourceSchema = z
    .object({
        name: z.string().trim().min(1).max(120).optional(),
        endpoint: z.url().optional(),
        enabled: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    })

const parseLimit = (value: string | undefined, fallback: number, max: number) => {
    const parsed = Number(value ?? fallback)

    if (!Number.isFinite(parsed)) {
        return fallback
    }

    return Math.max(1, Math.min(max, Math.round(parsed)))
}

const normalizeEndpoint = (value: string) => new URL(value).toString()

const jsonError = (status: number, message: string) =>
    new Response(JSON.stringify({ error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

const encodeCursor = (payload: { publishedAt: number; fetchedAt: number; id: string }) =>
    Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')

const decodeCursor = (value: string | undefined) => {
    if (!value) {
        return null
    }

    try {
        const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as {
            publishedAt: number
            fetchedAt: number
            id: string
        }

        if (!decoded.id || !Number.isFinite(decoded.publishedAt) || !Number.isFinite(decoded.fetchedAt)) {
            return null
        }

        return decoded
    } catch {
        return null
    }
}

const serializeSource = (source: SourceRow & { itemCount?: number }, isBusy = false) => ({
    id: source.id,
    type: source.type,
    name: source.name,
    endpoint: source.endpoint,
    enabled: source.enabled,
    status: deriveSourceStatus(source),
    nextPollAt: source.nextPollAt,
    currentIntervalMin: source.currentIntervalMin,
    lastCheckedAt: source.lastCheckedAt,
    lastSuccessAt: source.lastSuccessAt,
    lastErrorAt: source.lastErrorAt,
    lastErrorMessage: source.lastErrorMessage,
    consecutiveFailures: source.consecutiveFailures,
    itemCount: source.itemCount ?? 0,
    isBusy,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
})

const serializeRun = (run: {
    id: string
    sourceId: string
    sourceName?: string | null
    sourceEndpoint?: string | null
    trigger: string
    status: string
    httpStatus: number | null
    startedAt: number
    finishedAt: number
    durationMs: number
    parsedCount: number
    newCount: number
    errorMessage: string | null
}) => ({
    id: run.id,
    sourceId: run.sourceId,
    sourceName: run.sourceName ?? 'Unknown source',
    sourceEndpoint: run.sourceEndpoint ?? '',
    trigger: run.trigger,
    status: run.status,
    httpStatus: run.httpStatus,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: run.durationMs,
    parsedCount: run.parsedCount,
    newCount: run.newCount,
    errorMessage: run.errorMessage,
})

const getSourceById = (sourceId: string) =>
    db
        .select()
        .from(sources)
        .where(and(eq(sources.id, sourceId), isNull(sources.deletedAt)))
        .get()

export const createApp = (poller: SourcePoller) => {
    const app = new Hono()

    app.use(
        '*',
        cors({
            origin: '*',
        }),
    )

    app.get('/healthz', (c) => c.json({ ok: true }))

    app.get('/api/sources', (c) => {
        const rows = db
            .select({
                id: sources.id,
                type: sources.type,
                name: sources.name,
                endpoint: sources.endpoint,
                configJson: sources.configJson,
                enabled: sources.enabled,
                nextPollAt: sources.nextPollAt,
                currentIntervalMin: sources.currentIntervalMin,
                etag: sources.etag,
                lastModified: sources.lastModified,
                lastCheckedAt: sources.lastCheckedAt,
                lastSuccessAt: sources.lastSuccessAt,
                lastErrorAt: sources.lastErrorAt,
                lastErrorMessage: sources.lastErrorMessage,
                consecutiveFailures: sources.consecutiveFailures,
                deletedAt: sources.deletedAt,
                createdAt: sources.createdAt,
                updatedAt: sources.updatedAt,
                itemCount: count(feedItems.id),
            })
            .from(sources)
            .leftJoin(feedItems, eq(feedItems.sourceId, sources.id))
            .where(isNull(sources.deletedAt))
            .groupBy(sources.id)
            .orderBy(desc(sources.createdAt))
            .all()

        return c.json({
            items: rows.map((row) => serializeSource(row, poller.isSourceBusy(row.id))),
        })
    })

    app.post('/api/sources', async (c) => {
        const payload = createSourceSchema.safeParse(await c.req.json().catch(() => null))

        if (!payload.success) {
            return jsonError(400, payload.error.issues[0]?.message ?? 'Invalid payload')
        }

        const now = Date.now()
        const endpoint = normalizeEndpoint(payload.data.endpoint)
        const source: typeof sources.$inferInsert = {
            id: crypto.randomUUID(),
            type: 'rss',
            name: payload.data.name?.trim() || deriveSourceName(endpoint),
            endpoint,
            enabled: payload.data.enabled ?? true,
            configJson: '{}',
            nextPollAt: now,
            currentIntervalMin: DEFAULT_POLL_INTERVAL_MINUTES,
            createdAt: now,
            updatedAt: now,
        }

        try {
            db.insert(sources).values(source).run()
        } catch (error) {
            if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
                return jsonError(409, 'Source endpoint already exists')
            }

            throw error
        }

        const createdSource = getSourceById(source.id)

        if (!createdSource) {
            return jsonError(500, 'Failed to create source')
        }

        return c.json({ item: serializeSource(createdSource, false) }, 201)
    })

    app.patch('/api/sources/:id', async (c) => {
        const source = getSourceById(c.req.param('id'))

        if (!source) {
            return jsonError(404, 'Source not found')
        }

        const payload = updateSourceSchema.safeParse(await c.req.json().catch(() => null))

        if (!payload.success) {
            return jsonError(400, payload.error.issues[0]?.message ?? 'Invalid payload')
        }

        const now = Date.now()
        const nextValues: Partial<typeof sources.$inferInsert> = {
            updatedAt: now,
        }

        if (payload.data.name !== undefined) {
            nextValues.name = payload.data.name
        }

        if (payload.data.enabled !== undefined) {
            nextValues.enabled = payload.data.enabled
        }

        if (payload.data.endpoint !== undefined) {
            nextValues.endpoint = normalizeEndpoint(payload.data.endpoint)
            nextValues.etag = null
            nextValues.lastModified = null
            nextValues.nextPollAt = now
        }

        try {
            db.update(sources).set(nextValues).where(eq(sources.id, source.id)).run()
        } catch (error) {
            if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
                return jsonError(409, 'Source endpoint already exists')
            }

            throw error
        }

        const updatedSource = getSourceById(source.id)

        if (!updatedSource) {
            return jsonError(500, 'Failed to load updated source')
        }

        return c.json({
            item: serializeSource(updatedSource, poller.isSourceBusy(source.id)),
        })
    })

    app.post('/api/sources/:id/enable', (c) => {
        const source = getSourceById(c.req.param('id'))

        if (!source) {
            return jsonError(404, 'Source not found')
        }

        const now = Date.now()

        db.update(sources)
            .set({
                enabled: true,
                nextPollAt: now,
                updatedAt: now,
            })
            .where(eq(sources.id, source.id))
            .run()

        return c.json({ ok: true })
    })

    app.post('/api/sources/:id/disable', (c) => {
        const source = getSourceById(c.req.param('id'))

        if (!source) {
            return jsonError(404, 'Source not found')
        }

        db.update(sources)
            .set({
                enabled: false,
                updatedAt: Date.now(),
            })
            .where(eq(sources.id, source.id))
            .run()

        return c.json({ ok: true })
    })

    app.delete('/api/sources/:id', (c) => {
        const source = getSourceById(c.req.param('id'))

        if (!source) {
            return jsonError(404, 'Source not found')
        }

        const now = Date.now()

        db.update(sources)
            .set({
                enabled: false,
                deletedAt: now,
                updatedAt: now,
            })
            .where(eq(sources.id, source.id))
            .run()

        return c.json({ ok: true })
    })

    app.post('/api/sources/:id/fetch', async (c) => {
        const sourceId = c.req.param('id')

        try {
            const run = await poller.fetchNow(sourceId)

            if (!run) {
                return jsonError(404, 'Source not found')
            }

            return c.json({ item: serializeRun(run) })
        } catch (error) {
            if (error instanceof SourceBusyError) {
                return jsonError(409, error.message)
            }

            throw error
        }
    })

    app.get('/api/feed-items', (c) => {
        const sourceId = c.req.query('sourceId')?.trim() || undefined
        const limit = parseLimit(c.req.query('limit'), 30, 100)
        const cursor = decodeCursor(c.req.query('cursor'))
        const whereClauses = []

        if (sourceId) {
            whereClauses.push(eq(feedItems.sourceId, sourceId))
        }

        if (cursor) {
            whereClauses.push(
                or(
                    sql`${feedItems.publishedAt} < ${cursor.publishedAt}`,
                    and(sql`${feedItems.publishedAt} = ${cursor.publishedAt}`, sql`${feedItems.fetchedAt} < ${cursor.fetchedAt}`),
                    and(
                        sql`${feedItems.publishedAt} = ${cursor.publishedAt}`,
                        sql`${feedItems.fetchedAt} = ${cursor.fetchedAt}`,
                        sql`${feedItems.id} < ${cursor.id}`
                    ),
                ),
            )
        }

        const rows = db
            .select({
                id: feedItems.id,
                title: feedItems.title,
                summary: feedItems.summary,
                link: feedItems.link,
                publishedAt: feedItems.publishedAt,
                fetchedAt: feedItems.fetchedAt,
                sourceId: sources.id,
                sourceName: sources.name,
            })
            .from(feedItems)
            .innerJoin(sources, eq(feedItems.sourceId, sources.id))
            .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
            .orderBy(desc(feedItems.publishedAt), desc(feedItems.fetchedAt), desc(feedItems.id))
            .limit(limit + 1)
            .all()

        const hasMore = rows.length > limit
        const items = hasMore ? rows.slice(0, limit) : rows
        const lastItem = items.at(-1)

        return c.json({
            items,
            nextCursor:
                hasMore && lastItem
                    ? encodeCursor({
                          publishedAt: lastItem.publishedAt,
                          fetchedAt: lastItem.fetchedAt,
                          id: lastItem.id,
                      })
                    : null,
        })
    })

    app.get('/api/source-runs', (c) => {
        const sourceId = c.req.query('sourceId')?.trim() || undefined
        const limit = parseLimit(c.req.query('limit'), 100, 200)

        const rows = db
            .select({
                id: sourceRuns.id,
                sourceId: sourceRuns.sourceId,
                sourceName: sources.name,
                sourceEndpoint: sources.endpoint,
                trigger: sourceRuns.trigger,
                status: sourceRuns.status,
                httpStatus: sourceRuns.httpStatus,
                startedAt: sourceRuns.startedAt,
                finishedAt: sourceRuns.finishedAt,
                durationMs: sourceRuns.durationMs,
                parsedCount: sourceRuns.parsedCount,
                newCount: sourceRuns.newCount,
                errorMessage: sourceRuns.errorMessage,
            })
            .from(sourceRuns)
            .innerJoin(sources, eq(sourceRuns.sourceId, sources.id))
            .where(sourceId ? eq(sourceRuns.sourceId, sourceId) : undefined)
            .orderBy(desc(sourceRuns.startedAt))
            .limit(limit)
            .all()

        return c.json({
            items: rows.map((row) => serializeRun(row)),
        })
    })

    app.onError((error) => {
        console.error('[server] request failed', error)
        return jsonError(500, error.message || 'Internal server error')
    })

    return app
}
