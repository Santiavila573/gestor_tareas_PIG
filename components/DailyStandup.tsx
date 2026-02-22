import React, { useState, useEffect } from 'react';
import { User, Task, TaskStatus } from '../types';
import {
    Video,
    Clock,
    CheckCircle2,
    AlertCircle,
    Play,
    RotateCcw,
    X,
    ChevronRight,
    Globe,
    ExternalLink,
    MessageSquare,
    Sparkles
} from 'lucide-react';
import DailyIAUpdatePrepper from './DailyIAUpdatePrepper';

interface DailyUpdate {
    userId: string;
    yesterday: string;
    today: string;
    blockers: string;
    timestamp: number;
}

interface Props {
    users: User[];
    tasks: Task[];
    currentUser: User;
    onClose: () => void;
}

const DailyStandup: React.FC<Props> = ({ users, tasks, currentUser, onClose }) => {
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
    const [isActive, setIsActive] = useState(false);
    const [activeTab, setActiveTab] = useState<'board' | 'form'>('board');
    const [updates, setUpdates] = useState<DailyUpdate[]>([]);
    const [form, setForm] = useState({ yesterday: '', today: '', blockers: '' });

    // Timer logic
    useEffect(() => {
        let interval: any = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newUpdate: DailyUpdate = {
            userId: currentUser.id,
            ...form,
            timestamp: Date.now()
        };
        setUpdates([newUpdate, ...updates.filter(u => u.userId !== currentUser.id)]);
        setActiveTab('board');
    };

    const getSuggestedTasks = (type: 'yesterday' | 'today') => {
        const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);
        if (type === 'yesterday') {
            return myTasks.filter(t => t.status === TaskStatus.DONE || t.status === TaskStatus.REVIEW);
        } else {
            return myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.TODO);
        }
    };

    const addTaskToField = (field: 'yesterday' | 'today', taskTitle: string) => {
        const currentText = form[field];
        const newText = currentText ? `${currentText}\n- ${taskTitle}` : `- ${taskTitle}`;
        setForm({ ...form, [field]: newText });
    };

    const getMemberTasks = (userId: string) => {
        return tasks.filter(t => t.assigneeId === userId && t.status !== TaskStatus.DONE);
    };

    const renderContent = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => (
            <span key={i} className="block">
                {line.trim().startsWith('-') ? (
                    <span className="flex gap-2">
                        <span className="text-[#7b68ee]">•</span>
                        <span>{line.trim().substring(1).trim()}</span>
                    </span>
                ) : line}
            </span>
        ));
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-full max-h-[90vh] rounded-[48px] shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7b68ee]/5 rounded-bl-[300px] -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-tr-[250px] -ml-40 -mb-40 pointer-events-none" />

                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-[#7b68ee] rounded-3xl text-white shadow-xl shadow-[#7b68ee]/30">
                            <Video className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Daily Standup Hub</h2>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Sincronización de Equipo • Sprint 11</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Standup Timer */}
                        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all duration-500 ${isActive ? 'bg-[#7b68ee]/5 dark:bg-[#7b68ee]/20 border-[#7b68ee]/20 shadow-lg' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 opacity-80'}`}>
                            <Clock className={`w-5 h-5 ${isActive ? 'text-[#7b68ee] animate-pulse' : 'text-slate-400'}`} />
                            <span className={`text-2xl font-black font-mono tracking-tighter ${isActive ? 'text-[#7b68ee]' : 'text-slate-600 dark:text-slate-300'}`}>
                                {formatTime(timeLeft)}
                            </span>
                            <div className="flex gap-2 ml-2">
                                <button
                                    onClick={() => setIsActive(!isActive)}
                                    className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all"
                                >
                                    {isActive ? <X className="w-4 h-4 text-rose-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                                </button>
                                <button
                                    onClick={() => { setTimeLeft(15 * 60); setIsActive(false); }}
                                    className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:scale-110 active:scale-95 transition-all"
                                >
                                    <RotateCcw className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Action Bar */}
                <div className="px-8 py-4 bg-slate-50/50 dark:bg-slate-950/30 border-b border-slate-100 dark:border-white/5 flex justify-between items-center relative z-10">
                    <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm">
                        <button
                            onClick={() => setActiveTab('board')}
                            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'board' ? 'bg-[#7b68ee] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        >
                            TABLERO GRUPAL
                        </button>
                        <button
                            onClick={() => setActiveTab('form')}
                            className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'form' ? 'bg-[#7b68ee] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        >
                            MI UPDATE
                        </button>
                    </div>

                    <a
                        href="https://meet.google.com/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black transition-all shadow-xl shadow-emerald-600/20 active:scale-95 group"
                    >
                        <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Unirse a Videollamada
                        <ExternalLink className="w-4 h-4 opacity-50" />
                    </a>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
                    {activeTab === 'board' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {users.map((user) => {
                                const userUpdate = updates.find(u => u.userId === user.id);
                                const memberTasks = getMemberTasks(user.id);

                                return (
                                    <div key={user.id} className="group bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="relative">
                                                <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 dark:border-white/10 shadow-md" />
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${userUpdate ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 dark:text-white leading-tight">{user.name}</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.role}</p>
                                            </div>
                                        </div>

                                        {userUpdate ? (
                                            <div className="space-y-4">
                                                {userUpdate.yesterday && (
                                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Logros Ayer</p>
                                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                            {renderContent(userUpdate.yesterday)}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
                                                    <p className="text-[9px] font-black text-[#7b68ee] uppercase tracking-widest mb-2">Objetivo Hoy</p>
                                                    <div className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        {renderContent(userUpdate.today)}
                                                    </div>
                                                </div>
                                                {userUpdate.blockers && userUpdate.blockers !== 'Ninguno' && (
                                                    <div className="bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl p-4 border border-rose-100 dark:border-rose-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Bloqueos</p>
                                                        </div>
                                                        <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                                            {renderContent(userUpdate.blockers)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center opacity-40">
                                                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Esperando update...</p>
                                            </div>
                                        )}

                                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Tareas en curso ({memberTasks.length})</p>
                                            <div className="space-y-2">
                                                {memberTasks.slice(0, 2).map(task => (
                                                    <div key={task.id} className="flex items-center gap-3 py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#7b68ee] shadow-[0_0_8px_#7b68ee]" />
                                                        <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">{task.title}</p>
                                                    </div>
                                                ))}
                                                {memberTasks.length > 2 && <p className="text-[9px] font-bold text-[#7b68ee] pl-1">+{memberTasks.length - 2} más...</p>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto py-10 space-y-10">
                            {/* IA Prepper Integration */}
                            <DailyIAUpdatePrepper
                                user={currentUser}
                                tasks={tasks}
                                activities={[]} // To be implemented with real activity logs
                                messages={[]}   // To be implemented with real chat messages
                                onApplyUpdate={(summary) => {
                                    setForm(summary);
                                    // Visual feedback
                                    const notify = document.createElement('div');
                                    notify.className = "fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-3xl font-black text-sm shadow-2xl z-[200] animate-in slide-in-from-bottom-5";
                                    notify.innerText = "¡RESUMEN IA APLICADO CON ÉXITO!";
                                    document.body.appendChild(notify);
                                    setTimeout(() => notify.remove(), 3000);
                                }}
                            />

                            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-2xl border border-[#7b68ee]/20 dark:border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7b68ee]/5 rounded-bl-[100px] -mr-10 -mt-10" />

                                <div className="space-y-8 relative z-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="p-4 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 rounded-2xl text-[#7b68ee] dark:text-[#7b68ee]">
                                            <Play className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Tu Sincronización</h3>
                                            <p className="text-xs font-semibold text-slate-400">Cuéntale al equipo en qué estás trabajando.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">¿Qué lograste ayer?</label>
                                                <span className="text-[10px] text-[#7b68ee] font-bold">Sugerencias rápidas:</span>
                                            </div>

                                            {/* Suggestions for Yesterday */}
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {getSuggestedTasks('yesterday').slice(0, 3).map(task => (
                                                    <button
                                                        key={task.id}
                                                        type="button"
                                                        onClick={() => addTaskToField('yesterday', `Completé: ${task.title}`)}
                                                        className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 transition-colors truncate max-w-[200px]"
                                                    >
                                                        + {task.title}
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea
                                                value={form.yesterday}
                                                onChange={e => setForm({ ...form, yesterday: e.target.value })}
                                                className="w-full h-32 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-[#7b68ee]/10 focus:outline-none transition-all placeholder:text-slate-200"
                                                placeholder="- Completé la refactorización de..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-[#7b68ee] uppercase tracking-widest ml-1">¿Cuál es tu meta hoy?</label>
                                                <span className="text-[10px] text-[#7b68ee] font-bold">En curso / Por hacer:</span>
                                            </div>

                                            {/* Suggestions for Today */}
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {getSuggestedTasks('today').slice(0, 3).map(task => (
                                                    <button
                                                        key={task.id}
                                                        type="button"
                                                        onClick={() => addTaskToField('today', `Trabajaré en: ${task.title}`)}
                                                        className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 transition-colors truncate max-w-[200px]"
                                                    >
                                                        + {task.title}
                                                    </button>
                                                ))}
                                            </div>

                                            <textarea
                                                value={form.today}
                                                onChange={e => setForm({ ...form, today: e.target.value })}
                                                className="w-full h-32 p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-3xl text-sm font-medium focus:ring-4 focus:ring-[#7b68ee]/10 focus:outline-none transition-all placeholder:text-slate-200"
                                                placeholder="- Implementaré la interfaz de..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">¿Tienes algún bloqueo?</label>
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, blockers: 'Ninguno' })}
                                                className="text-[10px] font-bold text-slate-400 hover:text-emerald-500 transition-colors"
                                            >
                                                Marcar "Ninguno"
                                            </button>
                                        </div>
                                        <input
                                            value={form.blockers}
                                            onChange={e => setForm({ ...form, blockers: e.target.value })}
                                            className="w-full p-5 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl text-sm font-bold text-rose-600 focus:ring-4 focus:ring-rose-500/10 focus:outline-none transition-all placeholder:text-rose-200"
                                            placeholder="Esperando respuesta de API..."
                                        />
                                        {/* Blocked Task Suggestions */}
                                        <div className="flex flex-wrap gap-2">
                                            <span className="text-[10px] font-bold text-rose-400 self-center">Bloqueado en:</span>
                                            {getSuggestedTasks('today').slice(0, 3).map(task => (
                                                <button
                                                    key={task.id}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, blockers: `Bloqueado en: ${task.title}` })}
                                                    className="text-[10px] bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 transition-colors truncate max-w-[200px]"
                                                >
                                                    ! {task.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('board')}
                                            className="px-8 py-4 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-10 py-4 bg-[#7b68ee] text-white rounded-2xl text-sm font-black shadow-2xl shadow-[#7b68ee]/30 hover:bg-[#6b58de] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Publicar Update
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer Insight */}
                <div className="px-8 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/5 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronización en vivo activada</p>
                    </div>
                    <div className="flex items-center gap-2 text-[#7b68ee] dark:text-[#7b68ee]">
                        <span className="text-[10px] font-black uppercase tracking-widest">Sprint {updates.length}/{users.length} Miembros Listos</span>
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyStandup;
