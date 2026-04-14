import { ArrowDownRight, ArrowUpRight, Dot } from 'lucide-react'
import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatTileProps {
    label: string
    value: ReactNode
    hint?: string
    trend?: 'up' | 'down' | 'neutral'
    className?: string
}

export function StatTile({ className, hint, label, trend = 'neutral', value }: StatTileProps) {
    const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Dot

    return (
        <Card className={cn('border-border bg-card', className)}>
            <CardContent className="p-2 flex flex-col gap-1">
                <div className="flex items-start justify-between">
                    <p className="font-mono text-xs uppercase text-primary">{label}</p>
                    <TrendIcon className="size-3 text-primary" />
                </div>
                <div className="text-xl font-bold text-foreground font-mono">{value}</div>
                {hint ? <p className="text-[10px] uppercase text-muted-foreground truncate">{hint}</p> : null}
            </CardContent>
        </Card>
    )
}
