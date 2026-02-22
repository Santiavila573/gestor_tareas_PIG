import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Play, Pause, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimeEntry {
  id: string;
  description: string;
  duration: string; // "1h 30m" or decimal
  date: string;
  project?: string;
}

const Timesheets: React.FC = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ description: '', duration: '', project: '' });

  useEffect(() => {
    const saved = localStorage.getItem('pig_timesheets');
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pig_timesheets', JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: TimeEntry = {
      id: Date.now().toString(),
      description: newEntry.description,
      duration: newEntry.duration,
      date: new Date().toISOString(),
      project: newEntry.project
    };
    setEntries([entry, ...entries]);
    setNewEntry({ description: '', duration: '', project: '' });
    setShowAddModal(false);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('¿Borrar este registro?')) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hojas de Tiempo</h1>
           <p className="text-gray-500">Gestiona y registra tus horas trabajadas.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#7b68ee] hover:bg-[#6a5acd] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Tiempo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36]">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Clock className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm text-gray-500">Total esta semana</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">32h 15m</p>
             </div>
          </div>
        </div>
        {/* More stats placeholders could go here */}
      </div>

      {/* Entries Table */}
      <div className="bg-white dark:bg-[#1e1e2d] rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#16171f] border-b border-gray-200 dark:border-[#2a2b36]">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Fecha</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Descripción / Tarea</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Proyecto</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Duración</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2a2b36]">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay registros de tiempo. ¡Empieza a trabajar!
                  </td>
                </tr>
              ) : (
                entries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-[#2a2b36]/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {format(new Date(entry.date), 'd MMM, yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <span className="bg-gray-100 dark:bg-[#2a2b36] px-2 py-1 rounded text-xs">
                        {entry.project || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">
                      {entry.duration}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal (Simple Inline Overlay for now) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1e1e2d] rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-[#2a2b36] flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Registrar Tiempo</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <input 
                  autoFocus
                  type="text" 
                  required
                  placeholder="¿En qué trabajaste?"
                  className="w-full rounded-lg border border-gray-300 dark:border-[#2a2b36] bg-white dark:bg-[#16171f] px-3 py-2 text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent outline-none transition-all"
                  value={newEntry.description}
                  onChange={e => setNewEntry({...newEntry, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyecto (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Nombre del proyecto"
                  className="w-full rounded-lg border border-gray-300 dark:border-[#2a2b36] bg-white dark:bg-[#16171f] px-3 py-2 text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent outline-none transition-all"
                  value={newEntry.project}
                  onChange={e => setNewEntry({...newEntry, project: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración</label>
                <input 
                  type="text" 
                  required
                  placeholder="ej. 1h 30m"
                  className="w-full rounded-lg border border-gray-300 dark:border-[#2a2b36] bg-white dark:bg-[#16171f] px-3 py-2 text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent outline-none transition-all"
                  value={newEntry.duration}
                  onChange={e => setNewEntry({...newEntry, duration: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-[#2a2b36] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2b36] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#7b68ee] text-white rounded-lg hover:bg-[#6a5acd] transition-colors font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timesheets;
