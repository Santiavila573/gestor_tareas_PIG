import React, { useState } from 'react';
import { Plus, Trash2, ThumbsUp, X, MessageSquare } from 'lucide-react';
import { RetroItem } from '../types';

interface RetrospectiveViewProps {
  items: RetroItem[];
  onAddItem: (item: Omit<RetroItem, 'id'>) => void;
  onUpdateItem: (item: RetroItem) => void;
  onDeleteItem: (itemId: string) => void;
  onClearItems: () => void;
}

const RetrospectiveView: React.FC<RetrospectiveViewProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem, onClearItems }) => {
  const [newItem, setNewItem] = useState('');
  const [activeType, setActiveType] = useState<'start' | 'stop' | 'continue'>('start');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    
    onAddItem({
      content: newItem,
      type: activeType,
      votes: 0
    });
    
    setNewItem('');
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Eliminar este punto?')) {
      onDeleteItem(id);
    }
  };

  const handleVote = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      onUpdateItem({ ...item, votes: item.votes + 1 });
    }
  };

  const columns = [
    { id: 'start', title: 'Start Doing', color: 'bg-emerald-500', icon: '🚀' },
    { id: 'stop', title: 'Stop Doing', color: 'bg-red-500', icon: '🛑' },
    { id: 'continue', title: 'Continue Doing', color: 'bg-blue-500', icon: '⭐' }
  ];

  const openAddModal = (type: 'start' | 'stop' | 'continue') => {
    setActiveType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#1e1e2d] overflow-hidden">
      <div className="flex-none p-6 bg-white dark:bg-[#1e1e2d] border-b border-gray-200 dark:border-[#2a2b36] flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <MessageSquare className="w-6 h-6 text-pink-600 dark:text-pink-400" />
            </div>
            Sprint Retrospective
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Reflexiona sobre el último Sprint y mejora continuamente
          </p>
        </div>
        <button
            onClick={() => {
                if(window.confirm('¿Archivar esta retrospectiva y comenzar una nueva?')) {
                    onClearItems();
                }
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
            Archivar y Limpiar
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-w-[1000px]">
          {columns.map(col => (
            <div key={col.id} className="flex flex-col bg-gray-100 dark:bg-[#2a2b36] rounded-xl p-4 h-full border border-gray-200 dark:border-gray-700">
              <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${col.color} text-white shadow-lg`}>
                <div className="font-bold text-lg flex items-center gap-2">
                  <span>{col.icon}</span>
                  {col.title}
                </div>
                <button 
                  onClick={() => openAddModal(col.id as any)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {items.filter(i => i.type === col.id).map(item => (
                  <div key={item.id} className="bg-white dark:bg-[#1e1e2d] p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group">
                    <p className="text-gray-800 dark:text-gray-200 text-sm mb-3 whitespace-pre-wrap">{item.content}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button 
                        onClick={() => handleVote(item.id)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-pink-500 transition-colors bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-full"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{item.votes}</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {items.filter(i => i.type === col.id).length === 0 && (
                    <div className="text-center py-10 text-gray-400 italic text-sm">
                        No hay puntos aquí todavía
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2a2b36] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-[#1e1e2d]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {activeType === 'start' && '🚀 Start Doing'}
                {activeType === 'stop' && '🛑 Stop Doing'}
                {activeType === 'continue' && '⭐ Continue Doing'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tu punto de vista</label>
              <textarea
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1e1e2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 h-32 resize-none"
                placeholder="Escribe aquí..."
                autoFocus
              />
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1e1e2d] flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-pink-600/20"
              >
                Añadir Punto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetrospectiveView;
