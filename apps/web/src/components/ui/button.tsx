import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono uppercase transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground border border-primary hover:bg-primary/90',
                outline: 'border border-border bg-card text-foreground hover:border-primary hover:text-primary',
                ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
                terminal: 'border border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary',
                destructive: 'border border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive',
            },
            size: {
                default: 'h-8 px-3 text-xs',
                sm: 'h-6 px-2 text-[10px]',
                lg: 'h-10 px-4 text-xs',
                icon: 'h-8 w-8',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }

function Button({ asChild = false, className, size, variant, ...props }: ButtonProps) {
    const Comp = asChild ? Slot : 'button'

    return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
