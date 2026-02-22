import React, { useState } from 'react';
import { Plus, Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Trash2, X, Save, Rocket, Layers, BarChart3, Target } from 'lucide-react';
import { RoadmapItem } from '../types';
import Modal from './common/Modal';

interface RoadmapViewProps {
  items: RoadmapItem[];
  onAddItem: (item: Omit<RoadmapItem, 'id'>) => void;
  onUpdateItem: (item: RoadmapItem) => void;
  onDeleteItem: (itemId: string) => void;
}

const RoadmapView: React.FC<RoadmapViewProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<RoadmapItem>>({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    progress: 0,
    category: 'Frontend',
    status: 'Planned'
  });

  const handleAddItem = () => {
    if (!newItem.title || !newItem.startDate || !newItem.endDate) return;

    onAddItem({
      title: newItem.title,
      startDate: newItem.startDate,
      endDate: newItem.endDate,
      progress: newItem.progress || 0,
      category: newItem.category as any,
      status: newItem.status as any
    });

    setIsModalOpen(false);
    setNewItem({
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      progress: 0,
      category: 'Frontend',
      status: 'Planned'
    });
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('¿Eliminar este hito del roadmap?')) {
      onDeleteItem(id);
    }
  };

  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    if (date.getFullYear() !== currentYear) return -1;

    const startOfYear = new Date(currentYear, 0, 1);
    const dayOfYear = (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24);
    return (dayOfYear / 365) * 100;
  };

  const getWidth = (start: string, end: string) => {
    const startPos = getPosition(start);
    const endPos = getPosition(end);

    // Handle cross-year logic roughly or just clamp
    let s = startPos < 0 ? 0 : startPos;
    let e = endPos < 0 ? 100 : endPos;

    if (new Date(start).getFullYear() < currentYear) s = 0;
    if (new Date(end).getFullYear() > currentYear) e = 100;

    return Math.max(e - s, 2); // Min 2% width
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Delayed': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#1e1e2d] overflow-hidden">
      <div className="flex-none p-4 md:p-6 bg-white dark:bg-[#1e1e2d] border-b border-gray-200 dark:border-[#2a2b36] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            Roadmap {currentYear}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 hidden md:block">
            Planificación estratégica y visión a largo plazo
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex bg-gray-100 dark:bg-[#2a2b36] rounded-lg p-1">
            <button onClick={() => setCurrentYear(currentYear - 1)} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded">
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="px-3 font-mono font-bold text-gray-700 dark:text-gray-300">{currentYear}</span>
            <button onClick={() => setCurrentYear(currentYear + 1)} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded">
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Nuevo Hito</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-6 relative">
        <div className="min-w-[1000px] bg-white dark:bg-[#2a2b36] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Timeline Header */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <div className="w-48 flex-none p-4 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252630] font-bold text-gray-700 dark:text-gray-300">
              Epics / Hitos
            </div>
            <div className="flex-1 grid grid-cols-12 bg-gray-50 dark:bg-[#252630]">
              {months.map(m => (
                <div key={m} className="p-4 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Body */}
          <div className="relative min-h-[400px]">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex ml-48 pointer-events-none">
              <div className="flex-1 grid grid-cols-12 h-full">
                {months.map(m => (
                  <div key={m} className="border-r border-gray-100 dark:border-gray-700/50 h-full"></div>
                ))}
              </div>
            </div>

            {/* Current Date Line */}
            {currentYear === new Date().getFullYear() && (
              <div
                className="absolute top-0 bottom-0 border-l-2 border-red-500 z-10 ml-48 pointer-events-none"
                style={{ left: `${(new Date().getMonth() / 12 * 100) + (new Date().getDate() / 30 * (100 / 12))}%` }}
              >
                <div className="bg-red-500 text-white text-[10px] px-1 rounded-sm absolute -top-1 -left-6">Hoy</div>
              </div>
            )}

            {items.map(item => {
              const startPos = getPosition(item.startDate);
              const width = getWidth(item.startDate, item.endDate);

              if (width <= 0 || (startPos < 0 && startPos + width < 0) || startPos > 100) return null;

              const left = startPos < 0 ? 0 : startPos;
              const displayWidth = startPos < 0 ? width + startPos : width;

              return (
                <div key={item.id} className="flex border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group relative z-0">
                  <div className="w-48 flex-none p-4 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-center z-10 bg-inherit">
                    <div className="font-medium text-gray-900 dark:text-white truncate" title={item.title}>{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.category}</span>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></span>
                    </div>
                  </div>
                  <div className="flex-1 relative h-20">
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg ${getStatusColor(item.status)}/20 border ${getStatusColor(item.status).replace('bg-', 'border-')} cursor-pointer transition-all hover:shadow-lg`}
                      style={{
                        left: `${left}%`,
                        width: `${displayWidth}%`
                      }}
                      title={`${item.title}: ${item.startDate} - ${item.endDate}`}
                    >
                      <div
                        className={`h-full rounded-l-lg ${getStatusColor(item.status)}/60`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                      <span className="absolute inset-0 flex items-center px-2 text-xs font-bold text-gray-700 dark:text-white truncate">
                        {item.progress}%
                      </span>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                        className="absolute -right-2 -top-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md z-20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="flex items-center justify-center h-40 text-gray-400">
                No hay hitos para este año
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Milestone Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configuración de Hito Estratégico"
        size="md"
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Objetivo del Hito</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Target className="h-5 w-5 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
              </div>
              <input
                type="text"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400"
                placeholder="Ej. Despliegue de IA Generativa"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inicio de Fase</label>
              <div className="relative">
                <input
                  type="date"
                  value={newItem.startDate}
                  onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-[#7b68ee] focus:outline-none transition-all cursor-pointer appearance-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cierre de Fase</label>
              <div className="relative">
                <input
                  type="date"
                  value={newItem.endDate}
                  onChange={(e) => setNewItem({ ...newItem, endDate: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-[#7b68ee] focus:outline-none transition-all cursor-pointer appearance-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoría Táctica</label>
              <div className="relative">
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#7b68ee] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado Operativo</label>
              <div className="relative">
                <select
                  value={newItem.status}
                  onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#7b68ee] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progreso de Ejecución</label>
              <span className="px-3 py-1 bg-[#7b68ee]/10 text-[#7b68ee] rounded-lg font-black text-sm">{newItem.progress}%</span>
            </div>
            <div className="px-2">
              <input
                type="range"
                min="0"
                max="100"
                value={newItem.progress}
                onChange={(e) => setNewItem({ ...newItem, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-200 dark:bg-white/5 rounded-full appearance-none cursor-pointer accent-[#7b68ee]"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-8 border-t border-slate-100 dark:border-white/10 mt-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-4 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddItem}
              className="flex-1 px-4 py-4 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#7b68ee]/20 flex justify-center items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Guardar Hito
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoadmapView;
