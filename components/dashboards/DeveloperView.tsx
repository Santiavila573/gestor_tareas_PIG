import React, { useState } from 'react';
import { Task, TaskStatus, User } from '../../types';
import { Code, CheckCircle2, Clock, PlayCircle, MessageSquare, Video, X, Send } from 'lucide-react';

interface Props {
    tasks: Task[];
    currentUser: User;
    onMoveToReview?: (taskId: string) => void;
    onAddComment?: (taskId: string, comment: string) => void;
    onDailyUpdate?: (taskId: string, status: string, blockers: string) => void;
}

const DeveloperView: React.FC<Props> = ({ tasks, currentUser, onMoveToReview, onAddComment, onDailyUpdate }) => {
    const [isDailyOpen, setIsDailyOpen] = useState(false);
    const [dailyForm, setDailyForm] = useState({ yesterday: '', today: '', blockers: '' });

    const myTasks = tasks.filter(t => t.assigneeId === currentUser.id);
    const activeTask = myTasks.find(t => t.status === TaskStatus.IN_PROGRESS);
    const pendingTasks = myTasks.filter(t => t.status === TaskStatus.TODO);
    const completedCount = myTasks.filter(t => t.status === TaskStatus.DONE).length;

    const handleDailySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeTask && onDailyUpdate) {
            onDailyUpdate(activeTask.id, dailyForm.today, dailyForm.blockers);
        }
        // Simulate reset or keep open
        setIsDailyOpen(false);
        setDailyForm({ yesterday: '', today: '', blockers: '' });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#7b68ee]/5 dark:bg-[#7b68ee]/10 p-4 lg:p-6 rounded-xl border border-[#7b68ee]/20 dark:border-[#7b68ee]/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#7b68ee] rounded-lg text-white shadow-lg shadow-[#7b68ee]/30">
                        <Code className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Espacio de Trabajo</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sprint Actual: <span className="font-medium text-gray-700 dark:text-gray-300">Implementación Core</span></p>
                    </div>
                </div>

                <button
                    onClick={() => setIsDailyOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7b68ee] hover:bg-[#6a5acd] text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-purple-500/20"
                >
                    <Video className="w-4 h-4" />
                    Daily Update
                </button>
            </div>

            <div className="bg-white dark:bg-[#1e1e2d] p-4 rounded-xl border border-gray-200 dark:border-[#2a2b36] shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tu Meta del Sprint</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Entregar todas las tareas de <b>Prioridad Alta</b> asignadas antes del viernes.</p>
                    </div>
                </div>
            </div>

            {
                activeTask && (
                    <div className="bg-gradient-to-r from-[#7b68ee] to-[#c026d3] rounded-xl p-6 text-white shadow-lg shadow-purple-500/20">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-medium mb-3 border border-white/20">
                                    <PlayCircle className="w-3 h-3" />
                                    En Progreso
                                </span>
                                <h3 className="text-2xl font-bold mb-2">{activeTask.title}</h3>
                                <p className="text-white/90 mb-6 max-w-2xl">{activeTask.description}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-4xl font-bold opacity-50">{activeTask.points}</span>
                                <p className="text-xs uppercase tracking-wider opacity-70">Puntos</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onMoveToReview?.(activeTask.id)}
                                className="px-4 py-2 bg-white text-[#7b68ee] rounded-lg font-medium hover:bg-[#7b68ee]/10 transition-colors"
                            >
                                Mover a Review
                            </button>
                            <button
                                onClick={() => {
                                    const comment = prompt("Añadir comentario:");
                                    if (comment) onAddComment?.(activeTask.id, comment);
                                }}
                                className="px-4 py-2 bg-black/20 hover:bg-black/30 text-white rounded-lg font-medium transition-colors border border-white/10"
                            >
                                Añadir Comentario
                            </button>
                        </div>
                    </div>
                )
            }

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-10">
                <div className="bg-white dark:bg-[#1e1e2d] p-6 lg:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36]">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Mis Tareas Pendientes
                    </h3>
                    {pendingTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>¡Todo al día! No tienes tareas pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingTasks.map(t => (
                                <div key={t.id} className="p-4 border border-gray-100 dark:border-[#2a2b36] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2b36]/50 transition-colors flex justify-between items-center group">
                                    <div>
                                        <h4 className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-[#7b68ee] transition-colors">{t.title}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded ${t.priority === 'Crítica' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'} `}>
                                            {t.priority}
                                        </span>
                                    </div>
                                    <button className="p-2 text-gray-400 hover:text-[#7b68ee]">
                                        <PlayCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36]">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Resumen de Impacto</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-[#2a2b36] rounded-lg text-center border border-gray-100 dark:border-[#2a2b36]">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedCount}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">Tareas Completadas</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-[#2a2b36] rounded-lg text-center border border-gray-100 dark:border-[#2a2b36]">
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {myTasks.filter(t => t.status === TaskStatus.DONE).reduce((acc, t) => acc + t.points, 0)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">Puntos Entregados</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Modal */}
            {
                isDailyOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
                        <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-2xl w-full max-w-lg border border-white/20 dark:border-[#2a2b36] scale-100 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-4 md:px-6 md:py-5 border-b border-gray-100 dark:border-[#2a2b36] flex justify-between items-center bg-white dark:bg-[#1e1e2d] rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 rounded-lg text-[#7b68ee]">
                                        <Video className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Daily Standup</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Actualización diaria del equipo</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsDailyOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleDailySubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">¿Qué hiciste ayer?</label>
                                    <textarea
                                        value={dailyForm.yesterday}
                                        onChange={(e) => setDailyForm({ ...dailyForm, yesterday: e.target.value })}
                                        className="block w-full p-3 bg-gray-50 dark:bg-[#2a2b36] border border-gray-200 dark:border-[#2a2b36] rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#7b68ee] focus:outline-none resize-none h-20"
                                        placeholder="- Completé la integración de..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">¿Qué harás hoy?</label>
                                    <textarea
                                        value={dailyForm.today}
                                        onChange={(e) => setDailyForm({ ...dailyForm, today: e.target.value })}
                                        className="block w-full p-3 bg-gray-50 dark:bg-[#2a2b36] border border-gray-200 dark:border-[#2a2b36] rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#7b68ee] focus:outline-none resize-none h-20"
                                        placeholder="- Trabajaré en el componente..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 text-red-500">¿Algún bloqueo?</label>
                                    <textarea
                                        value={dailyForm.blockers}
                                        onChange={(e) => setDailyForm({ ...dailyForm, blockers: e.target.value })}
                                        className="block w-full p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none h-20 placeholder-red-300"
                                        placeholder="Ninguno"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsDailyOpen(false)}
                                        className="px-4 py-2 border border-gray-200 dark:border-[#2a2b36] text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#2a2b36]"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-[#7b68ee] text-white rounded-lg text-sm font-bold hover:bg-[#6a5acd] shadow-lg shadow-purple-500/20 flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Enviar Reporte
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

        </div>
    );
};

export default DeveloperView;
