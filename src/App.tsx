import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { ReplayPage } from './pages/ReplayPage';

type RouteId = 'sorteio' | 'resultado' | 'replay';

export default function App() {
    const [activeRoute, setActiveRoute] = useState<RouteId>('sorteio');
    const [teams, setTeams] = useState<string[][]>([]);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, [activeRoute]);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_30%,#f8fafc_100%)] text-slate-100">
            <Layout activeRoute={activeRoute} onNavigate={setActiveRoute}>
                {activeRoute === 'resultado' ? (
                    <ResultPage teams={teams} onBack={() => setActiveRoute('sorteio')} />
                ) : activeRoute === 'replay' ? (
                    <ReplayPage />
                ) : (
                    <HomePage
                        onSortComplete={(newTeams: string[][]) => {
                            setTeams(newTeams);
                            setActiveRoute('resultado');
                        }}
                    />
                )}
            </Layout>
        </div>
    );
}
