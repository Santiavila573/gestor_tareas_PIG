import React, { useState, useEffect } from 'react';
import { Car, Bike, Plane, Camera, Gamepad2, Coffee, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface SecurityCaptchaProps {
    onVerify: (isValid: boolean) => void;
}

type ItemType = 'coche' | 'bicicleta' | 'avión' | 'cámara' | 'control' | 'café';

interface CaptchaItem {
    id: string;
    type: ItemType;
    icon: React.ElementType;
}

const ITEMS_CONFIG: { type: ItemType; icon: React.ElementType }[] = [
    { type: 'coche', icon: Car },
    { type: 'bicicleta', icon: Bike },
    { type: 'avión', icon: Plane },
    { type: 'cámara', icon: Camera },
    { type: 'control', icon: Gamepad2 },
    { type: 'café', icon: Coffee },
];

const SecurityCaptcha: React.FC<SecurityCaptchaProps> = ({ onVerify }) => {
    const [items, setItems] = useState<CaptchaItem[]>([]);
    const [targetType, setTargetType] = useState<ItemType>('coche');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isRotating, setIsRotating] = useState(false);

    const generateCaptcha = () => {
        setIsRotating(true);
        // 1. Select a random target type
        const target = ITEMS_CONFIG[Math.floor(Math.random() * ITEMS_CONFIG.length)];
        setTargetType(target.type);

        // 2. Create 3 correct items
        const correctItems: CaptchaItem[] = Array.from({ length: 3 }).map((_, i) => ({
            id: `correct-${i}-${Date.now()}`,
            type: target.type,
            icon: target.icon
        }));

        // 3. Create 6 distractor items
        const otherTypes = ITEMS_CONFIG.filter(t => t.type !== target.type);
        const distractorItems: CaptchaItem[] = Array.from({ length: 6 }).map((_, i) => {
            const randomType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
            return {
                id: `distractor-${i}-${Date.now()}`,
                type: randomType.type,
                icon: randomType.icon
            };
        });

        // 4. Combine and shuffle
        const allItems = [...correctItems, ...distractorItems]
            .sort(() => Math.random() - 0.5);

        setItems(allItems);
        setSelectedIds([]);
        setStatus('idle');
        onVerify(false);

        setTimeout(() => setIsRotating(false), 500);
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    const handleItemClick = (id: string) => {
        if (status === 'success') return;

        const newSelected = selectedIds.includes(id)
            ? selectedIds.filter(sid => sid !== id)
            : [...selectedIds, id];

        if (newSelected.length > 3) return;

        setSelectedIds(newSelected);

        if (newSelected.length === 3) {
            validateSelection(newSelected);
        } else {
            setStatus('idle');
            onVerify(false);
        }
    };

    const validateSelection = (selected: string[]) => {
        const selectedItems = items.filter(item => selected.includes(item.id));
        const allCorrect = selectedItems.every(item => item.type === targetType);

        if (allCorrect && selectedItems.length === 3) {
            setStatus('success');
            onVerify(true);
        } else {
            setStatus('error');
            onVerify(false);
            setTimeout(() => {
                if (allCorrect) return;
                setSelectedIds([]);
                setStatus('idle');
            }, 1000);
        }
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Ultra Compact Header */}
            <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-1">
                    <div className={`p-0.5 rounded-md transition-all duration-300 ${status === 'success' ? 'bg-green-500/20 text-green-400' :
                        status === 'error' ? 'bg-red-500/20 text-red-400' :
                            'bg-[#7b68ee]/10 text-[#7b68ee]'
                        }`}>
                        <ShieldCheck className="w-2.5 h-2.5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter leading-none">Verificación:</span>
                        <span className="text-[9px] font-bold text-white leading-none">
                            Selecciona 3 <span className="text-[#a89aff]">{targetType}</span>
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={generateCaptcha}
                    disabled={status === 'success'}
                    className={`p-0.5 hover:bg-white/5 rounded text-slate-400 hover:text-[#7b68ee] transition-all disabled:opacity-0 disabled:cursor-default ${isRotating ? 'animate-spin' : ''}`}
                    title="Generar nuevo captcha"
                >
                    <RefreshCw className="w-2.5 h-2.5" />
                </button>
            </div>

            {/* Ultra Compact Grid */}
            <div className={`
                p-1 rounded-lg border transition-all duration-300 backdrop-blur-sm
                ${status === 'success' ? 'bg-green-500/5 border-green-500/30 shadow-lg shadow-green-500/10' :
                    status === 'error' ? 'bg-red-500/5 border-red-500/30 shadow-lg shadow-red-500/10' :
                        'bg-black/20 border-white/10 hover:border-white/20'
                }
            `}>
                <div className="grid grid-cols-3 gap-0.5">
                    {items.map((item) => {
                        const isSelected = selectedIds.includes(item.id);
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item.id)}
                                disabled={status === 'success'}
                                className={`
                                    relative aspect-[1.8/1] rounded flex items-center justify-center transition-all duration-300 group disabled:cursor-default
                                    ${isSelected
                                        ? 'bg-[#7b68ee]/20 border border-[#7b68ee] shadow-sm shadow-[#7b68ee]/20 scale-[0.98]'
                                        : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#7b68ee]/30 hover:scale-[1.02] active:scale-95'
                                    }
                                    ${status === 'success' && isSelected ? '!bg-green-500/20 !border-green-500 !shadow-green-500/30' : ''}
                                    ${status === 'error' && isSelected ? '!bg-red-500/20 !border-red-500 !shadow-red-500/30 animate-shake' : ''}
                                `}
                            >
                                <Icon className={`
                                    w-5 h-5 transition-all duration-300
                                    ${isSelected
                                        ? (status === 'success' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-[#7b68ee]')
                                        : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'
                                    }
                                `} />

                                {isSelected && (
                                    <div className="absolute top-0.5 right-0.5 animate-in zoom-in duration-200">
                                        <div className={`
                                            w-2.5 h-2.5 rounded-full flex items-center justify-center text-[5px] font-black shadow-lg border border-black/20
                                            ${status === 'success' ? 'bg-green-500 text-white' :
                                                status === 'error' ? 'bg-red-500 text-white' :
                                                    'bg-[#7b68ee] text-white'}
                                        `}>
                                            {status === 'success' ? <CheckCircle2 className="w-1.5 h-1.5" /> : (selectedIds.indexOf(item.id) + 1)}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Inline Status - Compact */}
                {(status === 'error' || status === 'success') && (
                    <div className="mt-0.5 pt-0.5 border-t border-white/5">
                        <div className={`flex items-center justify-center gap-1 text-[7px] font-bold animate-in fade-in slide-in-from-top-1 ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                            {status === 'error' ? <AlertCircle className="w-2 h-2" /> : <CheckCircle2 className="w-2 h-2" />}
                            <span className="uppercase tracking-tighter">{status === 'error' ? 'Error' : 'Verificado'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityCaptcha;
