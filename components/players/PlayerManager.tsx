"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Plus,
  Search,
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

const selectedPlayersStorageKey = "baba-selected-player-ids";
const drawResultStorageKey = "baba-draw-result";
const drawResultDurationMs = 15 * 60 * 1000;

function normalizePlayerSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

interface PlayerManagerProps {
  initialPlayers: Player[];
  manageOnly?: boolean;
}

export function PlayerManager({ initialPlayers, manageOnly = false }: PlayerManagerProps) {
  const router = useRouter();
  const [players, setPlayers] = useState(initialPlayers);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [newPlayerRating, setNewPlayerRating] = useState(3);
  const [teamSize, setTeamSize] = useState(6);
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectionLoaded, setSelectionLoaded] = useState(false);
  const selectedCount = players.filter((player) => selectedIds.includes(player.id)).length;
  const normalizedPlayerSearch = normalizePlayerSearch(playerSearch);
  const filteredPlayers = players.filter((player) =>
    normalizePlayerSearch(player.name).includes(normalizedPlayerSearch),
  );

  function closePlayerPicker() {
    setPlayerPickerOpen(false);
    setPlayerSearch("");
  }

  useEffect(() => {
    try {
      const savedSelection = window.sessionStorage.getItem(selectedPlayersStorageKey);
      if (savedSelection) {
        const parsed: unknown = JSON.parse(savedSelection);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === "string")) {
          setSelectedIds(parsed);
        } else {
          toast.error("Não foi possível restaurar a seleção de jogadores salva.");
        }
      }
    } catch {
      toast.error("Não foi possível acessar a seleção de jogadores salva.");
    } finally {
      setSelectionLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!selectionLoaded) return;
    try {
      window.sessionStorage.setItem(selectedPlayersStorageKey, JSON.stringify(selectedIds));
    } catch {
      toast.error("Não foi possível salvar a seleção de jogadores.");
    }
  }, [selectedIds, selectionLoaded]);

  const addPlayer = async (event: FormEvent, selectAfterAdd = false) => {
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
    if (selectAfterAdd) {
      setSelectedIds((current) => [...current, result.id]);
      setPlayerSearch("");
      setAddPlayerModalOpen(false);
    }
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
    const remainingPlayers = selectedPlayers.length % teamSize;
    const teamCapacities = Array.from({ length: teamCount }, (_, index) =>
      remainingPlayers > 0 && index === teamCount - 1
        ? remainingPlayers
        : teamSize,
    );
    const newTeams: Player[][] = Array.from(
      { length: teamCount },
      () => [],
    );
    const teamStrength = newTeams.map(() => 0);

    shuffledByRating.forEach((player) => {
      const availableTeams = newTeams
        .map((team, index) => ({ team, index }))
        .filter(({ team, index }) => team.length < teamCapacities[index]);

      const minimumPlayerCount = Math.min(
        ...availableTeams.map(({ team }) => team.length),
      );
      const teamsWithSpace = availableTeams.filter(
        ({ team }) => team.length === minimumPlayerCount,
      );
      const minimumStrength = Math.min(
        ...teamsWithSpace.map(({ index }) => teamStrength[index]),
      );
      const weakestTeams = teamsWithSpace.filter(
        ({ index }) => teamStrength[index] === minimumStrength,
      );
      const chosen =
        weakestTeams[Math.floor(Math.random() * weakestTeams.length)];

      chosen.team.push(player);
      teamStrength[chosen.index] += player.rating;
    });

    try {
      window.sessionStorage.setItem(
        drawResultStorageKey,
        JSON.stringify({
          teams: newTeams,
          teamSize,
          expiresAt: Date.now() + drawResultDurationMs,
        }),
      );
    } catch {
      toast.error("Não foi possível salvar o resultado do sorteio.");
      return;
    }
    toast.success("Times sorteados equilibrando as estrelas!");
    router.push("/resultado");
  };

  return (
    <div className="space-y-5 pb-20">
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
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-slate-700">
                    Quantos jogadores por time?
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {[5, 6].map((size) => (
                      <label
                        key={size}
                        className={`flex cursor-pointer items-center gap-2 rounded-2xl border p-3 transition ${
                          teamSize === size
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="teamSize"
                          value={size}
                          checked={teamSize === size}
                          onChange={() => setTeamSize(size)}
                          className="sr-only"
                        />
                        <span
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                            teamSize === size
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {size}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            Times com {size}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
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

      {playerPickerOpen && !manageOnly && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePlayerPicker();
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
                onClick={closePlayerPicker}
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

            <div className="max-h-[52vh] space-y-3 overflow-y-auto p-5">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="sr-only">Pesquisar jogador pelo nome</span>
                <input
                  type="search"
                  value={playerSearch}
                  onChange={(event) => setPlayerSearch(event.target.value)}
                  placeholder="Pesquisar jogador pelo nome"
                  className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                />
              </label>

              <button
                type="button"
                onClick={() => setAddPlayerModalOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <Plus className="h-4 w-4" /> Adicionar novo jogador
              </button>

              {filteredPlayers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {players.length === 0
                    ? "Nenhum jogador cadastrado. Adicione um jogador acima."
                    : "Nenhum jogador encontrado com esse nome."}
                </div>
              ) : filteredPlayers.map((player) => {
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
                onClick={closePlayerPicker}
                className="w-full rounded-3xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Confirmar seleção
              </button>
            </div>
          </section>
        </div>
      )}

      {addPlayerModalOpen && !manageOnly && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddPlayerModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-player-title"
            className="w-full max-w-sm rounded-[32px] bg-white p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="add-player-title" className="text-lg font-semibold text-slate-950">
                Adicionar jogador
              </h2>
              <button
                type="button"
                onClick={() => setAddPlayerModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
                aria-label="Fechar cadastro de jogador"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(event) => addPlayer(event, true)} className="space-y-4">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-slate-700"
                  htmlFor="novo-jogador-selecao"
                >
                  Nome do jogador
                </label>
                <input
                  id="novo-jogador-selecao"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nome do jogador"
                  maxLength={30}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-950 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">Estrelas</span>
                <div
                  className="flex items-center gap-1"
                  role="radiogroup"
                  aria-label="Avaliação do novo jogador"
                >
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
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddPlayerModalOpen(false)}
                  className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
