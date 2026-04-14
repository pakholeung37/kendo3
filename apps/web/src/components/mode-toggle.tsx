import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export function ModeToggle() {
    const { resolvedTheme, setTheme, theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const Icon = !mounted ? Monitor : resolvedTheme === 'light' ? Sun : Moon

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button aria-label="切换主题" size="icon" type="button" variant="outline">
                    <Icon className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme('system')}>System {theme === 'system' ? '•' : ''}</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
