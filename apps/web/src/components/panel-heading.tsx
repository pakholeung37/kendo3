import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PanelHeadingProps {
    eyebrow: string
    title: string
    description?: string
    action?: ReactNode
    className?: string
}

export function PanelHeading({ action, className, description, eyebrow, title }: PanelHeadingProps) {
    return (
        <div className={cn('flex flex-col gap-1 md:flex-row md:items-start md:justify-between', className)}>
            <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase text-primary">{eyebrow}</p>
                <div>
                    <h2 className="text-sm font-bold uppercase text-foreground">{title}</h2>
                    {description ? <p className="max-w-2xl text-[11px] uppercase text-muted-foreground">{description}</p> : null}
                </div>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    )
}
