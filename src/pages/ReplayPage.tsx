import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CircleSlash, Download, Film, Save, Sparkles, TimerReset } from 'lucide-react';

type StoredVideo = {
    id: string;
    createdAt: string;
    blob: Blob;
    mimeType: string;
    url: string;
};

type SavedVideoEntry = {
    id: string;
    createdAt: string;
    blob: Blob;
    mimeType: string;
};

const DB_NAME = 'baba-dos-aposentados-replay';
const DB_VERSION = 1;
const PENDING_STORE = 'pending-videos';
const SAVED_STORE = 'saved-videos';
const SEGMENT_DURATION_SECONDS = 15;
const AUTO_DISCARD_DELAY_MS = 10000;

function getSupportedMimeType(): string | undefined {
    const candidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
    ];

    return candidates.find((candidate) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate));
}

function openReplayDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(PENDING_STORE)) {
                database.createObjectStore(PENDING_STORE, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(SAVED_STORE)) {
                database.createObjectStore(SAVED_STORE, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function readAllFromStore<T>(database: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
    });
}

function writeToStore(database: IDBDatabase, storeName: string, value: Record<string, unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const transaction = database.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value);

            request.onsuccess = () => {
                transaction.oncomplete = () => resolve();
            };
            request.onerror = () => reject(request.error ?? new Error('Falha ao gravar no IndexedDB'));
            transaction.onerror = () => reject(transaction.error ?? new Error('Falha na transação do IndexedDB'));
        } catch (error) {
            reject(error instanceof Error ? error : new Error('Falha inesperada ao gravar no IndexedDB'));
        }
    });
}

