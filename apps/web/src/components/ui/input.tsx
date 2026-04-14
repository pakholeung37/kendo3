import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            className={cn(
                'flex h-8 w-full border border-border bg-background px-2 py-1 text-xs font-mono uppercase text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            type={type}
            {...props}
        />
    )
}

export { Input }
