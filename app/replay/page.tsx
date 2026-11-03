"use client";

import { Camera } from "lucide-react";

export default function ReplayPage() {
  return (
    <section className="rounded-[32px] border border-slate-800/80 bg-slate-900/90 p-6 text-center shadow-soft backdrop-blur-xl">
      <Camera className="mx-auto h-10 w-10 text-emerald-300" />
      <h2 className="mt-4 text-lg font-semibold text-white">Replay</h2>
      <p className="mt-2 text-sm text-slate-400">
        Revise os resultados das partidas anteriores.
      </p>
    </section>
  );
}
