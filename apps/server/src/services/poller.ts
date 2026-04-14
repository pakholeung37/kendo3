import { and, asc, eq, isNull, lte } from 'drizzle-orm'

import { db } from '../db/client'
import { sources } from '../db/schema'
import { env } from '../env'
import { fetchAndStoreSource, type SourceRunResult, type SourceRunTrigger } from './source-runner'

export class SourceBusyError extends Error {
    constructor() {
        super('Source is already being fetched')
        this.name = 'SourceBusyError'
    }
}

export class SourcePoller {
    #inFlight = new Set<string>()
    #tickTimer?: ReturnType<typeof setInterval>
    #tickInProgress = false

    start() {
        if (this.#tickTimer) {
            return
        }

        this.#tickTimer = setInterval(() => {
            void this.tick()
        }, env.pollScanIntervalMs)

        void this.tick()
    }

    stop() {
        if (!this.#tickTimer) {
            return
        }

        clearInterval(this.#tickTimer)
        this.#tickTimer = undefined
    }

    isSourceBusy(sourceId: string) {
        return this.#inFlight.has(sourceId)
    }

    async fetchNow(sourceId: string, trigger: SourceRunTrigger = 'manual') {
        const source = db
            .select()
            .from(sources)
            .where(and(eq(sources.id, sourceId), isNull(sources.deletedAt)))
            .get()

        if (!source) {
            return null
        }

        return this.runSource(source, trigger)
    }

    async tick() {
        if (this.#tickInProgress) {
            return
        }

        this.#tickInProgress = true

        try {
            const now = Date.now()
            const dueSources = db
                .select()
                .from(sources)
                .where(and(eq(sources.enabled, true), isNull(sources.deletedAt), lte(sources.nextPollAt, now)))
                .orderBy(asc(sources.nextPollAt))
                .limit(10)
                .all()

            for (const source of dueSources) {
                if (this.isSourceBusy(source.id)) {
                    continue
                }

                await this.runSource(source, 'scheduler')
            }
        } catch (error) {
            console.error('[poller] tick failed', error)
        } finally {
            this.#tickInProgress = false
        }
    }

    private async runSource(source: typeof sources.$inferSelect, trigger: SourceRunTrigger): Promise<SourceRunResult> {
        if (this.#inFlight.has(source.id)) {
            throw new SourceBusyError()
        }

        this.#inFlight.add(source.id)

        try {
            return await fetchAndStoreSource(source, trigger)
        } finally {
            this.#inFlight.delete(source.id)
        }
    }
}

export const poller = new SourcePoller()
