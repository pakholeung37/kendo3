import { NavLink, Outlet, useLocation } from 'react-router'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'

const navigation = [
    { to: '/', label: 'FEED_TAPE', code: '<GO>' },
    { to: '/sources', label: 'SOURCE_MGR', code: '<GO>' },
    { to: '/runs', label: 'EXEC_LOGS', code: '<GO>' },
]

const _pageMeta = {
    '/': {
        eyebrow: 'CMD // MNTR',
        title: 'MAIN_TAPE',
        description: 'LIVE FEED AGGREGATION & TERMINAL MONITOR',
    },
    '/sources': {
        eyebrow: 'CMD // SRC',
        title: 'SOURCE_RSTRY',
        description: 'ENDPOINT CONFIGURATION & REGISTRY',
    },
    '/runs': {
        eyebrow: 'CMD // LOG',
        title: 'EXEC_LEDGER',
        description: 'POLLING RUN & ERROR DIAGNOSTICS',
    },
} as const

export function AppLayout() {
    const _location = useLocation()

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-mono text-xs">
            <header className="border-b border-border bg-card uppercase">
                <div className="flex items-center justify-between px-3 py-1.5 space-x-4">
                    <div className="flex items-center gap-6">
                        <span className="text-primary font-bold text-xs shrink-0">
                            KENDO_TERM<span className="animate-pulse">_</span>
                        </span>

                        <nav className="flex gap-1">
                            {navigation.map((item) => (
                                <NavLink
                                    key={item.to}
                                    className={({ isActive }) =>
                                        cn(
                                            'px-2 py-0.5 flex items-center gap-1 transition-colors text-[10px] sm:text-xs font-bold border',
                                            isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-transparent hover:border-primary/50 hover:text-foreground',
                                        )
                                    }
                                    end={item.to === '/'}
                                    to={item.to}
                                >
                                    <span>{item.label}</span>
                                    <span className="opacity-50 text-[10px] hidden sm:inline">{item.code}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4 text-[10px]">
                        <ModeToggle />
                    </div>
                </div>
            </header>

            {/* Main Terminal Window */}
            <main className="flex-1 p-4 overflow-auto">
                <Outlet />
            </main>

            {/* Footer Status Bar */}
            <footer className="border-t border-border p-1 px-4 bg-card text-muted-foreground flex justify-between">
                <div>SYSTEM RUNNING OK</div>
                <div>TERMINAL ID: T-8492</div>
            </footer>
        </div>
    )
}
