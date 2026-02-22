import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, Grid2X2, Check, AlertTriangle, Lock, Cpu, ScanLine, Activity, Loader2 } from 'lucide-react';

interface CaptchaProps {
    onVerify: (isValid: boolean) => void;
    className?: string;
    requiredClicks?: number;
}

// Enhanced Categories with high-quality search queries
const CATEGORIES = [
    {
        id: 'bridge',
        label: 'PUENTES',
        queries: [
            'suspension bridge structure', 'golden gate bridge view', 'stone arch bridge',
            'large viaduct bridge', 'modern steel bridge', 'famous tower bridge',
            'highway overpass bridge', 'pedestrian footbridge'
        ]
    },
    {
        id: 'bus',
        label: 'AUTOBUSES',
        queries: [
            'city transit bus', 'red london bus', 'yellow school bus', 'modern electric bus',
            'white tour bus', 'blue public bus', 'double decker bus street', 'metro bus station'
        ]
    },
    {
        id: 'traffic_light',
        label: 'SEMÁFOROS',
        queries: [
            'red traffic light close up', 'green traffic signal street', 'yellow traffic light',
            'hanging traffic lights intersection', 'pedestrian crossing signal', 'led traffic light'
        ]
    },
    {
        id: 'crosswalk',
        label: 'PASOS DE PEATONES',
        queries: [
            'zebra crossing street', 'pedestrian crosswalk lines', 'city crosswalk top view',
            'urban street crossing', 'white crosswalk stripes road'
        ]
    },
    {
        id: 'bicycle',
        label: 'BICICLETAS',
        queries: [
            'mountain bike', 'road bicycle', 'city bike', 'parked bicycle',
            'vintage bicycle basket', 'bike leaning on wall', 'modern e-bike'
        ]
    }
];

interface CaptchaImage {
    id: number;
    url: string;
    isTarget: boolean;
}

