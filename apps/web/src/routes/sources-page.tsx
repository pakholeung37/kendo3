import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, LoaderCircle, Radar, RefreshCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { PanelHeading } from '@/components/panel-heading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { Source } from '@/lib/types'
import { cn, formatCompactNumber, formatDateTime, formatRelativeMinutes } from '@/lib/utils'

interface SourceEditorState {
    name: string
    endpoint: string
}

const SourceSurface = ({ onInvalidate, source }: { source: Source; onInvalidate: () => Promise<unknown> }) => {
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
        <div className="flex border-b border-border/50 py-2 hover:bg-muted/10">
            <div className="w-10 flex flex-col items-center pt-1 justify-start shrink-0">
                <span className={cn('block size-3 rounded-full', source.status === 'active' ? 'bg-emerald-500' : source.status === 'error' ? 'bg-rose-500' : 'bg-muted-foreground')} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground text-sm uppercase truncate">{source.name}</span>
                    <span className="text-[10px] uppercase text-muted-foreground bg-secondary px-1">{formatRelativeMinutes(source.currentIntervalMin)}</span>
                    <span className="text-[10px] uppercase text-muted-foreground bg-secondary px-1">ID:{source.id}</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground break-all mb-2">{source.endpoint}</div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono mb-2">
                    <span className="text-secondary-foreground">L_OK: {formatDateTime(source.lastSuccessAt)}</span>
                    <span className="text-secondary-foreground">L_CHK: {formatDateTime(source.lastCheckedAt)}</span>
                    <span className="text-secondary-foreground">N_POLL: {formatDateTime(source.nextPollAt)}</span>
                    <span className={cn(source.consecutiveFailures > 0 ? 'text-rose-400' : 'text-emerald-400')}>ERRS: {formatCompactNumber(source.consecutiveFailures)}</span>
                    <span className="text-secondary-foreground">VOL: {formatCompactNumber(source.itemCount)}</span>
                </div>

                {source.status === 'error' && source.lastErrorMessage ? <div className="text-rose-400 text-[10px] font-mono bg-rose-500/10 border border-rose-500/20 px-2 py-1 mb-2">ERR_LOG: {source.lastErrorMessage}</div> : null}

                {editing ? (
                    <form
                        className="bg-secondary p-2 flex flex-col gap-2 border border-border mt-1"
                        onSubmit={(event) => {
                            event.preventDefault()
                            void updateMutation.mutateAsync()
                        }}
                    >
                        <div className="flex gap-2">
                            <Input className="w-1/3" onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} value={draft.name} />
                            <Input className="flex-1" onChange={(event) => setDraft((value) => ({ ...value, endpoint: event.target.value }))} required value={draft.endpoint} />
                            <Button disabled={updateMutation.isPending} size="sm" type="submit" variant="terminal">
                                COMMIT_EDIT
                            </Button>
                        </div>
                    </form>
                ) : null}
            </div>

            <div className="w-48 shrink-0 flex flex-col gap-1 items-stretch">
                <Button disabled={busy} onClick={() => void fetchMutation.mutateAsync()} size="sm" type="button" variant="terminal" className="justify-start">
                    {fetchMutation.isPending ? <LoaderCircle className="size-3 animate-spin mr-1" /> : <Radar className="size-3 mr-1" />}
                    EXEC_NOW
                </Button>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <Button disabled={busy} onClick={() => void toggleMutation.mutateAsync()} size="sm" type="button" variant="outline" className="px-0">
                        {source.enabled ? 'HALT' : 'ACTIVATE'}
                    </Button>
                    <Button onClick={() => setEditing((value) => !value)} size="sm" type="button" variant="outline" className="px-0">
                        {editing ? 'CANCEL' : 'EDIT'}
                    </Button>
                </div>
                <Button
                    disabled={busy}
                    onClick={() => {
                        if (window.confirm(`DELETE SOURCE "${source.name}"?`)) {
                            void deleteMutation.mutateAsync()
                        }
                    }}
                    size="sm"
                    type="button"
                    variant="destructive"
                    className="justify-start"
                >
                    <Trash2 className="size-3 mr-1" />
                    PURGE
                </Button>
            </div>
        </div>
    )
}

