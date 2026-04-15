import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowUpRight, RefreshCcw, SatelliteDish } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { PanelHeading } from '@/components/panel-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { cn, formatCompactNumber, formatDateOnly, formatDateTime, formatTimeOnly } from '@/lib/utils'
import { useFeedFilterStore } from '@/store/feed-filters'

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
    const selectedSource = sourceId === 'all' ? null : (sources.find((source) => source.id === sourceId) ?? null)

    const observerTarget = useRef<HTMLDivElement>(null)
    const knownIds = useRef(new Set<string>())

    useEffect(() => {
        const target = observerTarget.current
        if (!target) return

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
                    void feedQuery.fetchNextPage()
                }
            },
            { threshold: 0.1 },
        )

        observer.observe(target)
        return () => observer.unobserve(target)
    }, [feedQuery.hasNextPage, feedQuery.isFetchingNextPage, feedQuery.fetchNextPage])

    return (
        <div className="flex flex-col gap-2 flex-1 min-h-0 h-full">
            <div className="grid gap-2 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] flex-1 min-h-0">
                <aside className="flex flex-col gap-2 min-h-0">
                    <Card className="flex flex-col min-h-[300px] lg:min-h-0 max-h-screen lg:max-h-full overflow-hidden">
                        <CardHeader>
                            <PanelHeading eyebrow="SCOPE" title="SOURCE_SEL" />
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            <div className="flex flex-col gap-1">
                                <button
                                    className={cn(
                                        'flex w-full items-center justify-between border px-2 py-1 text-left transition text-xs font-mono uppercase',
                                        sourceId === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-transparent bg-secondary text-secondary-foreground hover:border-primary',
                                    )}
                                    onClick={() => setSourceId('all')}
                                    type="button"
                                >
                                    <span>[ALL_SOURCES]</span>
                                    <span>{formatCompactNumber(sources.length)}</span>
                                </button>

                                {sources.map((source) => (
                                    <button
                                        className={cn(
                                            'flex w-full items-center justify-between border px-2 py-1 text-left transition text-xs font-mono',
                                            sourceId === source.id ? 'border-primary bg-primary/20 text-primary' : 'border-transparent bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
                                        )}
                                        key={source.id}
                                        onClick={() => setSourceId(source.id)}
                                        type="button"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className={cn('size-2 shrink-0', source.status === 'active' ? 'bg-emerald-500' : source.status === 'error' ? 'bg-rose-500' : 'bg-muted-foreground')} />
                                            <span className="truncate">{source.name}</span>
                                        </div>
                                        <span className="shrink-0">{formatCompactNumber(source.itemCount)}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <PanelHeading eyebrow="CONTEXT" title="LIVE_STAT" />
                        </CardHeader>
                        <CardContent className="flex flex-col gap-1 text-[10px] font-mono">
                            <div className="flex justify-between border-b border-border py-1">
                                <span className="text-muted-foreground">MODE</span>
                                <span className="text-primary">{selectedSource ? 'FOCUS' : 'GLOBAL'}</span>
                            </div>
                            <div className="flex justify-between border-b border-border py-1">
                                <span className="text-muted-foreground">POLL_RATE</span>
                                <span>{selectedSource ? `${selectedSource.currentIntervalMin}M` : 'DYNAMIC'}</span>
                            </div>
                            <div className="flex justify-between border-b border-border py-1">
                                <span className="text-muted-foreground">LAST_OK</span>
                                <span>{selectedSource ? formatDateTime(selectedSource.lastSuccessAt) : 'MULTIPLE'}</span>
                            </div>
                            {selectedSource?.status === 'error' && selectedSource.lastErrorMessage ? (
                                <div className="mt-2 border border-rose-500/50 bg-rose-500/10 p-2 text-rose-400">ERR: {selectedSource.lastErrorMessage}</div>
                            ) : null}
                        </CardContent>
                    </Card>
                </aside>

                <section className="flex flex-col min-h-0">
                    <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <CardHeader className="flex-row items-center justify-between py-1 px-2 border-b border-border">
                            <span className="text-primary font-bold">UNIFIED_TAPE</span>
                            <Button onClick={() => void feedQuery.refetch()} size="sm" type="button" variant="terminal">
                                <RefreshCcw className="size-3 mr-1" />
                                REFRESH
                            </Button>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-auto p-0">
                            {feedQuery.isLoading ? (
                                <div className="p-4 space-y-2">
                                    {Array.from({ length: 15 }).map((_, i) => (
                                        <Skeleton className="h-6 w-full" key={i} />
                                    ))}
                                </div>
                            ) : feedQuery.error ? (
                                <div className="p-4 text-rose-500 flex items-center gap-2">
                                    <AlertTriangle className="size-4" />
                                    <span>TAPE_ERR: {feedQuery.error.message}</span>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-muted-foreground font-mono">
                                    <SatelliteDish className="size-8 mb-2 opacity-50" />
                                    <p>NO_DATA_AWAITING_SIGNAL</p>
                                </div>
                            ) : (
                                <div className="flex flex-col text-xs font-mono">
                                    <div className="sticky top-0 bg-secondary px-2 py-1 border-b border-border flex text-muted-foreground uppercase text-[10px]">
                                        <div className="w-24 shrink-0">TIME</div>
                                        <div className="w-32 shrink-0">SOURCE</div>
                                        <div className="flex-1">HEADLINE</div>
                                        <div className="w-12 text-right shrink-0">ACT</div>
                                    </div>

                                    {items.map((item, index) => {
                                        const isNewArrival = knownIds.current.size > 0 && !knownIds.current.has(item.id)
                                        if (!knownIds.current.has(item.id)) {
                                            knownIds.current.add(item.id)
                                        }

                                        return (
                                            <article
                                                className={cn('group flex items-start border-b border-border/50 px-2 py-1 hover:bg-muted/30 transition-colors', isNewArrival && 'animate-[new-item-flash_1.5s_ease-out]')}
                                                key={item.id}
                                            >
                                                <div className="w-24 shrink-0 tabular-nums flex flex-col justify-start pt-[2px]">
                                                    <span className="text-primary text-xs font-bold leading-none">{formatTimeOnly(item.publishedAt)}</span>
                                                    <span className="text-muted-foreground text-[9px] font-bold opacity-60 mt-[3px] leading-none">{formatDateOnly(item.publishedAt)}</span>
                                                </div>

                                                <div className="w-32 shrink-0 truncate pr-2">
                                                    <span className="text-secondary-foreground bg-secondary px-1">{item.sourceName}</span>
                                                </div>

                                                <div className="flex-1 min-w-0 pr-2 flex flex-col gap-1">
                                                    <a className="font-bold text-[13px] text-foreground hover:text-primary leading-tight" href={item.link} rel="noreferrer" target="_blank" title={item.title}>
                                                        {item.title}
                                                    </a>
                                                    {item.summary && <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{item.summary}</p>}
                                                </div>

                                                <div className="w-12 text-right shrink-0">
                                                    <a href={item.link} rel="noreferrer" target="_blank" className="text-muted-foreground hover:text-primary inline-flex">
                                                        <ArrowUpRight className="size-3" />
                                                    </a>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </div>
                            )}

                            {feedQuery.hasNextPage && (
                                <div ref={observerTarget} className="p-3 text-center text-[10px] text-muted-foreground border-t border-border">
                                    {feedQuery.isFetchingNextPage ? 'FETCHING_MORE_DATA...' : 'AWAITING_SCROLL_INTERSECTION...'}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    )
}
