import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import { cn, formatDateTime } from '../lib/utils'
import { useFeedFilterStore } from '../store/feed-filters'

const statusCardClassName =
    'rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur'

export function FeedPage() {
    const sourceId = useFeedFilterStore((state) => state.sourceId)
    const setSourceId = useFeedFilterStore((state) => state.setSourceId)

    const sourcesQuery = useQuery({
        queryKey: ['sources'],
        queryFn: api.getSources,
        refetchInterval: 15_000,
    })

    const feedQuery = useInfiniteQuery({
        queryKey: ['feed-items', sourceId],
        queryFn: ({ pageParam }) =>
            api.getFeedItems({
                sourceId: sourceId === 'all' ? undefined : sourceId,
                cursor: pageParam,
                limit: 30,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        refetchInterval: 30_000,
    })

    const sources = sourcesQuery.data?.items ?? []
    const items = feedQuery.data?.pages.flatMap((page) => page.items) ?? []
    const activeSourceCount = sources.filter((source) => source.status === 'active').length

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <aside className="space-y-4">
                <section className={statusCardClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">监控概览</p>
                    <div className="mt-4 grid gap-3">
                        <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
                            <p className="text-xs uppercase tracking-[0.28em] text-white/65">已启用源</p>
                            <p className="mt-2 text-3xl font-semibold">{activeSourceCount}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">当前条目</p>
                            <p className="mt-2 text-3xl font-semibold text-slate-950">{items.length}</p>
                        </div>
                    </div>
                </section>

                <section className={statusCardClassName}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold">按信息源过滤</p>
                            <p className="mt-1 text-sm text-slate-600">只保留一个最基础的过滤器。</p>
                        </div>
                    </div>

                    <select
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
                        onChange={(event) => setSourceId(event.target.value)}
                        value={sourceId}
                    >
                        <option value="all">全部信息源</option>
                        {sources.map((source) => (
                            <option key={source.id} value={source.id}>
                                {source.name}
                            </option>
                        ))}
                    </select>
                </section>
            </aside>

            <section className="space-y-4">
                <div className={cn(statusCardClassName, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Unified Feed</p>
                        <h2 className="mt-2 text-2xl font-semibold">全局时间倒序信息流</h2>
                    </div>
                    <button
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                        onClick={() => void feedQuery.refetch()}
                        type="button"
                    >
                        刷新列表
                    </button>
                </div>

                {feedQuery.isLoading ? (
                    <div className={statusCardClassName}>正在加载信息流…</div>
                ) : items.length === 0 ? (
                    <div className={statusCardClassName}>还没有抓到文章。可以先去“信息源”页面新增源，然后立即抓取。</div>
                ) : (
                    <>
                        {items.map((item) => (
                            <article key={item.id} className={statusCardClassName}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] tracking-[0.18em] text-slate-600">
                                                {item.sourceName}
                                            </span>
                                            <span>{formatDateTime(item.publishedAt)}</span>
                                        </div>
                                        <div>
                                            <a
                                                className="text-xl font-semibold tracking-tight text-slate-950 transition hover:text-sky-700"
                                                href={item.link}
                                                rel="noreferrer"
                                                target="_blank"
                                            >
                                                {item.title}
                                            </a>
                                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{item.summary || '暂无摘要'}</p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}

                        {feedQuery.hasNextPage ? (
                            <button
                                className="w-full rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 px-5 py-4 text-sm font-medium text-slate-700 transition hover:border-sky-400 hover:text-sky-700"
                                disabled={feedQuery.isFetchingNextPage}
                                onClick={() => void feedQuery.fetchNextPage()}
                                type="button"
                            >
                                {feedQuery.isFetchingNextPage ? '加载中…' : '加载更多'}
                            </button>
                        ) : null}
                    </>
                )}
            </section>
        </div>
    )
}
