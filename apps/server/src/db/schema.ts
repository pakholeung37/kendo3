import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const sources = sqliteTable(
    'sources',
    {
        id: text('id').primaryKey(),
        type: text('type')
            .notNull()
            .$defaultFn(() => 'rss'),
        name: text('name').notNull(),
        endpoint: text('endpoint').notNull(),
        configJson: text('config_json')
            .notNull()
            .$defaultFn(() => '{}'),
        enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
        nextPollAt: integer('next_poll_at').notNull(),
        currentIntervalMin: integer('current_interval_min').notNull(),
        etag: text('etag'),
        lastModified: text('last_modified'),
        lastCheckedAt: integer('last_checked_at'),
        lastSuccessAt: integer('last_success_at'),
        lastErrorAt: integer('last_error_at'),
        lastErrorMessage: text('last_error_message'),
        consecutiveFailures: integer('consecutive_failures').notNull().default(0),
        deletedAt: integer('deleted_at'),
        createdAt: integer('created_at').notNull(),
        updatedAt: integer('updated_at').notNull(),
    },
    (table) => ({
        endpointIdx: index('sources_endpoint_idx').on(table.endpoint),
        nextPollAtIdx: index('sources_next_poll_at_idx').on(table.nextPollAt),
        deletedAtIdx: index('sources_deleted_at_idx').on(table.deletedAt),
    }),
)

export const feedItems = sqliteTable(
    'feed_items',
    {
        id: text('id').primaryKey(),
        sourceId: text('source_id').notNull(),
        externalId: text('external_id'),
        dedupeKey: text('dedupe_key').notNull(),
        title: text('title').notNull(),
        summary: text('summary').notNull(),
        link: text('link').notNull(),
        publishedAt: integer('published_at').notNull(),
        fetchedAt: integer('fetched_at').notNull(),
        createdAt: integer('created_at').notNull(),
    },
    (table) => ({
        sourceDedupeIdx: uniqueIndex('feed_items_source_dedupe_idx').on(table.sourceId, table.dedupeKey),
        publishedAtIdx: index('feed_items_published_at_idx').on(table.publishedAt),
        sourcePublishedAtIdx: index('feed_items_source_published_at_idx').on(table.sourceId, table.publishedAt),
    }),
)

export const sourceRuns = sqliteTable(
    'source_runs',
    {
        id: text('id').primaryKey(),
        sourceId: text('source_id').notNull(),
        trigger: text('trigger').notNull(),
        status: text('status').notNull(),
        httpStatus: integer('http_status'),
        startedAt: integer('started_at').notNull(),
        finishedAt: integer('finished_at').notNull(),
        durationMs: integer('duration_ms').notNull(),
        parsedCount: integer('parsed_count').notNull().default(0),
        newCount: integer('new_count').notNull().default(0),
        errorMessage: text('error_message'),
        responseEtag: text('response_etag'),
        responseLastModified: text('response_last_modified'),
        createdAt: integer('created_at').notNull(),
    },
    (table) => ({
        sourceStartedAtIdx: index('source_runs_source_started_at_idx').on(table.sourceId, table.startedAt),
        startedAtIdx: index('source_runs_started_at_idx').on(table.startedAt),
    }),
)

export type SourceRow = typeof sources.$inferSelect
export type FeedItemRow = typeof feedItems.$inferSelect
export type SourceRunRow = typeof sourceRuns.$inferSelect
