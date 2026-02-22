import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, User, Priority, TaskComment } from '../types';
import { MoreHorizontal, Plus, Calendar, Flag, X, Save, User as UserIcon, AlignLeft, AlertCircle, Search } from 'lucide-react';
import TaskComments from './TaskComments';
import Modal from './common/Modal';
import { getTaskComments, addTaskComment, updateComment, deleteComment } from '../services/collaborationService';

interface ScrumBoardProps {
  tasks: Task[];
  users: User[];
  currentUser: User | null;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  highlightedTaskId?: string | null;
  onClearHighlight?: () => void;
}

const COLUMN_CONFIG = [
  { id: TaskStatus.TODO, title: 'Por Hacer', color: 'bg-slate-500' },
  { id: TaskStatus.IN_PROGRESS, title: 'En Progreso', color: 'bg-[#7b68ee]' },
  { id: TaskStatus.REVIEW, title: 'Revisión', color: 'bg-amber-500' },
  { id: TaskStatus.DONE, title: 'Hecho', color: 'bg-emerald-500' },
];

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-slate-100 text-slate-600 dark:bg-[#2a2b36] dark:text-slate-400',
    [Priority.MEDIUM]: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    [Priority.HIGH]: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    [Priority.CRITICAL]: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  };
  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const ScrumBoard: React.FC<ScrumBoardProps> = ({
  tasks,
  users,
  currentUser,
  onUpdateTaskStatus,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  highlightedTaskId,
  onClearHighlight
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Unified state for creating or editing
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    points: 3,
    status: TaskStatus.TODO,
    assigneeId: '',
    dueDate: ''
  });

  useEffect(() => {
    const fetchComments = async () => {
      if (editingTaskId) {
        const loadedComments = await getTaskComments(editingTaskId);
        setComments(loadedComments);
      } else {
        setComments([]);
      }
    };
    fetchComments();
  }, [editingTaskId]);

  const handleAddComment = async (content: string, mentions: string[]) => {
    if (!editingTaskId || !currentUser) return;
    try {
      const newComment = await addTaskComment(editingTaskId, currentUser.id, content, mentions);
      setComments(prev => [...prev, newComment]);
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, content);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content, isEdited: true } : c));
    } catch (error) {
      console.error('Failed to edit comment', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment', error);
    }
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTaskId(task.id);
      setTaskForm({
        title: task.title,
        description: task.description,
        priority: task.priority,
        points: task.points,
        status: task.status,
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate || ''
      });
      setIsModalOpen(true);
    } else {
      setEditingTaskId(null);
      setTaskForm({
        title: '',
        description: '',
        priority: Priority.MEDIUM,
        points: 3,
        status: TaskStatus.TODO,
        assigneeId: '',
        dueDate: ''
      });
      setIsModalOpen(true);
    }
  };

  // Handle highlighted task from search
  useEffect(() => {
    if (highlightedTaskId) {
      const task = tasks.find(t => t.id === highlightedTaskId);
      if (task) {
        handleOpenModal(task);
        if (onClearHighlight) {
          onClearHighlight();
        }
      }
    }
  }, [highlightedTaskId, tasks, onClearHighlight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;

    if (editingTaskId) {
      // Update existing
      onUpdateTask({
        id: editingTaskId,
        ...taskForm
      } as Task);
    } else {
      // Create new
      onAddTask({
        title: taskForm.title!,
        description: taskForm.description || '',
        status: TaskStatus.TODO,
        priority: taskForm.priority as Priority,
        points: taskForm.points || 1,
        assigneeId: taskForm.assigneeId || undefined,
        sprintId: 's1',
        dueDate: taskForm.dueDate
      } as any);
    }

    setIsModalOpen(false);
  };

  const handleDeleteClick = (taskId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      onDeleteTask(taskId);
    }
    setActiveMenuId(null);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId); // Robust fallback
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const id = draggedTaskId || e.dataTransfer.getData('text/plain'); // Get ID from state or dataTransfer

    if (id) {
      onUpdateTaskStatus(id, status);
      setDraggedTaskId(null);
    }
  };

  const getAssignee = (userId?: string) => users.find(u => u.id === userId);

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const canEdit = (task: Task) => {
    if (!currentUser) return false;

    // Normativa Scrum:
    // - Developers: Dueños del Sprint Backlog (Crear, Editar, Borrar).
    // - SM/PO: Facilitadores y dueños del producto (pueden intervenir).
    // Permitimos CRUD a todos los roles del Equipo Scrum.
    const role = currentUser.role;
    return (
      role === 'Scrum Master' ||
      role === 'Product Owner' ||
      role === 'Developer' ||
      role === 'Desarrollador'
    );
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 3xl:p-10 4xl:p-14 bg-slate-50 dark:bg-[#1e1e2d] overflow-hidden transition-colors">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl 3xl:text-4xl 4xl:text-5xl font-bold text-slate-900 dark:text-white">Tablero Sprint</h1>
          <button
            onClick={() => handleOpenModal()}
            className="md:hidden p-2 bg-[#7b68ee] text-white rounded-lg shadow-lg shadow-[#7b68ee]/20 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:flex-none w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar tarea..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 3xl:w-80 4xl:w-96 pl-9 pr-4 py-2 3xl:py-3 4xl:py-4 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-xl text-sm 3xl:text-base 4xl:text-lg focus:outline-none focus:ring-2 focus:ring-[#7b68ee] text-slate-700 dark:text-slate-200 shadow-sm"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="hidden md:flex items-center gap-2 bg-[#7b68ee] text-white px-4 py-2 3xl:px-6 3xl:py-3 4xl:px-8 4xl:py-4 rounded-lg text-sm 3xl:text-base 4xl:text-lg font-medium hover:bg-[#6b58de] transition-colors shadow-lg shadow-[#7b68ee]/20"
          >
            <Plus className="w-4 h-4 3xl:w-5 3xl:h-5 4xl:w-6 4xl:h-6" /> Nueva Tarea
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 2xl:gap-8 3xl:gap-10 4xl:gap-12 overflow-x-auto pb-4 snap-x snap-mandatory">
        {COLUMN_CONFIG.map((col) => {
          const colTasks = tasks.filter((t) =>
            t.status === col.id &&
            (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.description.toLowerCase().includes(searchTerm.toLowerCase()))
          );

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[85vw] md:w-80 2xl:w-96 3xl:w-[450px] 4xl:w-[550px] flex flex-col bg-slate-100/50 dark:bg-[#2a2b36]/50 rounded-[2rem] border border-slate-200/50 dark:border-white/5 transition-all backdrop-blur-sm snap-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="p-5 flex items-center justify-between sticky top-0 bg-transparent rounded-t-[2rem] z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shadow-lg ${col.color} animate-pulse`} />
                  <span className="font-black text-slate-800 dark:text-gray-200 text-sm 2xl:text-base 3xl:text-2xl 4xl:text-[2.25rem] tracking-tight">{col.title}</span>
                  <span className="bg-white dark:bg-[#1e1e2d] px-2.5 py-0.5 rounded-xl text-[10px] 3xl:text-lg 4xl:text-xl font-black text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/5 shadow-sm">
                    {colTasks.length}
                  </span>
                </div>
                <button className="p-1.5 text-slate-400 hover:text-[#7b68ee] transition-colors">
                  <Plus className="w-4 h-4 2xl:w-6 2xl:h-6" />
                </button>
              </div>

              <div className="flex-1 p-3 pt-0 overflow-y-auto space-y-3 custom-scrollbar">
                {colTasks.map((task) => {
                  const assignee = getAssignee(task.assigneeId);
                  const showMenu = activeMenuId === task.id;
                  const hasPermission = canEdit(task);

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white dark:bg-[#1e1e2d] p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 cursor-grab active:cursor-grabbing hover:shadow-xl hover:shadow-indigo-500/10 hover:border-[#7b68ee]/30 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7b68ee]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-start mb-2">
                        <PriorityBadge priority={task.priority} />

                        {hasPermission && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(showMenu ? null : task.id);
                              }}
                              className="text-slate-300 hover:text-slate-500 p-1 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {showMenu && (
                              <div className="absolute right-0 top-6 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(task); }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(task.id); }}
                                  className="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700"
                                >
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{task.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{task.description}</p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                        <div className="flex items-center gap-2">
                          {assignee ? (
                            <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full border border-white dark:border-slate-700 shadow-sm" title={assignee.name} />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-500">?</div>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                            <Flag className="w-3 h-3" />
                            <span>{task.points} pts</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                          {task.id.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTaskId ? 'Editar Tarea' : 'Nueva Tarea'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Título del Objetivo</label>
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="block w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400 text-lg"
              placeholder="Ej: Implementar Sistema de Autenticación"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Descripción Táctica</label>
            <div className="relative group">
              <div className="absolute top-4 left-4 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors">
                <AlignLeft className="w-5 h-5" />
              </div>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="block w-full p-4 pl-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none min-h-[120px] transition-all resize-none"
                placeholder="Detalla los requisitos y criterios de aceptación..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prioridad</label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Priority })}
                  className="block w-full px-4 py-3.5 pl-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-[#7b68ee] focus:outline-none appearance-none cursor-pointer"
                >
                  {Object.values(Priority).map(p => (
                    <option key={p} value={p} className="bg-white dark:bg-slate-900">{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Esfuerzo (Story Points)</label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400">
                  <Flag className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={taskForm.points}
                  onChange={(e) => setTaskForm({ ...taskForm, points: parseInt(e.target.value) })}
                  className="block w-full px-4 py-3.5 pl-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-[#7b68ee] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deadline Estratégico</label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={taskForm.dueDate || ''}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="block w-full px-4 py-3.5 pl-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-sm font-black focus:ring-2 focus:ring-[#7b68ee] focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {currentUser?.role === 'Desarrollador' || currentUser?.role === 'Developer' ? 'Auto-asignación' : 'Reclutar Responsable'}
            </label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <select
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                className="block w-full px-4 py-3.5 pl-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#7b68ee] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">Sin asignar</option>
                {(currentUser?.role === 'Scrum Master' || currentUser?.role === 'Product Owner') ? (
                  users.map(u => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900">{u.name} ({u.role})</option>
                  ))
                ) : (
                  currentUser && <option value={currentUser.id} className="bg-white dark:bg-slate-900">{currentUser.name} (Yo)</option>
                )}
              </select>
            </div>
          </div>

          {editingTaskId && currentUser && (
            <div className="pt-8 border-t border-slate-100 dark:border-white/10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Comunicaciones de la Misión</h4>
              <TaskComments
                taskId={editingTaskId}
                comments={comments}
                users={users}
                currentUser={currentUser}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
              />
            </div>
          )}

          <div className="pt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3.5 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:shadow-2xl hover:shadow-[#7b68ee]/30 flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              {editingTaskId ? 'Guardar Cambios' : 'Confirmar Misión'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ScrumBoard;