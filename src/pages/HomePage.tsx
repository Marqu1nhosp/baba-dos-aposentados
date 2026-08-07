import { useEffect, useState, type ClipboardEvent } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Plus, Shuffle, Trash2 } from 'lucide-react';
import { playerSchema, PlayerFormData } from '../schemas/player';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MAX_SORTABLE_PLAYERS = 24;
const DEFAULT_TEAM_SIZE = 6;
const SORT_LOCK_KEY = 'baba-sort-lock';
const SORT_LOCK_DURATION = 30 * 60 * 1000;

function shufflePlayers<T>(players: T[]) {
    return [...players].sort(() => Math.random() - 0.5);
}

export function HomePage({ onSortComplete }: { onSortComplete: (teams: string[][]) => void }) {
    const [players, setPlayers] = useLocalStorage<string[]>('baba-players', [], 30);
    const [selectedPlayers, setSelectedPlayers] = useLocalStorage<string[]>('baba-selected-players', [], 30);
    const [sortLockExpiry, setSortLockExpiry] = useState<number | null>(null);
    const [teamSize, setTeamSize] = useState<number>(DEFAULT_TEAM_SIZE);

    const form = useForm<PlayerFormData>({
        resolver: zodResolver(playerSchema),
        defaultValues: { nome: '' },
    });

    const totalSelected = selectedPlayers.length;
    const totalPlayers = players.length;
    const teamCount = Math.ceil(totalSelected / teamSize);

    const selectedPlayersText = `${totalSelected} jogadores selecionados`;

    const teamsCountText = totalSelected >= teamSize
        ? `Serão formados ${teamCount} times de até ${teamSize}`
        : `Selecione ao menos ${teamSize} jogadores`;

    const currentTime = Date.now();
    //const isSortLocked = sortLockExpiry !== null && sortLockExpiry > currentTime;
    //const lockMinutes = isSortLocked ? Math.ceil((sortLockExpiry - currentTime) / 60000) : 0;

    const sortingLimitText = totalSelected > MAX_SORTABLE_PLAYERS
        ? `Apenas os primeiros ${MAX_SORTABLE_PLAYERS} selecionados podem ser sorteados.`
        : '';

    // const sortLockText = isSortLocked
    //     ? `Sorteio bloqueado por mais ${lockMinutes} min.`
    //     : '';

    const parsePlayersFromText = (text: string) => {
        const normalizedText = text
            .replace(/\r/g, '\n')
            .replace(/\u00a0/g, ' ')
            .replace(/confirmados\s*:/gi, '')
            .replace(/participantes\s*:/gi, '')
            .replace(/jogadores\s*:/gi, '')
            .trim();

        if (!normalizedText) return [];

        const withBreaks = normalizedText
            .replace(/\n+/g, '\n')
            .replace(/\s*\|\s*/g, '\n')
            .replace(/\s*\/\s*/g, '\n')
            .replace(/\s*;\s*/g, '\n')
            .replace(/\s*,\s*/g, '\n')
            .replace(/\s*•\s*/g, '\n')
            .replace(/(?<!\n)\s*(\d+)\s*[-.)]\s*/g, '\n$1 - ');

        const lines = withBreaks
            .split(/\n+/)
            .map((line) => line.replace(/^[-•]\s*/, '').trim())
            .filter(Boolean);

        const names = lines.flatMap((line) => {
            const cleanedLine = line
                .replace(/^\d+\s*[-.)]?\s*/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (!cleanedLine) return [];
            if (/^\d+$/.test(cleanedLine)) return [];
            if (/^(confirmados|participantes|jogadores|nomes|lista|e)$/i.test(cleanedLine)) return [];
            if (cleanedLine.length < 2) return [];

            return [cleanedLine];
        });

        if (names.length > 0) return names;

        return (normalizedText.match(/[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*/g) ?? [])
            .map((value) => value.trim())
            .filter((value) => value && !/^(confirmados|participantes|jogadores|nomes|lista|e)$/i.test(value));
    };

    const handleAddPlayer = (data: PlayerFormData) => {
        const name = data.nome.trim();
        if (!name) return;

        if (players.includes(name)) {
            toast.error('Nome duplicado não é permitido.');
            return;
        }

        setPlayers([...players, name]);
        setSelectedPlayers([...selectedPlayers, name]);
        form.reset();
        toast.success('Jogador adicionado com sucesso.');
    };

    const handlePasteNames = (event: ClipboardEvent<HTMLInputElement>) => {
        const text = event.clipboardData.getData('text/plain');
        const parsedNames = parsePlayersFromText(text);

        if (parsedNames.length === 0) return;

        event.preventDefault();

        const newNames = parsedNames.filter((name) => name.trim().length > 1 && !players.includes(name));
        if (newNames.length === 0) {
            toast.error('Esses nomes já foram adicionados.');
            return;
        }

        setPlayers([...players, ...newNames]);
        setSelectedPlayers([...selectedPlayers, ...newNames]);
        form.reset();
        toast.success(`${newNames.length} jogadores adicionados com colagem.`);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const rawExpiry = window.localStorage.getItem(SORT_LOCK_KEY);
        if (!rawExpiry) return;

        const expiry = Number(rawExpiry);
        if (!Number.isNaN(expiry) && expiry > Date.now()) {
            setSortLockExpiry(expiry);
        }
    }, []);

    const toggleSelection = (name: string) => {
        setSelectedPlayers((current) =>
            current.includes(name) ? current.filter((player) => player !== name) : [...current, name],
        );
    };

    const handleRemovePlayer = (name: string) => {
        setPlayers(players.filter((player) => player !== name));
        setSelectedPlayers(selectedPlayers.filter((player) => player !== name));
        toast(`${name} removido.`, {
            position: 'bottom-center', duration: 1000, style: {
                background: '#f87171',
                color: '#ffffff',
            }
        });
    };

    const handleSortTeams = () => {
        if (selectedPlayers.length < teamSize) {
            toast.error(`Selecione pelo menos ${teamSize} jogadores.`);
            return;
        }

        if (selectedPlayers.length > MAX_SORTABLE_PLAYERS) {
            toast.error(`Só é possível sortear até ${MAX_SORTABLE_PLAYERS} jogadores. Desmarque alguns ou remova excedentes.`);
            return;
        }

        if (sortLockExpiry !== null && sortLockExpiry > Date.now()) {
            toast.error('Sorteio bloqueado por 30 minutos após o último sorteio. Tente novamente mais tarde.');
            return;
        }

        const shuffled = shufflePlayers(selectedPlayers);
        const newTeams: string[][] = [];
        for (let index = 0; index < shuffled.length; index += teamSize) {
            newTeams.push(shuffled.slice(index, index + teamSize));
        }

        onSortComplete(newTeams);

        const expiry = Date.now() + SORT_LOCK_DURATION;
        setSortLockExpiry(expiry);

        if (typeof window !== 'undefined') {
            window.localStorage.setItem('baba-teams', JSON.stringify({ value: newTeams, expiry }));
            // window.localStorage.setItem(SORT_LOCK_KEY, String(expiry));
        }

        toast.success('Times sorteados!');
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
                        <p className="text-sm text-slate-500">Adicione os jogadores e sorteie os times.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-950">Jogadores disponíveis</h2>
                        <p className="text-sm text-slate-500">Adicione e selecione os participantes do dia.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{totalPlayers} jogadores</span>
                </div>

                <form onSubmit={form.handleSubmit(handleAddPlayer)} className="grid gap-3 sm:grid-cols-[1fr,auto]">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <label className="sr-only" htmlFor="nome">Nome do jogador</label>
                        <input
                            id="nome"
                            {...form.register('nome')}
                            onPaste={handlePasteNames}
                            placeholder="Nome do jogador"
                            className="w-full border-none bg-transparent text-slate-950 outline-none placeholder:text-slate-400"
                        />
                        <p className="mt-2 text-xs text-slate-500">Você pode colar uma lista como “Confirmados: 1 - Ciclano 2 - Beltrano.</p>
                        {form.formState.errors.nome && <p className="mt-2 text-sm text-rose-500">{form.formState.errors.nome.message}</p>}
                    </div>
                    <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
                        <Plus className="h-4 w-4" />
                        Adicionar
                    </button>
                </form>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 ${teamSize === 5 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                        <input
                            type="checkbox"
                            checked={teamSize === 5}
                            onChange={() => setTeamSize(5)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium">Times com 5 jogadores</span>
                    </label>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 ${teamSize === 6 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                        <input
                            type="checkbox"
                            checked={teamSize === 6}
                            onChange={() => setTeamSize(6)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium">Times com 6 jogadores</span>
                    </label>
                </div>

                <div className="space-y-3">
                    {players.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">Nenhum jogador adicionado ainda.</div>
                    ) : (
                        <div className="space-y-2">
                            {players.map((player) => (
                                <div key={player} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                                    <button type="button" onClick={() => toggleSelection(player)} className="flex items-center gap-3 text-left">
                                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border ${selectedPlayers.includes(player) ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                                            {selectedPlayers.includes(player) ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm">✓</span>}
                                        </span>
                                        <span className="text-sm font-medium text-slate-950">{player}</span>
                                    </button>
                                    <button type="button" onClick={() => handleRemovePlayer(player)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-rose-500 transition hover:bg-rose-50">
                                        <span className="sr-only">Remover</span>
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-sm text-slate-900 shadow-sm">
                    <p className="font-semibold text-emerald-700">{selectedPlayersText}</p>
                    <p className="mt-1 text-slate-600">{teamsCountText}</p>
                    {/* {sortingLimitText ? <p className="mt-1 text-sm text-rose-600">{sortingLimitText}</p> : null}
                    {sortLockText ? <p className="mt-1 text-sm text-rose-600">{sortLockText}</p> : null} */}
                </div>

                <button onClick={handleSortTeams} type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500">
                    <Shuffle className="h-5 w-5" /> Sortear Times
                </button>
            </section>



        </div>
    );
}
