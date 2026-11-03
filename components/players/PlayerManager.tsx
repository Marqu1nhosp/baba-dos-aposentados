"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCopy,
  Gift,
  Plus,
  Share2,
  Shield,
  Shirt,
  Shuffle,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

export interface Player {
  id: string;
  name: string;
  rating: number;
}

const teamColorOptions = [
  { headerClass: "bg-rose-600", badgeClass: "bg-rose-600 text-white", emoji: "🔴" },
  { headerClass: "bg-blue-600", badgeClass: "bg-blue-600 text-white", emoji: "🔵" },
  { headerClass: "bg-emerald-600", badgeClass: "bg-emerald-600 text-white", emoji: "🟢" },
  { headerClass: "bg-amber-500", badgeClass: "bg-amber-500 text-white", emoji: "🟡" },
  { headerClass: "bg-black", badgeClass: "bg-black text-white", emoji: "⚫" },
] as const;

interface PlayerManagerProps {
  initialPlayers: Player[];
  manageOnly?: boolean;
}

export function PlayerManager({ initialPlayers, manageOnly = false }: PlayerManagerProps) {
  const [players, setPlayers] = useState(initialPlayers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [newPlayerRating, setNewPlayerRating] = useState(3);
  const [teamSize, setTeamSize] = useState(6);
  const [teams, setTeams] = useState<Player[][]>([]);
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);
  const selectedCount = players.filter((player) => selectedIds.includes(player.id)).length;

  const addPlayer = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Nome deve ter ao menos 2 caracteres.");
      return;
    }
    if (players.some((player) => player.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Nome duplicado não é permitido.");
      return;
    }

    let result: Player | null = null;
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, rating: newPlayerRating }),
      });
      result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(
          (result as { error?: string } | null)?.error ??
          "Não foi possível adicionar o jogador.",
        );
        return;
      }
    } catch {
      toast.error(
        "Não foi possível conectar ao servidor. Verifique se o Next.js está em execução.",
      );
      return;
    }
    if (!result) {
      toast.error("O servidor retornou uma resposta inválida.");
      return;
    }

    setPlayers((current) => [...current, result].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    setNewPlayerRating(3);
    toast.success("Jogador adicionado com sucesso.");
  };

  const removePlayer = async (player: Player) => {
    try {
      const response = await fetch(`/api/players/${player.id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Não foi possível remover o jogador.");
        return;
      }
    } catch {
      toast.error(
        "Não foi possível conectar ao servidor. Verifique se o Next.js está em execução.",
      );
      return;
    }
    setPlayers((current) => current.filter((item) => item.id !== player.id));
    setSelectedIds((current) => current.filter((id) => id !== player.id));
    toast.success(`${player.name} removido.`);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const sortTeams = () => {
    if (selectedCount < teamSize) {
      toast.error(`Selecione pelo menos ${teamSize} jogadores.`);
      return;
    }
    if (selectedCount > 25) {
      toast.error("Só é possível sortear até 25 jogadores.");
      return;
    }

    const selectedPlayers = players.filter((player) =>
      selectedIds.includes(player.id),
    );
    const shuffledByRating = [...selectedPlayers];

    for (let index = shuffledByRating.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledByRating[index], shuffledByRating[randomIndex]] = [
        shuffledByRating[randomIndex],
        shuffledByRating[index],
      ];
    }

    shuffledByRating.sort((a, b) => b.rating - a.rating);

    const teamCount = Math.ceil(selectedPlayers.length / teamSize);
    const newTeams: Player[][] = Array.from(
      { length: teamCount },
      () => [],
    );
    const teamStrength = newTeams.map(() => 0);

    shuffledByRating.forEach((player) => {
      const availableTeams = newTeams
        .map((team, index) => ({ team, index }))
        .filter(({ team }) => team.length < teamSize);

      const minimumStrength = Math.min(
        ...availableTeams.map(({ index }) => teamStrength[index]),
      );
      const weakestTeams = availableTeams.filter(
        ({ index }) => teamStrength[index] === minimumStrength,
      );
      const chosen =
        weakestTeams[Math.floor(Math.random() * weakestTeams.length)];

      chosen.team.push(player);
      teamStrength[chosen.index] += player.rating;
    });

    setTeams(newTeams);
    toast.success("Times sorteados equilibrando as estrelas!");
  };

  return (
    <div className="space-y-5 pb-20">
      {teams.length === 0 && (
        <>
          <section className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <span className="text-lg font-semibold">B</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Baba dos Aposentados</h2>
                <p className="text-sm text-slate-500">
                  {manageOnly
                    ? "Cadastre os jogadores e avalie cada atleta."
                    : "Selecione os presentes e sorteie os times."}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Jogadores disponíveis</h2>
                <p className="text-sm text-slate-500">
                  {manageOnly
                    ? "Adicione, avalie e gerencie a lista permanente."
                    : "Selecione quem vai participar da partida de hoje."}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {manageOnly ? `${players.length} jogadores` : `${selectedCount} de ${players.length}`}
              </span>
            </div>

            {manageOnly && (
              <form onSubmit={addPlayer} className="grid gap-3 sm:grid-cols-[1fr,auto]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <label className="sr-only" htmlFor="nome">Nome do jogador</label>
                  <input
                    id="nome"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nome do jogador"
                    maxLength={30}
                    className="w-full border-none bg-transparent text-slate-950 outline-none placeholder:text-slate-400"
                  />
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">Avaliação ao cadastrar</span>
                    <div className="flex items-center gap-1" role="radiogroup" aria-label="Avaliação do novo jogador">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          role="radio"
                          aria-checked={newPlayerRating === rating}
                          aria-label={`Avaliar novo jogador com ${rating} ${rating === 1 ? "estrela" : "estrelas"}`}
                          onClick={() => setNewPlayerRating(rating)}
                          className="rounded-md text-amber-400"
                        >
                          <Star
                            className={`h-5 w-5 ${rating <= newPlayerRating ? "fill-current" : "fill-transparent text-slate-300"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
                  <Plus className="h-4 w-4" /> Adicionar
                </button>
              </form>
            )}

            {!manageOnly && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[5, 6].map((size) => (
                    <label key={size} className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 ${teamSize === size ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700"}`}>
                      <input
                        type="radio"
                        name="teamSize"
                        checked={teamSize === size}
                        onChange={() => setTeamSize(size)}
                        className="h-4 w-4 text-emerald-600"
                      />
                      <span className="text-sm font-medium">Times com {size}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPlayerPickerOpen(true)}
                  className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                      <Users className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-950">Selecionar jogadores</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {selectedCount === 0
                          ? "Nenhum jogador selecionado"
                          : `${selectedCount} selecionados para hoje`}
                      </span>
                    </span>
                  </span>
                  <span className="text-lg font-semibold text-slate-400">›</span>
                </button>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Jogadores confirmados</p>
                  {selectedCount === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                      Nenhum jogador selecionado para o sorteio.
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {players
                        .filter((player) => selectedIds.includes(player.id))
                        .map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3"
                          >
                            <span className="min-w-0 truncate text-sm font-medium text-slate-950">
                              {player.name}
                            </span>
                            <span className="flex shrink-0 items-center gap-0.5" aria-label={`${player.rating} estrelas`}>
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <Star
                                  key={rating}
                                  aria-hidden="true"
                                  className={`h-3.5 w-3.5 ${rating <= player.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-transparent text-slate-300"
                                    }`}
                                />
                              ))}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {manageOnly && <div className="space-y-3">
              {players.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  Nenhum jogador adicionado ainda.
                </div>
              ) : players.map((player) => (
                <div key={player.id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {!manageOnly && (
                      <button
                        type="button"
                        onClick={() => toggleSelection(player.id)}
                        aria-pressed={selectedIds.includes(player.id)}
                        aria-label={`${selectedIds.includes(player.id) ? "Desmarcar" : "Selecionar"} ${player.name}`}
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${selectedIds.includes(player.id) ? "border-emerald-500 bg-emerald-500/10 text-emerald-700" : "border-slate-200 bg-white text-slate-400"}`}
                      >
                        <CheckCircle2 className={`h-5 w-5 ${selectedIds.includes(player.id) ? "" : "opacity-30"}`} />
                      </button>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-950">{player.name}</span>
                      <span className="mt-1 flex items-center gap-0.5" aria-label={`${player.rating} estrelas`}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star
                            key={rating}
                            aria-hidden="true"
                            className={`h-4 w-4 ${rating <= player.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                          />
                        ))}
                      </span>
                    </span>
                  </div>
                  {manageOnly && (
                    <button type="button" onClick={() => removePlayer(player)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-500 transition hover:bg-rose-50" aria-label={`Excluir definitivamente ${player.name}`}>
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>}

            {!manageOnly && (
              <>
                <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-sm text-slate-900 shadow-sm">
                  <p className="font-semibold text-emerald-700">{selectedCount} {selectedCount === 1 ? "jogador selecionado" : "jogadores selecionados"}</p>
                  <p className="mt-1 text-slate-600">
                    {selectedCount >= teamSize
                      ? `Serão formados ${Math.ceil(selectedCount / teamSize)} times de até ${teamSize}`
                      : `Selecione ao menos ${teamSize} jogadores`}
                  </p>
                </div>
                <button onClick={sortTeams} type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500">
                  <Shuffle className="h-5 w-5" /> Sortear Times
                </button>
              </>
            )}
          </section>
        </>
      )}

      {teams.length > 0 && (
        <div className="space-y-5 pb-28">
          <section className="rounded-[32px] bg-emerald-600 p-5 text-white shadow-[0_24px_80px_rgba(14,101,45,0.16)]">
            <button
              onClick={() => setTeams([])}
              type="button"
              className="inline-flex items-center gap-3 text-sm font-semibold text-white opacity-90 hover:opacity-100"
            >
              <ArrowLeft className="h-5 w-5" /> Voltar
            </button>
            <div className="mt-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-emerald-100 shadow-sm">
                <Gift className="h-10 w-10" />
              </div>
              <h1 className="text-2xl font-semibold">Times sorteados!</h1>
              <p className="mt-2 text-sm text-emerald-100/80">Boa partida!</p>
              <p className="mt-3 text-sm font-semibold text-emerald-100/90">
                {teams.length} {teams.length === 1 ? "time" : "times"} de até {teamSize} jogadores
              </p>
            </div>
          </section>

          <div className="space-y-4">
            {teams.map((team, index) => {
              const teamStyle = teamColorOptions[index % teamColorOptions.length];
              const strength = team.reduce((sum, player) => sum + player.rating, 0);
              return (
                <section key={index} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                  <div className={`relative flex items-center gap-3 overflow-hidden px-5 py-4 text-sm font-semibold text-white ${teamStyle.headerClass}`}>
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
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700">
                <span className="text-xl">💡</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Dica</p>
                <p className="text-sm text-slate-500">Salve esse resultado ou compartilhe com o grupo do Baba dos Aposentados!</p>
              </div>
            </div>
          </section>

          <button
            onClick={async () => {
              const text = ["⚽ BABA DOS APOSENTADOS", ""]
                .concat(teams.flatMap((team, index) => [
                  `${teamColorOptions[index % teamColorOptions.length].emoji} TIME ${index + 1}`,
                  ...team.map((player) => `• ${player.name}`),
                  "",
                ]))
                .join("\n");
              try {
                await navigator.clipboard.writeText(text);
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
              const text = ["⚽ BABA DOS APOSENTADOS", ""]
                .concat(teams.flatMap((team, index) => [
                  `${teamColorOptions[index % teamColorOptions.length].emoji} TIME ${index + 1}`,
                  ...team.map((player) => `• ${player.name}`),
                  "",
                ]))
                .join("\n");
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
            }}
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <Share2 className="h-5 w-5" /> Compartilhar no WhatsApp
          </button>
        </div>
      )}

      {playerPickerOpen && !manageOnly && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlayerPickerOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-picker-title"
            className="max-h-[82vh] w-full max-w-md overflow-hidden rounded-t-[32px] bg-white shadow-2xl sm:rounded-[32px]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="player-picker-title" className="text-lg font-semibold text-slate-950">
                  Jogadores de hoje
                </h2>
                <p className="mt-1 text-xs text-slate-500">{selectedCount} selecionados</p>
              </div>
              <button
                type="button"
                onClick={() => setPlayerPickerOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
                aria-label="Fechar seleção de jogadores"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setSelectedIds(players.map((player) => player.id))}
                className="flex-1 rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-700"
              >
                Selecionar todos
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="flex-1 rounded-2xl bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-600"
              >
                Limpar
              </button>
            </div>

            <div className="max-h-[52vh] space-y-2 overflow-y-auto p-5">
              {players.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  Cadastre jogadores na página Jogadores.
                </div>
              ) : players.map((player) => {
                const selected = selectedIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => toggleSelection(player.id)}
                    aria-pressed={selected}
                    className={`flex w-full items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-left transition ${selected
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 bg-white"
                      }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-950">{player.name}</span>
                      <span className="mt-1 flex items-center gap-0.5" aria-label={`${player.rating} estrelas`}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star
                            key={rating}
                            aria-hidden="true"
                            className={`h-4 w-4 ${rating <= player.rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-slate-300"}`}
                          />
                        ))}
                      </span>
                    </span>
                    <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-300"}`}>
                      <CheckCircle2 className="h-5 w-5" />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => setPlayerPickerOpen(false)}
                className="w-full rounded-3xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Confirmar seleção
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
