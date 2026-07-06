export function StatsPage() {
    return (
        <div className="space-y-5">
            <section className="rounded-[32px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-soft backdrop-blur-xl">
                <h2 className="text-lg font-semibold text-white">Estatísticas individuais</h2>
                <p className="mt-2 text-sm text-slate-400">Veja o desempenho dos jogadores e quem mais participou das babas.</p>
            </section>
            <div className="grid gap-4">
                {['Marcos', 'João', 'Pedro'].map((name) => (
                    <div key={name} className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-semibold text-white">{name}</p>
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">5 vitórias</span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-slate-400">
                            <p>Partidas: 12</p>
                            <p>Favorecimentos: 8</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