function deleteFromStore(database: IDBDatabase, storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export function ReplayPage() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const autoDiscardRef = useRef<number | null>(null);
    const databaseRef = useRef<IDBDatabase | null>(null);
    const pendingVideoRef = useRef<StoredVideo | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [pendingVideo, setPendingVideo] = useState<StoredVideo | null>(null);
    const [savedVideos, setSavedVideos] = useState<StoredVideo[]>([]);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const clearAutoDiscardTimer = useCallback(() => {
        if (autoDiscardRef.current) {
            window.clearTimeout(autoDiscardRef.current);
            autoDiscardRef.current = null;
        }
    }, []);

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }, []);

    const attachStreamToPreview = useCallback(() => {
        if (!streamRef.current || !videoRef.current) {
            return;
        }

        const previewVideo = videoRef.current;
        previewVideo.srcObject = streamRef.current;
        previewVideo.muted = true;
        previewVideo.playsInline = true;
        previewVideo.autoplay = true;

        void previewVideo.play().catch((playError) => {
            console.error('Não foi possível iniciar a reprodução da câmera.', playError);
            setError('A câmera foi liberada, mas a imagem ainda não iniciou. Tente atualizar a página.');
        });
    }, []);

    const refreshSavedVideos = useCallback(async () => {
        if (!databaseRef.current) {
            return;
        }

        const entries = await readAllFromStore<SavedVideoEntry>(databaseRef.current, SAVED_STORE);

        const videosWithUrls = entries.map((entry) => ({
            ...entry,
            url: URL.createObjectURL(entry.blob),
        }));

        setSavedVideos(videosWithUrls);
    }, []);

    const startRecordingSegment = useCallback(async (options?: { clearPendingVideo?: boolean }) => {
        if (!streamRef.current) {
            return;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            return;
        }

        clearTimer();
        clearAutoDiscardTimer();
        setIsProcessing(false);
        setError(null);
        setElapsedSeconds(0);
        if (options?.clearPendingVideo !== false) {
            setPendingVideo(null);
        }
        setIsRecording(true);

        const mimeType = getSupportedMimeType();
        const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
        chunksRef.current = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: mimeType ?? 'video/webm' });
            const pendingId = `pending-${Date.now()}`;
            const createdAt = new Date().toISOString();

            if (!databaseRef.current) {
                setError('Banco local não ficou disponível.');
                setIsProcessing(false);
                setIsRecording(false);
                return;
            }

            setIsRecording(false);
            setIsProcessing(true);

            try {
                await writeToStore(databaseRef.current, PENDING_STORE, {
                    id: pendingId,
                    createdAt,
                    blob,
                    mimeType: mimeType ?? 'video/webm',
                });

                const pendingUrl = URL.createObjectURL(blob);
                const nextPendingVideo: StoredVideo = {
                    id: pendingId,
                    createdAt,
                    blob,
                    mimeType: mimeType ?? 'video/webm',
                    url: pendingUrl,
                };

                pendingVideoRef.current = nextPendingVideo;
                setPendingVideo(nextPendingVideo);
                await refreshSavedVideos();

                void startRecordingSegment({ clearPendingVideo: false });
            } catch (databaseError) {
                console.error(databaseError);
                setError('Não foi possível salvar o vídeo temporário.');
            } finally {
                setIsProcessing(false);
            }
        };

        mediaRecorderRef.current = recorder;
        recorder.start();

        timerRef.current = window.setInterval(() => {
            setElapsedSeconds((current) => {
                const nextValue = current + 1;
                if (nextValue >= SEGMENT_DURATION_SECONDS) {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop();
                    }
                    clearTimer();
                    return SEGMENT_DURATION_SECONDS;
                }
                return nextValue;
            });
        }, 1000);
    }, [clearAutoDiscardTimer, clearTimer, refreshSavedVideos]);

    const handleSaveLance = useCallback(async () => {
        const currentPending = pendingVideoRef.current;
        if (!currentPending || !databaseRef.current) {
            return;
        }

        clearAutoDiscardTimer();
        setIsProcessing(true);

        try {
            const savedEntry = {
                id: currentPending.id,
                createdAt: currentPending.createdAt,
                blob: currentPending.blob,
                mimeType: currentPending.mimeType,
            };

            await deleteFromStore(databaseRef.current, PENDING_STORE, currentPending.id);
            await writeToStore(databaseRef.current, SAVED_STORE, savedEntry);

            const savedVideoUrl = URL.createObjectURL(currentPending.blob);
            const savedVideo: StoredVideo = {
                ...savedEntry,
                url: savedVideoUrl,
            };

            const persistedEntries = await readAllFromStore<SavedVideoEntry>(databaseRef.current, SAVED_STORE);
            const persistedSavedVideo = persistedEntries.find((entry) => entry.id === savedEntry.id);

            if (!persistedSavedVideo) {
                throw new Error('O vídeo não ficou persistido no armazenamento local.');
            }

            setSavedVideos((currentSavedVideos) => {
                const withoutDuplicate = currentSavedVideos.filter((video) => video.id !== savedVideo.id);
                return [savedVideo, ...withoutDuplicate];
            });
            await refreshSavedVideos();

            if (currentPending.url) {
                URL.revokeObjectURL(currentPending.url);
            }
            pendingVideoRef.current = null;
            setPendingVideo(null);
            setError(null);
            setIsRecording(false);
            setIsProcessing(false);
            clearAutoDiscardTimer();
            setError('Lance salvo com sucesso no dispositivo.');
            void startRecordingSegment({ clearPendingVideo: false });
        } catch (databaseError) {
            console.error(databaseError);
            setError('Não foi possível salvar o lance no dispositivo. Tente novamente em um momento sem interrupções.');
        } finally {
            setIsProcessing(false);
        }
    }, [clearAutoDiscardTimer, refreshSavedVideos, startRecordingSegment]);

    const handleExportToGallery = useCallback((video: StoredVideo) => {
        try {
            const link = document.createElement('a');
            link.href = video.url;
            link.download = `lance-${video.id}.webm`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setError('Vídeo preparado para download na galeria do dispositivo.');
        } catch (exportError) {
            console.error(exportError);
            setError('Não foi possível abrir o download do vídeo.');
        }
    }, []);

    const handleDiscardPending = useCallback(async () => {
        const currentPending = pendingVideoRef.current;
        if (!currentPending || !databaseRef.current) {
            return;
        }

        clearAutoDiscardTimer();
        setIsProcessing(true);

        try {
            await deleteFromStore(databaseRef.current, PENDING_STORE, currentPending.id);
            if (currentPending.url) {
                URL.revokeObjectURL(currentPending.url);
            }
            pendingVideoRef.current = null;
            setPendingVideo(null);
            setError(null);
            await startRecordingSegment();
        } catch (databaseError) {
            console.error(databaseError);
            setError('Não foi possível remover o vídeo temporário.');
        } finally {
            setIsProcessing(false);
        }
    }, [clearAutoDiscardTimer, startRecordingSegment]);

    useEffect(() => {
        if (!pendingVideo?.id) {
            return;
        }

        clearAutoDiscardTimer();
        autoDiscardRef.current = window.setTimeout(() => {
            void handleDiscardPending();
        }, AUTO_DISCARD_DELAY_MS);

        return () => clearAutoDiscardTimer();
    }, [clearAutoDiscardTimer, handleDiscardPending, pendingVideo?.id]);

    useEffect(() => {
        if (!isReady) {
            return;
        }

        attachStreamToPreview();
    }, [attachStreamToPreview, isReady]);

    useEffect(() => {
        let isMounted = true;

        async function initializeReplay() {
            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error('A câmera não está disponível neste navegador.');
                }

                const database = await openReplayDatabase();
                if (!isMounted) {
                    return;
                }

                databaseRef.current = database;
                await refreshSavedVideos();

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter((device) => device.kind === 'videoinput');
                const rearCamera = videoInputs.find((device) => /back|rear|environment|traseira/i.test(device.label));
                const preferredDeviceId = rearCamera?.deviceId;

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: preferredDeviceId
                        ? { deviceId: { exact: preferredDeviceId } }
                        : { facingMode: { ideal: 'environment' } },
                    audio: true,
                });

                if (!isMounted) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                setIsReady(true);
                await startRecordingSegment();
            } catch (cameraError) {
                console.error(cameraError);
                setError('Não foi possível acessar a câmera. Conceda permissão e tente novamente.');
            }
        }

        void initializeReplay();

        return () => {
            isMounted = false;
            clearTimer();
            clearAutoDiscardTimer();
            stopStream();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (databaseRef.current) {
                databaseRef.current.close();
            }
            pendingVideoRef.current?.url && URL.revokeObjectURL(pendingVideoRef.current.url);
            savedVideos.forEach((video) => URL.revokeObjectURL(video.url));
        };
    }, []);

    return (
        <div className="space-y-4">
            <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Replay local</p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900">Gravação contínua de lances</h2>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                        <Film className="h-5 w-5" />
                    </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                    O app grava em loop contínuo em blocos de 3 minutos, salva temporariamente no seu celular com IndexedDB e pede para você guardar o lance desejado.
                </p>
            </section>

            <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-slate-950 shadow-[0_20px_80px_rgba(15,23,42,0.20)]">
                <div className="relative aspect-[9/16] w-full bg-slate-900">
                    {isReady ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-slate-900 p-6 text-center text-sm text-slate-300">
                            <div className="space-y-3">
                                <Camera className="mx-auto h-10 w-10 text-sky-400" />
                                <p>Solicitando acesso à câmera do dispositivo…</p>
                            </div>
                        </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-2 text-sm font-semibold text-white">
                        {isRecording ? `Gravando ${elapsedSeconds}s` : 'Aguardando'}
                    </div>

                    {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/65">
                            <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 text-center text-sm text-white backdrop-blur">
                                <Sparkles className="mx-auto mb-2 h-6 w-6" />
                                <p>Preparando o próximo lance…</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3 bg-white/95 p-4">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                            <TimerReset className="h-4 w-4 text-sky-600" />
                            Bloco de gravação: 3 minutos
                        </span>
                        <span className="font-semibold text-slate-900">{elapsedSeconds}/{SEGMENT_DURATION_SECONDS}s</span>
                    </div>

                    {pendingVideo ? (
                        <div className="space-y-3 rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                                <Save className="h-4 w-4" />
                                Vídeo pronto para salvar
                            </div>
                            <video
                                key={pendingVideo.id}
                                src={pendingVideo.url}
                                controls
                                className="h-44 w-full rounded-2xl bg-slate-950 object-cover"
                            />
                            <button
                                onClick={handleSaveLance}
                                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                                Salvar Lance
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            <div className="flex items-center gap-2 font-semibold text-slate-800">
                                <CircleSlash className="h-4 w-4 text-slate-500" />
                                Nenhum vídeo pendente agora
                            </div>
                            <p className="mt-2">A gravação segue em loop contínuo. Se você não salvar, o vídeo temporário é removido e a próxima gravação começa automaticamente.</p>
                        </div>
                    )}
                </div>
            </section>

            {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Vídeos salvos</h3>
                        <p className="text-sm text-slate-600">Mantidos localmente no seu dispositivo.</p>
                    </div>
                    <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                        {savedVideos.length}
                    </div>
                </div>

                {savedVideos.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                        Nenhum lance salvo ainda. Clique em “Salvar Lance” para guardar um vídeo no armazenamento local.
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {savedVideos.map((video) => (
                            <div key={video.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                                <video src={video.url} controls className="h-40 w-full bg-slate-950 object-cover" />
                                <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-slate-600">
                                    <span>{new Date(video.createdAt).toLocaleString('pt-BR')}</span>
                                    <button
                                        onClick={() => handleExportToGallery(video)}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Salvar na galeria
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
