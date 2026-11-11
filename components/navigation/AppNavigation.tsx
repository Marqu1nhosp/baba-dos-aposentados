"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, Users } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function AppNavigation() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(15,23,42,0.08)]">
      <div className="mx-auto flex max-w-md justify-between px-4 py-3">
        <Link href="/" prefetch className="flex min-w-[64px] flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
          <Home className="h-5 w-5" />
          <span>Sorteio</span>
        </Link>
        <Link href="/resultado" className="flex min-w-[64px] flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
          <ClipboardList className="h-5 w-5" />
          <span>Resultados</span>
        </Link>
        <Link href="/jogadores" prefetch className="flex min-w-[64px] flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700">
          <Users className="h-5 w-5" />
          <span>Jogadores</span>
        </Link>
        <LogoutButton />
      </div>
    </nav>
  );
}
