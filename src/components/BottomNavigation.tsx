import { Home, Users, Clock3, Activity, Settings2 } from 'lucide-react';

const icons = {
    sorteio: Home,
    jogadores: Users,
    historico: Clock3,
    estatisticas: Activity,
    configuracoes: Settings2,
} as const;

type RouteId = 'sorteio' | 'jogadores' | 'historico' | 'estatisticas' | 'configuracoes';

interface BottomNavigationProps {
    routes: ReadonlyArray<{ id: RouteId; label: string }>;
    activeRoute: RouteId;
    onChange: (id: RouteId) => void;
}

export function BottomNavigation({ routes, activeRoute, onChange }: BottomNavigationProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex max-w-md justify-between px-4 py-3">
                {routes.map((route) => {
                    const Icon = icons[route.id];
                    const active = activeRoute === route.id;
                    return (
                        <button
                            key={route.id}
                            onClick={() => onChange(route.id)}
                            className={`flex min-w-[64px] flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold transition ${active ? 'bg-emerald-600/10 text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{route.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
