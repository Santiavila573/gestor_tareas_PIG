import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Save, Trash2, AlertCircle, CheckCircle2, Circle, StickyNote, Move } from 'lucide-react';

interface Ticket {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'inprogress' | 'done';
  priority: 'low' | 'medium' | 'high';
  color: string;
}

const RequirementBoard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('pig_requirement_tickets');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('pig_requirement_tickets', JSON.stringify(tickets));
  }, [tickets]);

  const addTicket = () => {
    const newTicket: Ticket = {
      id: Date.now().toString(),
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      title: 'Nuevo Requerimiento',
      description: 'Descripción del requerimiento...',
      status: 'backlog',
      priority: 'medium',
      color: '#fff9c4'
    };
    setTickets([...tickets, newTicket]);
  };

  const updateTicket = (id: string, field: keyof Ticket, value: any) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const deleteTicket = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este ticket?')) {
      setTickets(tickets.filter(t => t.id !== id));
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, x: number, y: number) => {
    // Only drag if clicking the header/handle
    e.stopPropagation();
    setIsDragging(true);
    setDragId(id);
    setDragOffset({
      x: e.clientX - x,
      y: e.clientY - y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragId) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      setTickets(tickets.map(t => 
        t.id === dragId ? { ...t, x: newX, y: newY } : t
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'inprogress': return 'bg-blue-500';
      case 'todo': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#f4f5f7] dark:bg-[#1e1e2d] relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={addTicket}
          className="flex items-center gap-2 px-4 py-2 bg-[#7b68ee] text-white rounded-lg shadow-lg hover:bg-[#6a5acd] transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nuevo Ticket
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full h-full relative">
        {tickets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <StickyNote className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium">Tablero de Requerimientos Vacío</p>
              <p className="text-sm">Crea un nuevo ticket para comenzar</p>
            </div>
          </div>
        )}

        {tickets.map(ticket => (
          <div
            key={ticket.id}
            className="absolute w-72 bg-white dark:bg-[#2a2b36] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-shadow hover:shadow-2xl"
            style={{
              left: ticket.x,
              top: ticket.y,
              transform: 'translate(0, 0)' // Removing translate(-50%, -50%) for easier drag calculation
            }}
          >
            {/* Ticket Header (Draggable) */}
            <div 
              className="h-8 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-3 cursor-move select-none"
              onMouseDown={(e) => handleMouseDown(e, ticket.id, ticket.x, ticket.y)}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(ticket.status)}`}></div>
                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  {ticket.status === 'done' ? 'Completado' : ticket.status === 'inprogress' ? 'En Progreso' : ticket.status === 'todo' ? 'Por Hacer' : 'Backlog'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => deleteTicket(ticket.id)}
                  className="p-1 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <input 
                type="text" 
                value={ticket.title}
                onChange={(e) => updateTicket(ticket.id, 'title', e.target.value)}
                className="w-full bg-transparent font-bold text-gray-800 dark:text-white border-none focus:outline-none focus:ring-0 p-0 text-base placeholder-gray-400"
                placeholder="Título del requerimiento"
              />
              
              <textarea 
                value={ticket.description}
                onChange={(e) => updateTicket(ticket.id, 'description', e.target.value)}
                className="w-full h-24 bg-gray-50 dark:bg-black/20 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300 border-none focus:outline-none focus:ring-1 focus:ring-[#7b68ee]/50 resize-none placeholder-gray-400"
                placeholder="Detalles del requerimiento..."
              />

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                <select 
                  value={ticket.status}
                  onChange={(e) => updateTicket(ticket.id, 'status', e.target.value)}
                  className="text-xs bg-transparent text-gray-500 dark:text-gray-400 border-none focus:ring-0 cursor-pointer hover:text-[#7b68ee]"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Por Hacer</option>
                  <option value="inprogress">En Progreso</option>
                  <option value="done">Completado</option>
                </select>

                <select 
                  value={ticket.priority}
                  onChange={(e) => updateTicket(ticket.id, 'priority', e.target.value)}
                  className={`text-xs font-medium px-2 py-1 rounded bg-opacity-10 border-none focus:ring-0 cursor-pointer ${
                    ticket.priority === 'high' ? 'bg-red-500 text-red-500' : 
                    ticket.priority === 'medium' ? 'bg-orange-500 text-orange-500' : 
                    'bg-blue-500 text-blue-500'
                  }`}
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequirementBoard;
