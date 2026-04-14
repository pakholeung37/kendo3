import { describe, expect, it } from 'vitest'

import { buildSourceIdMigrationPlan, migrateLegacySourceIds, type SourceIdMigrationDatabase } from './source-id-migration'

interface MockSourceRow {
    id: string
    name: string
    endpoint: string
    updatedAt: number
    createdAt: number
}

interface MockChildRow {
    id: string
    sourceId: string
}

interface MockMetaRow {
    key: string
    value: string
    updatedAt: number
}

class MockDatabase implements SourceIdMigrationDatabase {
    sources: MockSourceRow[] = []
    feedItems: MockChildRow[] = []
    sourceRuns: MockChildRow[] = []
    appMeta: MockMetaRow[] = []

    query(sql: string) {
        if (sql.includes('SELECT value FROM app_meta')) {
            return {
                all: () => [],
                get: (key: unknown) => this.appMeta.find((row) => row.key === key) ?? null,
                run: () => null,
            }
        }

        if (sql.includes('SELECT id, name, endpoint')) {
            return {
                all: () => [...this.sources].sort((left, right) => left.createdAt - right.createdAt).map((row) => ({ id: row.id, name: row.name, endpoint: row.endpoint })),
                get: () => null,
                run: () => null,
            }
        }

        if (sql.startsWith('UPDATE feed_items SET source_id = ?')) {
            return {
                all: () => [],
                get: () => null,
                run: (nextId: unknown, previousId: unknown) => {
                    for (const row of this.feedItems) {
                        if (row.sourceId === previousId) {
                            row.sourceId = String(nextId)
                        }
                    }
                },
            }
        }

        if (sql.startsWith('UPDATE source_runs SET source_id = ?')) {
            return {
                all: () => [],
                get: () => null,
                run: (nextId: unknown, previousId: unknown) => {
                    for (const row of this.sourceRuns) {
                        if (row.sourceId === previousId) {
                            row.sourceId = String(nextId)
                        }
                    }
                },
            }
        }

        if (sql.startsWith('UPDATE sources SET id = ?, updated_at = ?')) {
            return {
                all: () => [],
                get: () => null,
                run: (nextId: unknown, updatedAt: unknown, previousId: unknown) => {
                    const row = this.sources.find((source) => source.id === previousId)

                    if (row) {
                        row.id = String(nextId)
                        row.updatedAt = Number(updatedAt)
                    }
                },
            }
        }

        if (sql.includes('INSERT INTO app_meta')) {
            return {
                all: () => [],
                get: () => null,
                run: (key: unknown, value: unknown, updatedAt: unknown) => {
                    const existingRow = this.appMeta.find((row) => row.key === key)

                    if (existingRow) {
                        existingRow.value = String(value)
                        existingRow.updatedAt = Number(updatedAt)
                        return
                    }

                    this.appMeta.push({
                        key: String(key),
                        value: String(value),
                        updatedAt: Number(updatedAt),
                    })
                },
            }
        }

        throw new Error(`Unsupported SQL in mock database: ${sql}`)
    }

    transaction<TArgs extends unknown[]>(callback: (...args: TArgs) => void) {
        return (...args: TArgs) => callback(...args)
    }
}

describe('buildSourceIdMigrationPlan', () => {
    it('migrates legacy ids to readable slugs and resolves collisions', () => {
        expect(
            buildSourceIdMigrationPlan([
                {
                    id: '3f7e42b4-196f-4f3e-893c-ee06b9b31091',
                    name: 'Hacker News',
                    endpoint: 'https://news.ycombinator.com/rss',
                },
                {
                    id: 'hacker-news',
                    name: 'Existing Hacker News',
                    endpoint: 'https://example.com/rss',
                },
            ]),
        ).toEqual([
            {
                previousId: '3f7e42b4-196f-4f3e-893c-ee06b9b31091',
                nextId: 'hacker-news-2',
            },
        ])
    })
})

describe('migrateLegacySourceIds', () => {
    it('updates sources and related records once', () => {
        const database = new MockDatabase()

        database.sources.push({
            id: '3f7e42b4-196f-4f3e-893c-ee06b9b31091',
            name: 'Hacker News',
            endpoint: 'https://news.ycombinator.com/rss',
            updatedAt: 1,
            createdAt: 1,
        })
        database.feedItems.push({ id: 'feed-1', sourceId: '3f7e42b4-196f-4f3e-893c-ee06b9b31091' })
        database.sourceRuns.push({ id: 'run-1', sourceId: '3f7e42b4-196f-4f3e-893c-ee06b9b31091' })

        expect(migrateLegacySourceIds(database, 123)).toEqual([
            {
                previousId: '3f7e42b4-196f-4f3e-893c-ee06b9b31091',
                nextId: 'hacker-news',
            },
        ])

        expect(database.sources[0]).toEqual({
            id: 'hacker-news',
            name: 'Hacker News',
            endpoint: 'https://news.ycombinator.com/rss',
            createdAt: 1,
            updatedAt: 123,
        })
        expect(database.feedItems[0]).toEqual({
            id: 'feed-1',
            sourceId: 'hacker-news',
        })
        expect(database.sourceRuns[0]).toEqual({
            id: 'run-1',
            sourceId: 'hacker-news',
        })
        expect(database.appMeta[0]).toEqual({
            key: 'source-id-friendly-v1',
            value: JSON.stringify({ migratedCount: 1 }),
            updatedAt: 123,
        })
        expect(migrateLegacySourceIds(database, 456)).toEqual([])
    })
})
