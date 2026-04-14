import { sqlite } from './client'

export const initializeDatabase = () => {
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS sources (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            endpoint TEXT NOT NULL,
            config_json TEXT NOT NULL DEFAULT '{}',
            enabled INTEGER NOT NULL DEFAULT 1,
            next_poll_at INTEGER NOT NULL,
            current_interval_min INTEGER NOT NULL,
            etag TEXT,
            last_modified TEXT,
            last_checked_at INTEGER,
            last_success_at INTEGER,
            last_error_at INTEGER,
            last_error_message TEXT,
            consecutive_failures INTEGER NOT NULL DEFAULT 0,
            deleted_at INTEGER,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS sources_endpoint_active_idx
            ON sources(endpoint)
            WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS sources_next_poll_at_idx ON sources(next_poll_at);
        CREATE INDEX IF NOT EXISTS sources_deleted_at_idx ON sources(deleted_at);

        CREATE TABLE IF NOT EXISTS feed_items (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            external_id TEXT,
            dedupe_key TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL,
            link TEXT NOT NULL,
            published_at INTEGER NOT NULL,
            fetched_at INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS feed_items_source_dedupe_idx
            ON feed_items(source_id, dedupe_key);
        CREATE INDEX IF NOT EXISTS feed_items_published_at_idx ON feed_items(published_at);
        CREATE INDEX IF NOT EXISTS feed_items_source_published_at_idx
            ON feed_items(source_id, published_at);

        CREATE TABLE IF NOT EXISTS source_runs (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            trigger TEXT NOT NULL,
            status TEXT NOT NULL,
            http_status INTEGER,
            started_at INTEGER NOT NULL,
            finished_at INTEGER NOT NULL,
            duration_ms INTEGER NOT NULL,
            parsed_count INTEGER NOT NULL DEFAULT 0,
            new_count INTEGER NOT NULL DEFAULT 0,
            error_message TEXT,
            response_etag TEXT,
            response_last_modified TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS source_runs_source_started_at_idx
            ON source_runs(source_id, started_at);
        CREATE INDEX IF NOT EXISTS source_runs_started_at_idx
            ON source_runs(started_at);
    `)
}