export function SourcesPage() {
    const queryClient = useQueryClient()
    const [form, setForm] = useState({
        id: '',
        name: '',
        endpoint: '',
    })

    const sourcesQuery = useQuery({
        queryKey: ['sources'],
        queryFn: api.getSources,
        refetchInterval: 15_000,
    })

    const invalidateData = async () => Promise.all([queryClient.invalidateQueries({ queryKey: ['sources'] }), queryClient.invalidateQueries({ queryKey: ['feed-items'] }), queryClient.invalidateQueries({ queryKey: ['source-runs'] })])

    const createMutation = useMutation({
        mutationFn: () =>
            api.createSource({
                id: form.id || undefined,
                name: form.name || undefined,
                endpoint: form.endpoint,
                enabled: true,
            }),
        onSuccess: async () => {
            setForm({ id: '', name: '', endpoint: '' })
            await invalidateData()
        },
    })

    const sources = sourcesQuery.data?.items ?? []

    return (
        <div className="flex flex-col gap-2 h-full">
            <div className="grid gap-2 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] flex-1 min-h-0">
                <section className="flex flex-col gap-2 min-h-0">
                    <Card className="flex flex-col min-h-[300px] lg:min-h-0 max-h-screen lg:max-h-full overflow-hidden">
                        <CardHeader>
                            <PanelHeading eyebrow="REGISTER" title="ADD_ENDPOINT" />
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            <form
                                className="flex flex-col gap-3"
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    void createMutation.mutateAsync()
                                }}
                            >
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground uppercase">SOURCE_ID [OPTIONAL]</span>
                                    <Input onChange={(event) => setForm((value) => ({ ...value, id: event.target.value }))} placeholder="my-feed" value={form.id} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground uppercase">DISPLAY_NAME [OPTIONAL]</span>
                                    <Input onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="My Feed" value={form.name} />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] text-muted-foreground uppercase">RSS_URL [REQUIRED]</span>
                                    <Input onChange={(event) => setForm((value) => ({ ...value, endpoint: event.target.value }))} placeholder="HTTPS://..." required type="url" value={form.endpoint} />
                                </div>
                                <Button disabled={createMutation.isPending} size="sm" type="submit" variant="terminal">
                                    {createMutation.isPending ? <LoaderCircle className="size-3 animate-spin mr-1" /> : <Activity className="size-3 mr-1" />}
                                    PROVISION_SOURCE
                                </Button>
                                {createMutation.error ? <div className="text-[10px] text-rose-500 bg-rose-500/10 p-1 border border-rose-500/20 uppercase">ERR: {createMutation.error.message}</div> : null}
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <PanelHeading eyebrow="SYS_RULES" title="CONSTRAINTS" />
                        </CardHeader>
                        <CardContent>
                            <ul className="text-[10px] text-muted-foreground font-mono space-y-1">
                                <li>&gt; RSS_2.0_SPEC_ONLY</li>
                                <li>&gt; SINGLE_USER_CTX</li>
                                <li>&gt; IMMUTABLE_HISTORY</li>
                                <li>&gt; ADAPTIVE_POLL_RATE</li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                <section className="flex flex-col min-h-0">
                    <Card className="flex flex-col flex-1 min-h-0">
                        <CardHeader className="flex-row items-center justify-between px-2 py-1 border-b border-border">
                            <span className="text-primary font-bold">SOURCE_REGISTRY</span>
                            <Button onClick={() => void sourcesQuery.refetch()} size="sm" type="button" variant="outline">
                                <RefreshCcw className="size-3 mr-1" />
                                SYNC
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0">
                            {sourcesQuery.isLoading ? (
                                <div className="p-4 space-y-2">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <Skeleton className="h-16 w-full" key={index} />
                                    ))}
                                </div>
                            ) : sources.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-muted-foreground font-mono">
                                    <Radar className="size-8 mb-2 opacity-50" />
                                    <p>EMPTY_REGISTRY</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    {sources.map((source) => (
                                        <SourceSurface key={source.id} onInvalidate={invalidateData} source={source} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </div>
    )
}
