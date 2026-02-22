import React from 'react';
import { Task, TaskStatus, Sprint, Project } from '../../types';
import { Target, Layers, FileText, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
    tasks: Task[];
    projects: Project[];
    onCreateStory?: () => void;
}

const ProductOwnerView: React.FC<Props> = ({ tasks, projects, onCreateStory }) => {
    const backboneTasks = tasks.filter(t => t.status === TaskStatus.TODO).length;
    const projectProgress = [
        { name: 'Completado', value: tasks.filter(t => t.status === TaskStatus.DONE).reduce((acc, t) => acc + t.points, 0) },
        { name: 'Pendiente', value: tasks.filter(t => t.status !== TaskStatus.DONE).reduce((acc, t) => acc + t.points, 0) },
    ];
    const COLORS = ['#10b981', '#f59e0b'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[#7b68ee]/5 dark:bg-[#7b68ee]/10 p-4 lg:p-6 rounded-xl border border-[#7b68ee]/20 dark:border-[#7b68ee]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#7b68ee] rounded-lg text-white shadow-lg shadow-[#7b68ee]/30">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vista de Product Owner</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gestión de Backlog y Roadmap</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                        onClick={() => alert('Simulación: Iniciando sesión de refinamiento de backlog')}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-[#7b68ee]/5 hover:bg-[#7b68ee]/10 text-[#7b68ee] dark:bg-[#7b68ee]/10 dark:text-[#7b68ee] dark:hover:bg-[#7b68ee]/20 rounded-lg text-sm font-bold transition-colors"
                    >
                        <Layers className="w-4 h-4" />
                        <span className="whitespace-nowrap">Refinar Backlog</span>
                    </button>
                    <button
                        onClick={onCreateStory}
                        className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-[#7b68ee] hover:bg-[#6a5acd] text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-purple-500/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="whitespace-nowrap">Nueva Historia</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-gray-400" />
                        Estado del Backlog
                    </h3>
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Objetivo del Sprint</h4>
                        </div>
                        <p className="text-sm text-amber-900 dark:text-amber-100 italic">"Completar la autenticación de usuarios y la configuración básica del perfil."</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2a2b36] rounded-lg mb-4">
                        <div>
                            <p className="text-sm text-gray-500">Items en Backlog</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{backboneTasks}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Valor Estimado</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white text-right">
                                {tasks.filter(t => t.status === TaskStatus.TODO).reduce((acc, t) => acc + t.points, 0)} pts
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Prioridad</p>
                        {tasks.filter(t => t.status === TaskStatus.TODO).slice(0, 3).map(t => (
                            <div key={t.id} className="p-3 border border-gray-100 dark:border-[#2a2b36] rounded-lg bg-white dark:bg-[#1e1e2d] flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${t.priority === 'Crítica' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{t.title}</span>
                                </div>
                                <span className="text-xs font-mono bg-gray-100 dark:bg-[#2a2b36] px-2 py-1 rounded text-gray-500 shrink-0 ml-2">{t.points} pts</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        Progreso del Proyecto
                    </h3>
                    <div className="h-64 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={projectProgress}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {projectProgress.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductOwnerView;
