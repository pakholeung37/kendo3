import { createUniqueSourceId, deriveSourceId, deriveSourceName, isLegacyGeneratedSourceId } from '../lib/text'

const SOURCE_ID_MIGRATION_KEY = 'source-id-friendly-v1'

interface QueryResult {
    all: (...args: unknown[]) => unknown[]
    get: (...args: unknown[]) => unknown
    run: (...args: unknown[]) => unknown
}

export interface SourceIdMigrationDatabase {
    query: (sql: string) => QueryResult
    transaction: <TArgs extends unknown[]>(callback: (...args: TArgs) => void) => (...args: TArgs) => void
}

interface SourceIdMigrationCandidate {
    id: string
    name: string
    endpoint: string
}

export interface SourceIdMigration {
    previousId: string
    nextId: string
}

export const buildSourceIdMigrationPlan = (rows: SourceIdMigrationCandidate[]) => {
    const takenIds = new Set(rows.map((row) => row.id))
    const migrations: SourceIdMigration[] = []

    for (const row of rows) {
        if (!isLegacyGeneratedSourceId(row.id)) {
            continue
        }

        const baseId = deriveSourceId(row.name, deriveSourceName(row.endpoint))

        if (!baseId) {
            continue
        }

        takenIds.delete(row.id)
        const nextId = createUniqueSourceId(baseId, (candidate) => takenIds.has(candidate))
        takenIds.add(nextId)

        if (nextId !== row.id) {
            migrations.push({
                previousId: row.id,
                nextId,
            })
        }
    }

    return migrations
}

export const migrateLegacySourceIds = (database: SourceIdMigrationDatabase, now = Date.now()) => {
    const migrationState = database.query('SELECT value FROM app_meta WHERE key = ? LIMIT 1').get(SOURCE_ID_MIGRATION_KEY)

    if (migrationState) {
        return []
    }

    const rows = database
        .query(
            `
                SELECT id, name, endpoint
                FROM sources
                ORDER BY created_at ASC, rowid ASC
            `,
        )
        .all() as SourceIdMigrationCandidate[]

    const migrations = buildSourceIdMigrationPlan(rows)

    database.transaction((entries: SourceIdMigration[], appliedAt: number) => {
        for (const entry of entries) {
            database.query('UPDATE feed_items SET source_id = ? WHERE source_id = ?').run(entry.nextId, entry.previousId)
            database.query('UPDATE source_runs SET source_id = ? WHERE source_id = ?').run(entry.nextId, entry.previousId)
            database.query('UPDATE sources SET id = ?, updated_at = ? WHERE id = ?').run(entry.nextId, appliedAt, entry.previousId)
        }

        database
            .query(
                `
                    INSERT INTO app_meta (key, value, updated_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE
                    SET value = excluded.value, updated_at = excluded.updated_at
                `,
            )
            .run(SOURCE_ID_MIGRATION_KEY, JSON.stringify({ migratedCount: entries.length }), appliedAt)
    })(migrations, now)

    return migrations
}
