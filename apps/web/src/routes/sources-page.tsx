import { useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'
import type { Source } from '../lib/types'
import { cn, formatDateTime, formatRelativeMinutes } from '../lib/utils'

const panelClassName =
    'rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur'

const statusClassName = {
    active: 'bg-emerald-100 text-emerald-700',
    error: 'bg-rose-100 text-rose-700',
    disabled: 'bg-slate-200 text-slate-600',
} as const

interface SourceEditorState {
    name: string
    endpoint: string
}

const SourceCard = ({
    source,
    onInvalidate,
}: {
    source: Source
    onInvalidate: () => Promise<unknown>
}) => {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState<SourceEditorState>({
        name: source.name,
        endpoint: source.endpoint,
    })

    const fetchMutation = useMutation({
        mutationFn: () => api.fetchSource(source.id),
        onSuccess: async () => {
            await onInvalidate()
        },
    })

    const toggleMutation = useMutation({
        mutationFn: () => (source.enabled ? api.disableSource(source.id) : api.enableSource(source.id)),
        onSuccess: async () => {
            await onInvalidate()
        },
    })

    const updateMutation = useMutation({
        mutationFn: () =>
            api.updateSource(source.id, {
                name: draft.name,
                endpoint: draft.endpoint,
            }),
        onSuccess: async () => {
            setEditing(false)
            await onInvalidate()
        },
    })

    const deleteMutation = useMutation({
        mutationFn: () => api.deleteSource(source.id),
        onSuccess: async () => {
            await onInvalidate()
        },
    })

    const busy = source.isBusy || fetchMutation.isPending || toggleMutation.isPending || updateMutation.isPending || deleteMutation.isPending

    return (
        <article className={panelClassName}>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', statusClassName[source.status])}>
                                {source.status}
                            </span>
                            <span className="text-sm text-slate-500">{source.itemCount} 条历史文章</span>
                            <span className="text-sm text-slate-500">轮询 {formatRelativeMinutes(source.currentIntervalMin)}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold tracking-tight">{source.name}</h3>
                            <p className="mt-2 break-all text-sm leading-6 text-slate-600">{source.endpoint}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            disabled={busy}
                            onClick={() => void fetchMutation.mutateAsync()}
                            type="button"
                        >
                            {fetchMutation.isPending ? '抓取中…' : '立即抓取'}
                        </button>
                        <button
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={busy}
                            onClick={() => void toggleMutation.mutateAsync()}
                            type="button"
                        >
                            {source.enabled ? '停用' : '启用'}
                        </button>
                        <button
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                            onClick={() => setEditing((value) => !value)}
                            type="button"
                        >
                            {editing ? '取消编辑' : '编辑'}
                        </button>
                        <button
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={busy}
                            onClick={() => {
                                if (window.confirm(`删除信息源“${source.name}”？历史文章会保留。`)) {
                                    void deleteMutation.mutateAsync()
                                }
                            }}
                            type="button"
                        >
                            删除
                        </button>
                    </div>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">最后成功</p>
                        <p className="mt-2 font-medium text-slate-900">{formatDateTime(source.lastSuccessAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">最后检查</p>
                        <p className="mt-2 font-medium text-slate-900">{formatDateTime(source.lastCheckedAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">下次轮询</p>
                        <p className="mt-2 font-medium text-slate-900">{formatDateTime(source.nextPollAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">连续失败</p>
                        <p className="mt-2 font-medium text-slate-900">{source.consecutiveFailures}</p>
                    </div>
                </div>

                {source.lastErrorMessage ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700">
                        <p className="font-semibold">最近错误</p>
                        <p className="mt-2">{source.lastErrorMessage}</p>
                    </div>
                ) : null}

                {editing ? (
                    <form
                        className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void updateMutation.mutateAsync()
                        }}
                    >
                        <label className="grid gap-2">
                            <span className="text-sm font-medium text-slate-700">名称</span>
                            <input
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
                                onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
                                value={draft.name}
                            />
                        </label>
                        <label className="grid gap-2">
                            <span className="text-sm font-medium text-slate-700">RSS 地址</span>
                            <input
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-400"
                                onChange={(event) => setDraft((value) => ({ ...value, endpoint: event.target.value }))}
                                required
                                value={draft.endpoint}
                            />
                        </label>
                        <div className="flex justify-end">
                            <button
                                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-60"
                                disabled={updateMutation.isPending}
                                type="submit"
                            >
                                {updateMutation.isPending ? '保存中…' : '保存修改'}
                            </button>
                        </div>
                    </form>
                ) : null}
            </div>
        </article>
    )
}

export function SourcesPage() {
    const queryClient = useQueryClient()
    const [form, setForm] = useState({
        name: '',
        endpoint: '',
    })

    const sourcesQuery = useQuery({
        queryKey: ['sources'],
        queryFn: api.getSources,
        refetchInterval: 15_000,
    })

    const invalidateData = async () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: ['sources'] }),
            queryClient.invalidateQueries({ queryKey: ['feed-items'] }),
            queryClient.invalidateQueries({ queryKey: ['source-runs'] }),
        ])

    const createMutation = useMutation({
        mutationFn: () =>
            api.createSource({
                name: form.name || undefined,
                endpoint: form.endpoint,
                enabled: true,
            }),
        onSuccess: async () => {
            setForm({ name: '', endpoint: '' })
            await invalidateData()
        },
    })

    const sources = sourcesQuery.data?.items ?? []

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <section className={panelClassName}>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Source Control</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">后台维护 RSS 源</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    一期只允许后台添加和调整信息源，创建后会进入轮询计划，也可以手动立即抓取。
                </p>

                <form
                    className="mt-6 grid gap-3"
                    onSubmit={(event) => {
                        event.preventDefault()
                        void createMutation.mutateAsync()
                    }}
                >
                    <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">名称</span>
                        <input
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
                            onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                            placeholder="可选，不填则自动用域名"
                            value={form.name}
                        />
                    </label>
                    <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-700">RSS 地址</span>
                        <input
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white"
                            onChange={(event) => setForm((value) => ({ ...value, endpoint: event.target.value }))}
                            placeholder="https://example.com/feed.xml"
                            required
                            type="url"
                            value={form.endpoint}
                        />
                    </label>
                    <button
                        className="mt-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        disabled={createMutation.isPending}
                        type="submit"
                    >
                        {createMutation.isPending ? '创建中…' : '新增信息源'}
                    </button>
                    {createMutation.error ? (
                        <p className="text-sm text-rose-600">{createMutation.error.message}</p>
                    ) : null}
                </form>
            </section>

            <section className="space-y-4">
                <div className={cn(panelClassName, 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Registry</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight">当前信息源</h2>
                    </div>
                    <button
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                        onClick={() => void sourcesQuery.refetch()}
                        type="button"
                    >
                        刷新状态
                    </button>
                </div>

                {sourcesQuery.isLoading ? (
                    <div className={panelClassName}>正在读取信息源…</div>
                ) : sources.length === 0 ? (
                    <div className={panelClassName}>还没有信息源。先在左侧添加一个 RSS 地址。</div>
                ) : (
                    sources.map((source) => <SourceCard key={source.id} onInvalidate={invalidateData} source={source} />)
                )}
            </section>
        </div>
    )
}
