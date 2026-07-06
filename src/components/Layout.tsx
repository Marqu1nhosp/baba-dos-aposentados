import { ReactNode } from 'react';
import { Settings2, ShieldCheck } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5 sm:px-6">
            <header className="mb-5 overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-5 py-5 text-white shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20">
                            <ShieldCheck className="h-7 w-7 text-emerald-300" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-300/90">BABA DOS APOSENTADOS</p>
                            <h1 className="mt-1 text-2xl font-semibold">Sorteio de times</h1>
                        </div>
                    </div>
                    <button className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15">
                        <Settings2 className="h-5 w-5" />
                    </button>
                </div>
                <p className="mt-4 text-sm text-slate-200/80">Sorteio de time do Baba Dos Aposentados.</p>
            </header>

            <main className="flex-1 pb-8">{children}</main>
            <footer className="mt-8 border-t border-slate-200/40 pt-4 text-center text-[11px] leading-6 text-slate-500">
                © 2026 Marcos Antonio Porto Matos. Todos os direitos reservados.
            </footer>
        </div>
    );
}
