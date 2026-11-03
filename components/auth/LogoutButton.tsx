"use client";

import { LogOut } from "lucide-react";
import { usePathname } from "next/navigation";

export function LogoutButton() {
  const pathname = usePathname();

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/login");
    }
  };

  if (pathname === "/login") return null;

  return (
    <button
      type="button"
      onClick={logout}
      className="flex min-w-[64px] flex-col items-center gap-1 rounded-3xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600"
    >
      <LogOut className="h-5 w-5" />
      <span>Sair</span>
    </button>
  );
}
