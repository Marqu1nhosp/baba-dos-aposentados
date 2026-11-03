import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Home, ShieldCheck, Users } from "lucide-react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baba dos Aposentados",
  description: "Sorteio de times do Baba dos Aposentados",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5 sm:px-6">
          <header className="mb-5 overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-5 py-5 text-white shadow-[0_32px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20">
                <ShieldCheck className="h-7 w-7 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-300/90">BABA DOS APOSENTADOS</p>
                <h1 className="mt-1 text-2xl font-semibold">Sorteio de times</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-200/80">Sorteio de time do Baba Dos Aposentados.</p>
          </header>

          <main className="flex-1 pb-20">{children}</main>

          <footer className="mt-8 border-t border-slate-200/40 pt-4 text-center text-[11px] leading-6 text-slate-500">
            © 2026 Marcos Antonio Porto Matos. Todos os direitos reservados.
          </footer>

          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex max-w-md justify-between px-4 py-3">
              <Link href="/" className="flex min-w-[64px] flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                <Home className="h-5 w-5" />
                <span>Sorteio</span>
              </Link>
              <Link href="/jogadores" className="flex min-w-[64px] flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                <Users className="h-5 w-5" />
                <span>Jogadores</span>
              </Link>
              <Link href="/replay" className="flex min-w-[64px] flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
                <Camera className="h-5 w-5" />
                <span>Replay</span>
              </Link>
            </div>
          </nav>
          <Toaster position="top-right" richColors />
        </div>
      </body>
    </html>
  );
}
