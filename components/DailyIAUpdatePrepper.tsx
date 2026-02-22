import React, { useState } from 'react';
import { Bot, Sparkles, CheckCircle2, AlertCircle, Clock, Zap, MessageSquare, Code, Layout } from 'lucide-react';
import { User, Task, TaskActivity, TeamChatMessage } from '../types';

interface DailyIAUpdatePrepperProps {
    user: User;
    tasks: Task[];
    activities: TaskActivity[];
    messages: TeamChatMessage[];
    onApplyUpdate: (summary: { yesterday: string; today: string; blockers: string }) => void;
}

const DailyIAUpdatePrepper: React.FC<DailyIAUpdatePrepperProps> = ({ user, tasks, activities, messages, onApplyUpdate }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [summary, setSummary] = useState<{ yesterday: string; today: string; blockers: string } | null>(null);

    const generateUpdate = () => {
        setIsGenerating(true);

        // Simulate processing delay for "AI" feel
        setTimeout(() => {
            // --- Local Intelligence Logic (Heuristics) ---
            
            const getRandomTemplate = (templates: string[]) => templates[Math.floor(Math.random() * templates.length)];

            // 1. Analyze "Yesterday" (Done/Review tasks)
            const doneTasks = tasks.filter(t => 
                t.assigneeId === user.id && 
                (t.status === 'DONE' || t.status === 'REVIEW')
            );

            let yesterdayText = getRandomTemplate(["Sin actividad registrada ayer.", "No hubo cierres ayer.", "Ayer fue un día de planificación."]);
            if (doneTasks.length > 0) {
                const taskTitles = doneTasks.slice(0, 3).map(t => t.title).join(', ');
                const extra = doneTasks.length > 3 ? ` y ${doneTasks.length - 3} más` : '';
                
                const templates = [
                    `Completé: ${taskTitles}${extra}.`,
                    `Terminé las tareas: ${taskTitles}${extra}.`,
                    `Logré cerrar: ${taskTitles}${extra}.`,
                    `Finalicé el desarrollo de: ${taskTitles}${extra}.`
                ];
                yesterdayText = getRandomTemplate(templates);
                
                // Add some "AI" flavor based on priority
                const highPriority = doneTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;
                if (highPriority > 0) {
                    yesterdayText += getRandomTemplate([
                        ` Incluyendo ${highPriority} tickets críticos.`,
                        ` Prioricé ${highPriority} tareas urgentes.`,
                        ` Resolviendo ${highPriority} puntos de alta prioridad.`
                    ]);
                }
            }

            // 2. Analyze "Today" (In Progress/Todo tasks)
            const activeTasks = tasks.filter(t => 
                t.assigneeId === user.id && 
                (t.status === 'IN_PROGRESS' || t.status === 'TODO')
            );

            let todayText = getRandomTemplate(["Planificando el día.", "Organizando mis pendientes.", "Revisando backlog."]);
            if (activeTasks.length > 0) {
                const inProgress = activeTasks.filter(t => t.status === 'IN_PROGRESS');
                const todo = activeTasks.filter(t => t.status === 'TODO');

                if (inProgress.length > 0) {
                    const templates = [
                        `Trabajando en: ${inProgress.map(t => t.title).join(', ')}.`,
                        `Continuaré con: ${inProgress.map(t => t.title).join(', ')}.`,
                        `Mi foco hoy está en: ${inProgress.map(t => t.title).join(', ')}.`
                    ];
                    todayText = getRandomTemplate(templates);
                } else if (todo.length > 0) {
                    const templates = [
                        `Comenzaré con: ${todo[0].title}.`,
                        `Arrancando: ${todo[0].title}.`,
                        `Tomaré el ticket: ${todo[0].title}.`
                    ];
                    todayText = getRandomTemplate(templates);
                }

                if (activeTasks.length > 3) {
                    todayText += getRandomTemplate([" Tengo bastante carga hoy.", " Día lleno de tickets.", " Priorizando el backlog pendiente."]);
                }
            } else {
                todayText = "Sin tareas asignadas. Revisaré el backlog para tomar nuevos tickets.";
            }

            // 3. Analyze "Blockers"
            const blockedTasks = tasks.filter(t => 
                t.assigneeId === user.id && 
                t.isBlocked
            );

            let blockersText = getRandomTemplate(["Ninguno", "Sin bloqueos", "Todo despejado"]);
            if (blockedTasks.length > 0) {
                const templates = [
                    `Bloqueado en: ${blockedTasks.map(t => `${t.title} (${t.blockerReason || 'sin razón'})`).join(', ')}.`,
                    `Tengo impedimentos con: ${blockedTasks.map(t => t.title).join(', ')}.`,
                    `Necesito ayuda con: ${blockedTasks.map(t => t.title).join(', ')}.`
                ];
                blockersText = getRandomTemplate(templates);
            }

            const generatedSummary = {
                yesterday: yesterdayText,
                today: todayText,
                blockers: blockersText
            };

            setSummary(generatedSummary);
            onApplyUpdate(generatedSummary);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="bg-gradient-to-br from-[#7b68ee]/5 via-purple-500/5 to-transparent dark:from-[#7b68ee]/10 dark:via-purple-500/10 dark:to-transparent rounded-[32px] p-8 border border-[#7b68ee]/20 dark:border-white/5 relative overflow-hidden group">
            {/* IA Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b68ee]/10 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-[#7b68ee]/20 border border-[#7b68ee]/30 group-hover:scale-110 transition-transform duration-500">
                        <Bot className="w-8 h-8 text-[#7b68ee]" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">Inteligencia Local Standup</h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-amber-400" /> Generación automática sin API
                        </p>
                    </div>
                </div>

                {!summary && !isGenerating && (
                    <button
                        onClick={generateUpdate}
                        className="px-8 py-4 bg-[#7b68ee] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#7b68ee]/40 hover:bg-[#6b58de] active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Zap className="w-4 h-4" />
                        Generar Resumen Local
                    </button>
                )}
            </div>

            {isGenerating && (
                <div className="mt-8 flex flex-col items-center justify-center py-10 space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-[#7b68ee]/20 border-t-[#7b68ee] rounded-full animate-spin" />
                        <Bot className="w-8 h-8 text-[#7b68ee] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black text-slate-800 dark:text-white tracking-tighter uppercase">Analizando historial de tareas...</p>
                        <div className="flex gap-4 mt-3">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Code className="w-3 h-3" /> Estado</span>
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><MessageSquare className="w-3 h-3" /> Prioridad</span>
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Layout className="w-3 h-3" /> Bloqueos</span>
                        </div>
                    </div>
                </div>
            )}

            {summary && !isGenerating && (
                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-5 rounded-3xl border border-slate-100 dark:border-white/5 group/card hover:border-[#7b68ee]/30 transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ayer (Logros)</span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">"{summary.yesterday}"</p>
                        </div>

                        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-5 rounded-3xl border border-slate-100 dark:border-white/5 group/card hover:border-[#7b68ee]/30 transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-[#7b68ee]" />
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hoy (Objetivos)</span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">"{summary.today}"</p>
                        </div>

                        <div className="bg-rose-500/5 dark:bg-rose-500/10 p-5 rounded-3xl border border-rose-100 dark:border-rose-500/10 group/card hover:border-rose-500/30 transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-4 h-4 text-rose-500" />
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Bloqueos Detectados</span>
                            </div>
                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-relaxed italic">"{summary.blockers}"</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyIAUpdatePrepper;
