import { useMemo } from 'react';
import { ArrowLeft, Share2, ClipboardCopy, Gift, Shield, Shirt, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '../hooks/useLocalStorage';

const teamColorOptions = [
    { headerClass: 'bg-rose-600', badgeClass: 'bg-rose-600 text-white', emoji: '🔴' },
    { headerClass: 'bg-blue-600', badgeClass: 'bg-blue-600 text-white', emoji: '🔵' },
    { headerClass: 'bg-emerald-600', badgeClass: 'bg-emerald-600 text-white', emoji: '🟢' },
    { headerClass: 'bg-amber-500', badgeClass: 'bg-amber-500 text-white', emoji: '🟡' },
    { headerClass: 'bg-black', badgeClass: 'bg-black text-white', emoji: '⚫' },
] as const;

export function ResultPage({ teams, onBack }: { teams: string[][]; onBack: () => void }) {
    const [storedTeams] = useLocalStorage<string[][]>('baba-teams', [], 30);
    const effectiveTeams = teams.length > 0 ? teams : storedTeams;

    const teamStyles = useMemo(() => {
        if (effectiveTeams.length === 0) return [];

        const colors = [...teamColorOptions];
        for (let index = colors.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [colors[index], colors[randomIndex]] = [colors[randomIndex], colors[index]];
        }

        return effectiveTeams.map((_, teamIndex) => colors[teamIndex % colors.length]);
    }, [effectiveTeams]);

    const formattedResult = useMemo(() => {
        if (effectiveTeams.length === 0) return '';

        return ['⚽ BABA DOS APOSENTADOS', '']
            .concat(
                effectiveTeams.flatMap((team, index) => [
                    `${teamStyles[index]?.emoji ?? '⚫'} TIME ${index + 1}`,
                    ...team.map((player) => `• ${player}`),
                    '',
                ]),
            )
            .join('\n');
    }, [effectiveTeams, teamStyles]);

    const copyResult = async () => {
        if (!formattedResult) return;
        try {
            await navigator.clipboard.writeText(formattedResult);
            toast.success('Resultado copiado');
        } catch (err) {
            toast.error('Não foi possível copiar o resultado');
        }
    };

    const shareWhatsApp = () => {
        if (!formattedResult) return;
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(formattedResult)}`, '_blank');
    };

    return (
        <div className="space-y-5 pb-28">
            <section className="rounded-[32px] bg-emerald-600 p-5 text-white shadow-[0_24px_80px_rgba(14,101,45,0.16)]">
                <button onClick={onBack} type="button" className="inline-flex items-center gap-3 text-sm font-semibold text-white opacity-90 hover:opacity-100">
                    <ArrowLeft className="h-5 w-5" /> Voltar
                </button>
                <div className="mt-6 text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-emerald-100 shadow-sm">
                        <Gift className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-semibold">Times sorteados!</h1>
                    <p className="mt-2 text-sm text-emerald-100/80">Boa partida!</p>
                    <p className="mt-3 text-sm font-semibold text-emerald-100/90">{effectiveTeams.length} times de 5 jogadores</p>
                </div>
            </section>

            <div className="space-y-4">
                {effectiveTeams.map((team, index) => {
                    const teamStyle = teamStyles[index] ?? teamColorOptions[0];
                    return (
                        <section key={index} className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                            <div className={`relative overflow-hidden flex items-center gap-3 px-5 py-4 text-sm font-semibold text-white ${teamStyle.headerClass}`}>
                                <div className="pointer-events-none absolute inset-0 opacity-25">
                                    <svg viewBox="0 0 480 160" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M0 148 H480" />
                                        <path d="M240 148 V8" />
                                        <circle cx="240" cy="80" r="26" />
                                        <path d="M240 54 V106" />
                                        <path d="M214 80 H266" />
                                        <path d="M48 20 H132" />
                                        <path d="M348 20 H432" />
                                        <path d="M48 140 H132" />
                                        <path d="M348 140 H432" />
                                        <path d="M80 20 V60" />
                                        <path d="M400 20 V60" />
                                        <path d="M80 140 V100" />
                                        <path d="M400 140 V100" />
                                        <path d="M48 20 C88 60 128 60 240 20" />
                                        <path d="M432 20 C392 60 352 60 240 20" />
                                        <path d="M48 140 C88 100 128 100 240 140" />
                                        <path d="M432 140 C392 100 352 100 240 140" />
                                    </svg>
                                </div>
                                <span className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-white/15 text-lg">
                                    <Shield className="h-5 w-5" />
                                </span>
                                <span className="relative z-10 uppercase tracking-[0.18em] text-xl">Time {index + 1}</span>
                            </div>

                            <div className="divide-y divide-slate-200">
                                {team.map((player, playerIndex) => (
                                    <div key={player} className="flex items-center gap-4 px-5 py-4 text-sm text-slate-950">
                                        <div className={`relative flex h-14 w-14 items-center justify-center rounded-3xl ${teamStyle.badgeClass}`}>
                                            <Shirt className="absolute h-8 w-8 text-white/80" />
                                            <span className="relative z-10 text-base font-semibold text-white">{playerIndex + 1}</span>
                                        </div>
                                        <div className="flex min-w-0 items-center gap-3 rounded-3xl bg-slate-50 px-4 py-3 shadow-sm">
                                            <span className="truncate font-medium">{player}</span>
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

            <button onClick={copyResult} type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                <ClipboardCopy className="h-5 w-5" /> Copiar Resultado
            </button>
            <button onClick={shareWhatsApp} type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-500">
                <Share2 className="h-5 w-5" /> Compartilhar no WhatsApp
            </button>
        </div>
    );
}
