export function SettingsPage() {
    return (
        <div className="space-y-5">
            <section className="rounded-[32px] border border-slate-800/80 bg-slate-900/90 p-5 shadow-soft backdrop-blur-xl">
                <h2 className="text-lg font-semibold text-white">Configurações</h2>
                <p className="mt-2 text-sm text-slate-400">Personalize o estilo do aplicativo e preferências do sorteio.</p>
            </section>
            <div className="space-y-4">
                <button className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-4 text-left text-sm text-slate-200 hover:border-slate-700">
                    <p className="font-semibold text-white">Modo escuro</p>
                    <p className="mt-1 text-slate-400">Ativar ou desativar o tema escuro.</p>
                </button>
                <button className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/90 px-4 py-4 text-left text-sm text-slate-200 hover:border-slate-700">
                    <p className="font-semibold text-white">Notificações</p>
                    <p className="mt-1 text-slate-400">Receber toasts e alertas suaves no app.</p>
                </button>
            </div>
        </div>
    );
}
