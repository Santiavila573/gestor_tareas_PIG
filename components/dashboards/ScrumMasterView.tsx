import React from 'react';
import { Task, TaskStatus, Sprint, User } from '../../types';
import { AlertTriangle, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
    tasks: Task[];
    activeSprint: Sprint;
    users: User[];
    onStartRetro?: () => void;
}

const ScrumMasterView: React.FC<Props> = ({ tasks, activeSprint, users, onStartRetro }) => {
    const blockers = tasks.filter(t => t.priority === 'Crítica' && t.status !== TaskStatus.DONE);

    // Calculate Sprint Progress (Points)
    const sprintTasks = tasks.filter(t => t.sprintId === activeSprint.id);
    const totalPoints = sprintTasks.reduce((acc, t) => acc + t.points, 0);
    const completedPoints = sprintTasks.filter(t => t.status === TaskStatus.DONE).reduce((acc, t) => acc + t.points, 0);
    const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

    // Calculate Time Remaining
    const startDate = new Date(activeSprint.startDate);
    const endDate = new Date(activeSprint.endDate);
    const today = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    const timePercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    const userLoad = users.map(u => ({
        name: u.name.split(' ')[0],
        tasks: tasks.filter(t => t.assigneeId === u.id && t.status !== TaskStatus.DONE).length,
        points: tasks.filter(t => t.assigneeId === u.id && t.status !== TaskStatus.DONE).reduce((acc, t) => acc + t.points, 0)
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#7b68ee]/5 dark:bg-[#7b68ee]/10 p-4 lg:p-6 rounded-xl border border-[#7b68ee]/20 dark:border-[#7b68ee]/20 flex items-center gap-4">
                <div className="p-2 bg-[#7b68ee] rounded-lg text-white shadow-lg shadow-[#7b68ee]/30">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vista de Scrum Master</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Supervisando la salud del equipo y el {activeSprint.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Bloqueos / Críticos</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{blockers.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Tareas de alta prioridad</p>
                    <div className="mt-4 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {blockers.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">Sin bloqueos críticos</span>
                        ) : blockers.map(t => (
                            <div key={t.id} className="text-xs p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded border border-red-100 dark:border-red-800 truncate" title={t.title}>
                                {t.title}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-[#10b981]" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Salud del Sprint</h3>
                    </div>
                    <div className="space-y-4 mt-6">
                        <div>
                            <div className="flex justify-between text-xs mb-1 font-medium text-gray-600 dark:text-gray-300">
                                <span>Progreso (Puntos)</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${progressPercent > timePercent ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`}
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 text-right">{completedPoints} de {totalPoints} pts</p>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs mb-1 font-medium text-gray-600 dark:text-gray-300">
                                <span>Tiempo Transcurrido</span>
                                <span>{timePercent}%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-[#3b82f6] h-2.5 rounded-full transition-all duration-1000" style={{ width: `${timePercent}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 text-right">{daysLeft > 0 ? `${daysLeft} días restantes` : 'Sprint finalizado'}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-[#7b68ee]" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Retrospectiva</h3>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={onStartRetro}
                            className="w-full py-2 bg-gray-100 dark:bg-[#2a2b36] hover:bg-gray-200 dark:hover:bg-[#363748] text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                        >
                            Iniciar Retro Sprint 10
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-6">Carga de Trabajo del Equipo (Puntos Activos)</h3>
                <div className="h-64 w-full min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userLoad}>
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#1e1e2d', border: '1px solid #2a2b36', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="points" fill="#7b68ee" radius={[4, 4, 0, 0]} name="Puntos de Historia" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ScrumMasterView;
