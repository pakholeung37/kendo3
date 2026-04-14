import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Radar, RefreshCcw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { cn, formatTimeOnly } from '@/lib/utils'

const _runStatusVariant = {
    success: 'positive',
    unchanged: 'secondary',
    error: 'negative',
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
    const _successCount = runs.filter((run) => run.status === 'success').length
    const _errorCount = runs.filter((run) => run.status === 'error').length
    const _manualCount = runs.filter((run) => run.trigger === 'manual').length
    const _totalNewItems = runs.reduce((sum, run) => sum + run.newCount, 0)

    return (
        <div className="flex flex-col gap-2 h-full">
            <Card className="flex flex-col flex-1 min-h-0">
                <CardHeader className="flex-row justify-between items-center py-1 px-2 border-b border-border">
                    <span className="text-primary font-bold">EXECUTION_LEDGER</span>
                    <div className="flex items-center gap-2">
                        <select className="bg-background border border-border text-xs px-2 py-1 outline-none focus:border-primary text-foreground" onChange={(event) => setSourceId(event.target.value)} value={sourceId}>
                            <option value="all">ALL_SOURCES</option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.name}
                                </option>
                            ))}
                        </select>
                        <Button onClick={() => void runsQuery.refetch()} size="sm" type="button" variant="terminal">
                            <RefreshCcw className="size-3 mr-1" />
                            REFRESH
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-auto p-0">
                    {runsQuery.isLoading ? (
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 15 }).map((_, index) => (
                                <Skeleton className="h-6 w-full" key={index} />
                            ))}
                        </div>
                    ) : runsQuery.error ? (
                        <div className="p-4 border border-rose-500 bg-rose-500/10 text-rose-500 m-2 flex items-center gap-3">
                            <AlertTriangle className="size-4 shrink-0" />
                            <span>FAILED_LOAD: {runsQuery.error.message}</span>
                        </div>
                    ) : runs.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground font-mono">
                            <Radar className="size-6 mb-2 opacity-50" />
                            <p>NO_EXECUTION_LOGS_FOUND</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-border">
                                    <TableHead className="text-[10px] h-6 px-2">STAT</TableHead>
                                    <TableHead className="text-[10px] h-6 px-2">SRC</TableHead>
                                    <TableHead className="text-[10px] h-6 px-2">TRG</TableHead>
                                    <TableHead className="text-[10px] h-6 px-2">START</TableHead>
                                    <TableHead className="text-[10px] h-6 px-2">HTP</TableHead>
                                    <TableHead className="text-[10px] h-6 px-2">PRS</TableHead>
                                    <TableHead className="text-[10px] h-6 px-2">NEW</TableHead>
                                    <TableHead className="text-[10px] h-6 px-2 text-right">MS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {runs.map((run) => (
                                    <TableRow key={run.id} className="border-b border-border/20 text-xs font-mono hover:bg-muted/30">
                                        <TableCell className="px-2 py-1">
                                            <span className={cn('block size-2 rounded-full', run.status === 'success' ? 'bg-emerald-500' : run.status === 'error' ? 'bg-rose-500' : 'bg-muted-foreground')} />
                                        </TableCell>
                                        <TableCell className="px-2 py-1 max-w-[200px] truncate">{run.sourceName ?? 'UNKNOWN'}</TableCell>
                                        <TableCell className="px-2 py-1 text-muted-foreground">{run.trigger === 'manual' ? 'MNL' : 'AUTO'}</TableCell>
                                        <TableCell className="px-2 py-1">{formatTimeOnly(run.startedAt)}</TableCell>
                                        <TableCell className={cn('px-2 py-1', run.httpStatus && run.httpStatus >= 400 ? 'text-rose-500' : 'text-foreground')}>{run.httpStatus ?? '---'}</TableCell>
                                        <TableCell className="px-2 py-1">{run.parsedCount}</TableCell>
                                        <TableCell className="px-2 py-1 text-primary">{run.newCount}</TableCell>
                                        <TableCell className="px-2 py-1 text-right text-muted-foreground">{run.durationMs}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
