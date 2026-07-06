export function PlayersPage() {
    return (
        <div className="space-y-5">
            <section className="rounded-[32px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-soft backdrop-blur-xl">
                <h2 className="text-lg font-semibold text-white">Jogadores</h2>
                <p className="mt-2 text-sm text-slate-400">Gerencie jogadores, favoritos e seleções para o próximo baba.</p>
            </section>
            <div className="space-y-4">
                {['Marcos', 'João', 'Pedro', 'Lucas', 'Carlos'].map((player) => (
                    <div key={player} className="flex items-center justify-between rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-4">
                        <div>
                            <p className="text-sm font-semibold text-white">{player}</p>
                            <p className="text-xs text-slate-400">Favorito</p>
                        </div>
                        <button className="rounded-3xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                            Selecionar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
