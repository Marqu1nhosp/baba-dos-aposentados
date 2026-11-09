"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardCopy,
  Gift,
  Share2,
  Shield,
  Shirt,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Player } from "@/components/players/PlayerManager";

const drawResultStorageKey = "baba-draw-result";
const teamColorOptions = [
  { headerClass: "bg-rose-600", badgeClass: "bg-rose-600 text-white", emoji: "🔴" },
  { headerClass: "bg-blue-600", badgeClass: "bg-blue-600 text-white", emoji: "🔵" },
  { headerClass: "bg-emerald-600", badgeClass: "bg-emerald-600 text-white", emoji: "🟢" },
  { headerClass: "bg-amber-500", badgeClass: "bg-amber-500 text-white", emoji: "🟡" },
  { headerClass: "bg-black", badgeClass: "bg-black text-white", emoji: "⚫" },
] as const;

interface DrawResult {
  teams: Player[][];
  teamSize: number;
  expiresAt: number;
}

function isDrawResult(value: unknown): value is DrawResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (
    (result.teamSize === 5 || result.teamSize === 6) &&
    typeof result.expiresAt === "number" &&
    Array.isArray(result.teams) &&
    result.teams.length > 0 &&
    result.teams.every(
      (team) =>
        Array.isArray(team) &&
        team.every(
          (player) =>
            player !== null &&
            typeof player === "object" &&
            typeof player.id === "string" &&
            typeof player.name === "string" &&
            typeof player.rating === "number",
        ),
    )
  );
}

function getResultText(teams: Player[][]) {
  return ["⚽ BABA DOS APOSENTADOS", ""]
    .concat(
      teams.flatMap((team, index) => [
        `${teamColorOptions[index % teamColorOptions.length].emoji} TIME ${index + 1}`,
        ...team.map((player) => `• ${player.name}`),
        "",
      ]),
    )
    .join("\n");
}

export function DrawResultPage() {
  const [result, setResult] = useState<DrawResult | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(drawResultStorageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isDrawResult(parsed) && parsed.expiresAt > Date.now()) {
          setResult(parsed);
        } else {
          window.sessionStorage.removeItem(drawResultStorageKey);
        }
      }
    } catch {
      toast.error("Não foi possível carregar o resultado do sorteio.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!result) return;

    const updateRemainingTime = () => {
      const seconds = Math.max(0, Math.ceil((result.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) {
        try {
          window.sessionStorage.removeItem(drawResultStorageKey);
        } catch {
          toast.error("Não foi possível apagar o resultado expirado.");
        }
        setResult(null);
      }
    };

    updateRemainingTime();
    const timer = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(timer);
  }, [result]);

  if (!loaded) {
    return <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500">Carregando resultado...</div>;
  }

  if (!result) {
    return (
      <section className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
          <Users className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-slate-950">Não tem resultado do sorteio</h2>
        <p className="text-sm text-slate-500">
          Faça um novo sorteio para ver os times aqui. Os resultados ficam disponíveis por 15 minutos.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          <ArrowLeft className="h-4 w-4" /> Ir para o sorteio
        </Link>
      </section>
    );
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="space-y-5 pb-20">
      <section className="rounded-[32px] bg-emerald-600 p-5 text-white shadow-[0_24px_80px_rgba(14,101,45,0.16)]">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-sm font-semibold text-white opacity-90 hover:opacity-100"
        >
          <ArrowLeft className="h-5 w-5" /> Voltar ao sorteio
        </Link>
        <div className="mt-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-emerald-100 shadow-sm">
            <Gift className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-semibold">Times sorteados!</h2>
          <p className="mt-2 text-sm text-emerald-100/80">Boa partida!</p>
          <p className="mt-3 text-sm font-semibold text-emerald-100/90">
            {result.teams.length} {result.teams.length === 1 ? "time" : "times"} com até{" "}
            {result.teamSize} jogadores
          </p>
          <p className="mt-2 text-xs text-emerald-100/80">
            Resultado disponível por {minutes}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      </section>

      <div className="space-y-4">
        {result.teams.map((team, index) => {
          const teamStyle = teamColorOptions[index % teamColorOptions.length];
          const strength = team.reduce((sum, player) => sum + player.rating, 0);
          return (
            <section
              key={index}
              className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm"
            >
              <div
                className={`relative flex items-center gap-3 overflow-hidden px-5 py-4 text-sm font-semibold text-white ${teamStyle.headerClass}`}
              >
                <div className="pointer-events-none absolute inset-0 opacity-25">
                  <svg viewBox="0 0 480 160" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M0 148 H480" />
                    <path d="M240 148 V8" />
                    <circle cx="240" cy="80" r="26" />
                    <path d="M214 80 H266" />
                    <path d="M48 20 H132" />
                    <path d="M348 20 H432" />
                  </svg>
                </div>
                <span className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/15 text-lg">
                  <Shield className="h-5 w-5" />
                </span>
                <div className="relative z-10">
                  <span className="block text-xl uppercase tracking-[0.18em]">Time {index + 1}</span>
                  <span className="block text-xs font-medium text-white/80">Força: {strength}</span>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {team.map((player, playerIndex) => (
                  <div key={player.id} className="flex items-center gap-4 px-5 py-4 text-sm text-slate-950">
                    <div className={`relative flex h-14 w-14 items-center justify-center rounded-3xl ${teamStyle.badgeClass}`}>
                      <Shirt className="absolute h-8 w-8 text-white/80" />
                      <span className="relative z-10 text-base font-semibold text-white">{playerIndex + 1}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-3 shadow-sm">
                      <span className="truncate font-medium">{player.name}</span>
                      <span className="flex shrink-0 items-center gap-0.5" aria-label={`${player.rating} estrelas`}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star
                            key={rating}
                            aria-hidden="true"
                            className={`h-3.5 w-3.5 ${rating <= player.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 border-t border-slate-200/70 bg-slate-50 px-5 py-3 text-sm text-slate-700">
                <Users className="h-4 w-4 text-slate-500" />
                <span>{team.length} Jogadores</span>
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="font-semibold text-slate-900">Dica</p>
        <p className="text-sm text-slate-500">
          Copie ou compartilhe o resultado antes que ele expire.
        </p>
      </section>

      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(getResultText(result.teams));
            toast.success("Resultado copiado");
          } catch {
            toast.error("Não foi possível copiar o resultado");
          }
        }}
        type="button"
        className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
      >
        <ClipboardCopy className="h-5 w-5" /> Copiar Resultado
      </button>
      <button
        onClick={() => {
          window.open(
            `https://api.whatsapp.com/send?text=${encodeURIComponent(getResultText(result.teams))}`,
            "_blank",
          );
        }}
        type="button"
        className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
      >
        <Share2 className="h-5 w-5" /> Compartilhar no WhatsApp
      </button>
    </div>
  );
}
