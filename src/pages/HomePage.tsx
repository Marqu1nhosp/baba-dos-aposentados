import { useState, type ClipboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Plus, Shuffle, Trash2 } from 'lucide-react';
import { playerSchema, PlayerFormData } from '../schemas/player';
import { useLocalStorage } from '../hooks/useLocalStorage';

function shufflePlayers<T>(players: T[]) {
    return [...players].sort(() => Math.random() - 0.5);
}

export function HomePage({ onSortComplete }: { onSortComplete: (teams: string[][]) => void }) {
    const [players, setPlayers] = useLocalStorage<string[]>('baba-players', [], 30);
    const [selectedPlayers, setSelectedPlayers] = useLocalStorage<string[]>('baba-selected-players', [], 30);
    const [toastMessage, setToastMessage] = useState('');

    const form = useForm<PlayerFormData>({
        resolver: zodResolver(playerSchema),
        defaultValues: { nome: '' },
    });

    const totalSelected = selectedPlayers.length;
    const totalPlayers = players.length;
    const teamCount = Math.ceil(totalSelected / 5);

    const selectedPlayersText = `${totalSelected} jogadores selecionados`;

    const teamsCountText = totalSelected >= 5 ? `Serão formados ${teamCount} times de 5` : 'Selecione ao menos 5 jogadores';

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
            setToastMessage('Nome duplicado não é permitido.');
            return;
        }
        setPlayers([...players, name]);
        setSelectedPlayers([...selectedPlayers, name]);
        form.reset();
        setToastMessage('Jogador adicionado com sucesso.');
    };

    const handlePasteNames = (event: ClipboardEvent<HTMLInputElement>) => {
        const text = event.clipboardData.getData('text/plain');
        const parsedNames = parsePlayersFromText(text);

        if (parsedNames.length === 0) return;

        event.preventDefault();

        const newNames = parsedNames.filter((name) => name.trim().length > 1 && !players.includes(name));
        if (newNames.length === 0) {
            setToastMessage('Esses nomes já foram adicionados.');
            return;
        }

        setPlayers([...players, ...newNames]);
        setSelectedPlayers([...selectedPlayers, ...newNames]);
        form.reset();
        setToastMessage(`${newNames.length} jogadores adicionados com colagem.`);
    };

    const toggleSelection = (name: string) => {
        setSelectedPlayers((current) =>
            current.includes(name) ? current.filter((player) => player !== name) : [...current, name],
        );
    };

    const handleRemovePlayer = (name: string) => {
        setPlayers(players.filter((player) => player !== name));
        setSelectedPlayers(selectedPlayers.filter((player) => player !== name));
        setToastMessage(`${name} removido.`);
    };

    const handleSortTeams = () => {
        if (selectedPlayers.length < 5) {
            setToastMessage('Selecione pelo menos 5 jogadores.');
            return;
        }

        const shuffled = shufflePlayers(selectedPlayers);
        const newTeams: string[][] = [];
        for (let index = 0; index < shuffled.length; index += 5) {
            newTeams.push(shuffled.slice(index, index + 5));
        }

        onSortComplete(newTeams);

        if (typeof window !== 'undefined') {
            const expiry = Date.now() + 30 * 60 * 1000;
            window.localStorage.setItem('baba-teams', JSON.stringify({ value: newTeams, expiry }));
        }

        setToastMessage('Times sorteados!');
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
                </div>

                <button onClick={handleSortTeams} type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500">
                    <Shuffle className="h-5 w-5" /> Sortear Times
                </button>
            </section>


            {toastMessage && (
                <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-3rem)] -translate-x-1/2 rounded-3xl border border-slate-800/80 bg-slate-950/95 px-4 py-3 text-sm text-slate-100 shadow-soft backdrop-blur-xl">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
