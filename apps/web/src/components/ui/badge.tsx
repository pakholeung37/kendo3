import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] uppercase font-bold', {
    variants: {
        variant: {
            default: 'border-primary bg-primary text-primary-foreground',
            secondary: 'border-border bg-secondary text-secondary-foreground',
            positive: 'border-emerald-500 bg-emerald-500/20 text-emerald-400',
            negative: 'border-rose-500 bg-rose-500/20 text-rose-400',
            muted: 'border-border bg-muted text-muted-foreground',
            outline: 'border-border bg-transparent text-muted-foreground',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
})

type BadgeProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