const Captcha: React.FC<CaptchaProps> = ({ onVerify, className = "" }) => {
    // State
    const [targetCategory, setTargetCategory] = useState(CATEGORIES[0]);
    const [images, setImages] = useState<CaptchaImage[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // Status Logic
    const [isVerified, setIsVerified] = useState(false);
    const [successPhase, setSuccessPhase] = useState<'idle' | 'loading' | 'success'>('idle');
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // New: Analysis state
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Security Logic
    const [attempts, setAttempts] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockTimer, setLockTimer] = useState(0);
    const startTimeRef = useRef<number>(0);

    // Haptic Feedback Helper
    const vibrate = (pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    // Audio Synthesis Helper (Web Audio API)
    const playSystemSound = (type: 'CLICK' | 'SUCCESS' | 'ERROR') => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'CLICK') {
                // Short high-pitch blip
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                oscillator.start(now);
                oscillator.stop(now + 0.05);
            }
            else if (type === 'SUCCESS') {
                // Futuristic Arpeggio (C Major Triad: C5, E5, G5)
                const playNote = (freq: number, startTime: number) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = 'sine';
                    osc.frequency.value = freq;

                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

                    osc.start(startTime);
                    osc.stop(startTime + 0.5);
                };

                playNote(523.25, now);       // C5
                playNote(659.25, now + 0.1); // E5
                playNote(783.99, now + 0.2); // G5
            }
            else if (type === 'ERROR') {
                // "Access Denied" Double Tone (Low Dissonance)
                const playTone = (freq: number, start: number, duration: number) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = 'triangle'; // Softer than sawtooth but distinct
                    osc.frequency.setValueAtTime(freq, start);

                    gain.gain.setValueAtTime(0.2, start);
                    gain.gain.exponentialRampToValueAtTime(0.01, start + duration);

                    osc.start(start);
                    osc.stop(start + duration);
                };

                // Play "Dun-dun"
                playTone(180, now, 0.1);
                playTone(140, now + 0.15, 0.2);
            }

        } catch (e) {
            console.error("Audio Click Error", e);
        }
    };

    const generateChallenge = useCallback(() => {
        if (isLocked) return;

        setIsLoading(true);
        setSelectedIndices([]);
        setErrorMsg(null);
        setIsVerified(false);
        setSuccessPhase('idle');
        onVerify(false);
        setIsAnalyzing(false);
        startTimeRef.current = Date.now();

        // 1. Pick Category
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        setTargetCategory(category);

        // 2. Generate Logic
        const newImages: CaptchaImage[] = [];
        const quantityOfTargets = Math.floor(Math.random() * 3) + 3; // 3 to 5 targets
        const targetIndices = new Set<number>();

        while (targetIndices.size < quantityOfTargets) {
            targetIndices.add(Math.floor(Math.random() * 9));
        }

        const getRandomQuery = (cat: typeof CATEGORIES[0]) =>
            cat.queries[Math.floor(Math.random() * cat.queries.length)];

        for (let i = 0; i < 9; i++) {
            const isTarget = targetIndices.has(i);
            let query = isTarget ? getRandomQuery(category) : getRandomQuery(CATEGORIES.filter(c => c.id !== category.id)[Math.floor(Math.random() * (CATEGORIES.length - 1))]);

            // Query params for Bing: c=7 (Smart Crop), w/h=300 (Higher res for retina), rs=1 (Resize)
            const displayQuery = encodeURIComponent(query);
            const randomSeed = Math.floor(Math.random() * 1000);

            newImages.push({
                id: i,
                url: `https://th.bing.com/th?q=${displayQuery}&w=300&h=300&c=7&rs=1&p=0&pid=1.7&r=${randomSeed}`,
                isTarget
            });
        }

        setTimeout(() => {
            setImages(newImages);
            setIsLoading(false);
        }, 800);
    }, [isLocked, onVerify]);

    // Initial Load
    useEffect(() => {
        generateChallenge();
    }, [generateChallenge]);

    // Countdown for Lockout
    useEffect(() => {
        if (lockTimer > 0) {
            const timer = setInterval(() => setLockTimer(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (lockTimer === 0 && isLocked) {
            setIsLocked(false);
            setAttempts(0);
            generateChallenge();
        }
    }, [lockTimer, isLocked, generateChallenge]);

    // Multi-stage Success Transition
    useEffect(() => {
        if (successPhase === 'loading') {
            const timer = setTimeout(() => {
                setSuccessPhase('success');
                vibrate([10, 50, 20]); // Success vibration when checkmark appears
                playSystemSound('SUCCESS');
            }, 2000); // 2 seconds loading
            return () => clearTimeout(timer);
        }
    }, [successPhase]);

    const toggleSelection = (index: number) => {
        if (isVerified || isLocked || isAnalyzing) return;

        vibrate(10); // Subtle tick
        playSystemSound('CLICK');
        setSelectedIndices(prev => {
            if (prev.includes(index)) return prev.filter(i => i !== index);
            return [...prev, index];
        });
    };

    const handleVerify = async () => {
        if (isLocked || isAnalyzing) return;

        // 1. Bot Check: Too fast? (< 2 seconds is suspicious for 3 images)
        const timeElapsed = Date.now() - startTimeRef.current;
        if (timeElapsed < 1500 && selectedIndices.length > 0) {
            setErrorMsg('Actividad sospechosa detectada. Intente más despacio.');
            vibrate([50, 50, 50]);
            return;
        }

        setIsAnalyzing(true); // Show "Analyzing" state for realism

        // Simulate Server Latency for Analysis
        await new Promise(resolve => setTimeout(resolve, 1200));

        const targets = images.filter(img => img.isTarget).map(img => img.id);
        const selected = selectedIndices;
        const selectedCorrect = selected.filter(s => targets.includes(s));
        const falsePositives = selected.filter(s => !targets.includes(s));

        // Logic: Min 3 correct, 0 wrong
        const isValid = selectedCorrect.length >= 3 && falsePositives.length === 0;

        if (isValid) {
            setIsVerified(true);
            setSuccessPhase('loading'); // Start Loading Phase
            setErrorMsg(null);
            onVerify(true); // Triggers parent timer (4s)
        } else {
            vibrate(200); // Error vibration
            playSystemSound('ERROR');
            setIsAnalyzing(false);
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= 3) {
                setIsLocked(true);
                setLockTimer(30); // 30s Lockout
                setErrorMsg('Demasiados intentos fallidos. Sistema bloqueado temporalmente.');
            } else {
                if (falsePositives.length > 0) {
                    setErrorMsg('Has seleccionado imágenes incorrectas.');
                } else {
                    setErrorMsg('Faltan imágenes por seleccionar (mínimo 3).');
                }

                // Reset text after delay
                setTimeout(() => setErrorMsg(null), 3000);
            }
            onVerify(false);
        }
    };

    return (
        <div className={`relative w-full max-w-[420px] mx-auto font-sans ${className}`}>
            {/* Header Card with Glassmorphism */}
            <div className="bg-gradient-to-r from-[#7b68ee] to-[#c026d3] text-white p-6 rounded-t-2xl shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black opacity-70 mb-1 tracking-[0.2em] uppercase">Security Gate v2.0</p>
                            <h3 className="text-xl font-bold leading-tight">
                                Seleccione: <span className="text-2xl font-black uppercase tracking-wide text-white drop-shadow-md border-b-2 border-white/30 pb-0.5">{targetCategory.label}</span>
                            </h3>
                        </div>
                        <ShieldCheck className="text-white/20" size={48} />
                    </div>
                </div>

                {/* Background Tech Effects */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute -right-10 -bottom-20 opacity-10 animate-[spin_20s_linear_infinite]">
                    <Grid2X2 size={200} />
                </div>
            </div>

            {/* Main Interface */}
            <div className="bg-slate-50 dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 p-4 rounded-b-2xl shadow-2xl relative">

                {/* Lockout Screen */}
                {isLocked && (
                    <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 rounded-b-2xl animate-in fade-in">
                        <Lock className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                        <h3 className="text-xl font-bold text-white mb-2">Sistema Bloqueado</h3>
                        <p className="text-slate-400 text-sm mb-6">Se han detectado múltiples intentos fallidos. Por seguridad, espere.</p>
                        <div className="text-4xl font-black text-red-500 font-mono bg-red-900/20 px-6 py-3 rounded-xl border border-red-500/20">
                            00:{lockTimer < 10 ? `0${lockTimer}` : lockTimer}
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="h-[320px] flex flex-col items-center justify-center space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-200 border-t-[#7b68ee] rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="w-2 h-2 bg-[#7b68ee] rounded-full"></span>
                            </div>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Estableciendo Conexión Segura...</p>
                    </div>
                ) : (
                    <>
                        {/* Grid */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 relative">

                            {/* Success Overlay - High Fidelity Animation */}
                            {isVerified && (
                                <div className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">

                                    {/* PHASE 1: LOADING */}
                                    {successPhase === 'loading' && (
                                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                                                <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                                            </div>
                                            <h4 className="text-lg font-bold text-white tracking-tight animate-pulse">
                                                Validando credenciales...
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-2 font-mono">HASH: 0x{Math.floor(Math.random() * 10000000).toString(16)}</p>
                                        </div>
                                    )}

                                    {/* PHASE 2: SUCCESS */}
                                    {successPhase === 'success' && (
                                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                                            <style>{`
                                                @keyframes drawCheck {
                                                    0% { stroke-dashoffset: 100; opacity: 0; }
                                                    20% { opacity: 1; }
                                                    100% { stroke-dashoffset: 0; opacity: 1; }
                                                }
                                                .checkmark-path {
                                                    stroke-dasharray: 100;
                                                    stroke-dashoffset: 100;
                                                    animation: drawCheck 0.8s cubic-bezier(0.65, 0, 0.45, 1) 0.2s forwards;
                                                }
                                            `}</style>

                                            <div className="relative mb-8">
                                                {/* Pulse Rings */}
                                                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20 duration-1000"></div>
                                                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-10 duration-1000 delay-[200ms]"></div>
                                                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full"></div>

                                                {/* Animated Checkmark SVG */}
                                                <div className="relative z-10 w-24 h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)] transform animate-in zoom-in duration-500">
                                                    <svg className="w-12 h-12 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path className="checkmark-path" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            <div className="text-center space-y-2 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300 fill-mode-forwards opacity-0" style={{ animationDelay: '300ms' }}>
                                                <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200 tracking-tight">
                                                    VERIFICACIÓN EXITOSA
                                                </h4>
                                                <div className="flex items-center justify-center gap-2 text-emerald-400/80 font-mono text-xs uppercase tracking-[0.2em]">
                                                    <ScanLine className="w-3 h-3 animate-spin-slow" />
                                                    <span>Credenciales Aceptadas</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    onClick={() => toggleSelection(index)}
                                    className={`
                                        aspect-square relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300
                                        ${selectedIndices.includes(index) ? 'ring-[3px] ring-[#7b68ee] z-10 scale-[0.96] shadow-lg shadow-[#7b68ee]/20' : 'hover:scale-[1.02] hover:shadow-lg hover:z-10'}
                                    `}
                                >
                                    {/* Image with Fade In */}
                                    <img
                                        src={img.url}
                                        alt="Captcha"
                                        className={`w-full h-full object-cover animate-in fade-in duration-700 fill-mode-forwards opacity-0`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        onLoad={(e) => e.currentTarget.style.opacity = '1'}
                                    />

                                    {/* Selection State */}
                                    {selectedIndices.includes(index) && (
                                        <div className="absolute inset-0 bg-[#7b68ee]/10 flex items-center justify-center animate-in fade-in duration-200">
                                            <div className="bg-[#7b68ee] text-white rounded-full p-1.5 shadow-lg transform scale-100 animate-in zoom-in spring-duration-300">
                                                <Check className="w-6 h-6" strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Hover Scan Effect */}
                                    {!selectedIndices.includes(index) && !isVerified && (
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent translate-y-[-100%] opacity-0 hover:opacity-100 hover:translate-y-[100%] transition-all duration-1000 pointer-events-none" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Status Bar / Error Message */}
                        <div className="min-h-[40px] flex items-center justify-center mb-2">
                            {errorMsg ? (
                                <div className="flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-lg text-xs font-bold animate-pulse">
                                    <AlertTriangle size={14} />
                                    {errorMsg}
                                </div>
                            ) : (
                                <div className="flex gap-4 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><Cpu size={10} /> Secure Core</span>
                                    <span className="flex items-center gap-1"><Activity size={10} /> Latency: 12ms</span>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-stretch justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={generateChallenge}
                                disabled={isVerified || isAnalyzing}
                                className="px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-xl transition-colors flex items-center justify-center"
                                title="Nueva Imagen"
                            >
                                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                                onClick={handleVerify}
                                disabled={isVerified || isAnalyzing || selectedIndices.length === 0}
                                className={`
                                    flex-1 py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all transform active:scale-[0.98]
                                    flex items-center justify-center gap-2
                                    ${isVerified
                                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                        : isAnalyzing
                                            ? 'bg-slate-800 text-slate-300 cursor-wait'
                                            : selectedIndices.length === 0
                                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                                : 'bg-[#7b68ee] hover:bg-[#6b58de] text-white shadow-[#7b68ee]/30'
                                    }
                                `}
                            >
                                {isAnalyzing ? (
                                    <>
                                        <ScanLine className="w-4 h-4 animate-spin" />
                                        <span>Analizando...</span>
                                    </>
                                ) : isVerified ? (
                                    <span>Verificado</span>
                                ) : (
                                    <span>VERIFICAR SEGURIDAD</span>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Captcha;
