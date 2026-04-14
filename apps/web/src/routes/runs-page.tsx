import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'
import { cn, formatDateTime } from '../lib/utils'

const panelClassName =
    'rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur'

const statusPillClassName = {
    success: 'bg-emerald-100 text-emerald-700',
    unchanged: 'bg-sky-100 text-sky-700',
    error: 'bg-rose-100 text-rose-700',
} as const

export function RunsPage() {
    const [sourceId, setSourceId] = useState('all')

    const sourcesQuery = useQuery({
        queryKey: ['sources'],
        queryFn: api.getSources,
        refetchInterval: 15_000,
    })

    const runsQuery = useQuery({
        queryKey: ['source-runs', sourceId],
        queryFn: () =>
            api.getSourceRuns({
                sourceId: sourceId === 'all' ? undefined : sourceId,
                limit: 100,
            }),
        refetchInterval: 15_000,
    })

    const runs = runsQuery.data?.items ?? []
    const sources = sourcesQuery.data?.items ?? []

    return (
        <div className="space-y-4">
            <div className={cn(panelClassName, 'flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between')}>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Run History</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">抓取记录</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">记录每次 scheduler/manual 抓取结果，方便直接看源是否异常。</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400"
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
                    <button
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                        onClick={() => void runsQuery.refetch()}
                        type="button"
                    >
                        刷新记录
                    </button>
                </div>
            </div>

            {runsQuery.isLoading ? (
                <div className={panelClassName}>正在读取抓取记录…</div>
            ) : runs.length === 0 ? (
                <div className={panelClassName}>还没有抓取记录。新增源后触发一次抓取，就会在这里看到结果。</div>
            ) : (
                runs.map((run) => (
                    <article key={run.id} className={panelClassName}>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={cn(
                                            'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                                            statusPillClassName[run.status],
                                        )}
                                    >
                                        {run.status}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                                        {run.trigger}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-xl font-semibold tracking-tight">{run.sourceName ?? 'Unknown source'}</h3>
                                    <p className="mt-2 text-sm text-slate-600">{formatDateTime(run.startedAt)}</p>
                                </div>
                            </div>

                            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">HTTP</p>
                                    <p className="mt-2 font-medium text-slate-900">{run.httpStatus ?? 'N/A'}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">解析条数</p>
                                    <p className="mt-2 font-medium text-slate-900">{run.parsedCount}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">新增条数</p>
                                    <p className="mt-2 font-medium text-slate-900">{run.newCount}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">耗时</p>
                                    <p className="mt-2 font-medium text-slate-900">{run.durationMs} ms</p>
                                </div>
                            </div>
                        </div>

                        {run.errorMessage ? (
                            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                                {run.errorMessage}
                            </div>
                        ) : null}
                    </article>
                ))
            )}
        </div>
    )
}
