export function HistoryPage() {
    return (
        <div className="space-y-5">
            <section className="rounded-[32px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-soft backdrop-blur-xl">
                <h2 className="text-lg font-semibold text-white">Histórico de Babas</h2>
                <p className="mt-2 text-sm text-slate-400">Acompanhe os sorteios anteriores e reviva os melhores jogos.</p>
            </section>
            <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                    <div key={item} className="rounded-3xl border border-slate-800/80 bg-slate-950/90 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-white">Baba #{item}</p>
                                <p className="text-xs text-slate-500">10 jogadores · 2 times</p>
                            </div>
                            <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">Finalizado</span>
                        </div>
                        <div className="mt-4 grid gap-2 text-sm text-slate-300">
                            <p>Time 1: Marcos, Rafael, Felipe, Carlos, Diego</p>
                            <p>Time 2: João, Pedro, Lucas, Bruno, Mateus</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
