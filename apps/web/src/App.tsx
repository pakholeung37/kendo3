import { NavLink, Outlet } from 'react-router'

const navigation = [
    { to: '/', label: '信息流' },
    { to: '/sources', label: '信息源' },
    { to: '/runs', label: '抓取记录' },
]

const navClassName = ({ isActive }: { isActive: boolean }) =>
    [
        'rounded-full px-4 py-2 text-sm font-medium transition',
        isActive ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15' : 'text-slate-600 hover:bg-white/80 hover:text-slate-950',
    ].join(' ')

export function AppLayout() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.18),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)] text-slate-950">
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
                <header className="rounded-[2rem] border border-white/70 bg-white/75 px-5 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur xl:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Kendo3 Monitor</p>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">把 RSS 变成可观察的信息流</h1>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                                    一期聚焦 RSS 监控：统一时间线、源状态、抓取结果都在这里看。
                                </p>
                            </div>
                        </div>
                        <nav className="flex flex-wrap gap-2 rounded-full bg-slate-100/85 p-1.5">
                            {navigation.map((item) => (
                                <NavLink key={item.to} className={navClassName} to={item.to}>
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </header>

                <main className="mt-6 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
