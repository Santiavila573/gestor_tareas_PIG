import React, { useState } from 'react';
import { Task, TaskStatus, Priority, User, Sprint } from '../models/types';
import { Plus, Search, Calendar, User as UserIcon, ArrowRight, MoreHorizontal, Trash2, Edit2, AlertCircle, Layers, CheckCircle, X, Save, ChevronRight, Sparkles } from 'lucide-react';
import Modal from './common/Modal';

interface BacklogViewProps {
  tasks: Task[];
  users: User[];
  sprints: Sprint[];
  activeSprintId?: string;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSprint: (sprint: Omit<Sprint, 'id'>) => void;
  onUpdateSprint: (sprint: Sprint) => void;
  onDeleteSprint: (sprintId: string) => void;
}

const BacklogView: React.FC<BacklogViewProps> = ({
  tasks,
  users,
  sprints,
  activeSprintId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddSprint,
  onUpdateSprint,
  onDeleteSprint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isAssignSprintModalOpen, setIsAssignSprintModalOpen] = useState(false);
  const [selectedTaskForSprint, setSelectedTaskForSprint] = useState<Task | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  // Sprint Form State
  const [sprintForm, setSprintForm] = useState<Partial<Sprint>>({
    name: '',
    startDate: '',
    endDate: '',
    goal: '',
    status: 'Planned'
  });

  // Filter only Backlog tasks
  const backlogTasks = tasks.filter(t =>
    t.status === TaskStatus.BACKLOG &&
    (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    points: 1,
    status: TaskStatus.BACKLOG,
    sprintId: 'backlog'
  });

  const handleSave = () => {
    if (!newTask.title) return;

    if (editingTask) {
      onUpdateTask({ ...editingTask, ...newTask } as Task);
    } else {
      onAddTask(newTask as any);
    }

    setIsModalOpen(false);
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      priority: Priority.MEDIUM,
      points: 1,
      status: TaskStatus.BACKLOG,
      sprintId: 'backlog'
    });
  };

  const handleSaveSprint = () => {
    if (!sprintForm.name || !sprintForm.startDate || !sprintForm.endDate) return;

    if (editingSprint) {
      onUpdateSprint({ ...editingSprint, ...sprintForm } as Sprint);
    } else {
      onAddSprint(sprintForm as any);
    }

    setEditingSprint(null);
    setSprintForm({
      name: '',
      startDate: '',
      endDate: '',
      goal: '',
      status: 'Planned'
    });
    // Don't close modal, just switch back to list view if we were editing? 
    // Actually let's keep the modal open to see the list, or maybe close if it was a create action.
    // For simplicity, let's keep the sprint management modal open but clear the form.
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setNewTask(task);
    } else {
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        priority: Priority.MEDIUM,
        points: 1,
        status: TaskStatus.BACKLOG,
        sprintId: 'backlog'
      });
    }
    setIsModalOpen(true);
  };

  const openSprintModal = (sprint?: Sprint) => {
    if (sprint) {
      setEditingSprint(sprint);
      setSprintForm(sprint);
    } else {
      setEditingSprint(null);
      setSprintForm({
        name: `Sprint ${sprints.length + 1}`,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days
        goal: '',
        status: 'Planned'
      });
    }
    setIsSprintModalOpen(true);
  };

  const initiateMoveToSprint = (task: Task) => {
    setSelectedTaskForSprint(task);
    setIsAssignSprintModalOpen(true);
  };

  const confirmMoveToSprint = (sprintId: string) => {
    if (selectedTaskForSprint) {
      onUpdateTask({ ...selectedTaskForSprint, status: TaskStatus.TODO, sprintId: sprintId });
      setIsAssignSprintModalOpen(false);
      setSelectedTaskForSprint(null);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.CRITICAL: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case Priority.HIGH: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case Priority.MEDIUM: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case Priority.LOW: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#1e1e2d] overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 md:p-6 bg-white dark:bg-[#1e1e2d] border-b border-gray-200 dark:border-[#2a2b36] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Product Backlog
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 hidden md:block">
            Gestiona y prioriza las historias de usuario antes de añadirlas al Sprint
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-[#2a2b36] border-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white w-full md:w-64"
            />
          </div>
          <button
            onClick={() => openSprintModal()}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white dark:bg-[#2a2b36] hover:bg-gray-50 dark:hover:bg-[#363748] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors font-medium shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Sprints</span>
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Nueva Historia</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-3 max-w-5xl mx-auto">
          {backlogTasks.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#2a2b36] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">El Backlog está vacío</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Añade nuevas historias de usuario para comenzar</p>
            </div>
          ) : (
            backlogTasks.map(task => (
              <div key={task.id} className="group bg-white dark:bg-[#2a2b36] p-3 md:p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex items-center gap-3 md:gap-4 w-full">
                  <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${getPriorityColor(task.priority).split(' ')[0]}`}></div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs font-mono text-gray-400">#{task.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{task.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate hidden md:block">{task.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 text-gray-500 dark:text-gray-400 text-sm w-full md:w-auto pl-4 md:pl-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700 pt-3 md:pt-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1" title="Story Points">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-xs">
                        {task.points}
                      </div>
                      <span className="text-xs">pts</span>
                    </div>

                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    {task.assigneeId && (
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                          {users.find(u => u.id === task.assigneeId)?.name.charAt(0)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => initiateMoveToSprint(task)}
                      className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 rounded-lg transition-colors"
                      title="Asignar a un Sprint"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal(task)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign Sprint Modal */}
      <Modal
        isOpen={isAssignSprintModalOpen}
        onClose={() => setIsAssignSprintModalOpen(false)}
        title="Desplegar en Sprint"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-[#7b68ee]/5 dark:bg-[#7b68ee]/10 border border-[#7b68ee]/20 rounded-2xl p-4">
            <p className="text-xs font-black text-[#7b68ee] uppercase tracking-[0.2em] mb-1">Misión Seleccionada</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedTaskForSprint?.title}</p>
          </div>

          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seleccionar Ciclo Operativo (Sprint)</p>

          <div className="space-y-3">
            {sprints.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No hay ciclos activos</p>
              </div>
            ) : (
              sprints.map(sprint => (
                <button
                  key={sprint.id}
                  onClick={() => confirmMoveToSprint(sprint.id)}
                  className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:border-[#7b68ee] hover:shadow-xl hover:shadow-[#7b68ee]/10 transition-all group text-left"
                >
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{sprint.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {new Date(sprint.startDate).toLocaleDateString()} — {new Date(sprint.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${sprint.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'}`}>
                    {sprint.status}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Sprint Management Modal */}
      <Modal
        isOpen={isSprintModalOpen}
        onClose={() => setIsSprintModalOpen(false)}
        title="Gestión de Ciclos (Sprints)"
        size="xl"
      >
        <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[500px]">
          {/* Sprint List */}
          <div className="lg:w-1/3 space-y-4">
            <button
              onClick={() => openSprintModal()}
              className="w-full py-4 px-6 bg-[#7b68ee] text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-all shadow-xl shadow-[#7b68ee]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nuevo Ciclo
            </button>

            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {sprints.map(sprint => (
                <div
                  key={sprint.id}
                  onClick={() => { setEditingSprint(sprint); setSprintForm(sprint); }}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${editingSprint?.id === sprint.id
                      ? 'border-[#7b68ee] bg-[#7b68ee]/5 dark:bg-[#7b68ee]/10 shadow-lg shadow-[#7b68ee]/5'
                      : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:border-[#7b68ee]/30'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight">{sprint.name}</h4>
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${sprint.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                      }`}>
                      {sprint.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{sprint.goal || 'Sin objetivo táctico'}</p>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(sprint.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sprint Form */}
          <div className="flex-1 bg-slate-50/50 dark:bg-white/5 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                <Sparkles className="w-6 h-6 text-[#7b68ee]" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {editingSprint ? 'Configuración de Ciclo' : 'Nueva Misión de Ciclo'}
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Define los parámetros del horizonte temporal</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Identificador del Sprint</label>
                <input
                  type="text"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                  className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-black text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all"
                  placeholder="Ej. Sprint 24: Core Architecture"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Fecha Inicio</label>
                  <input
                    type="date"
                    value={sprintForm.startDate ? new Date(sprintForm.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Fecha Fin</label>
                  <input
                    type="date"
                    value={sprintForm.endDate ? new Date(sprintForm.endDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Objetivo Táctico (Goal)</label>
                <textarea
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none h-28 resize-none transition-all"
                  placeholder="¿Qué metas operativas alcanzaremos en este ciclo?"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Estado Operativo</label>
                <select
                  value={sprintForm.status}
                  onChange={(e) => setSprintForm({ ...sprintForm, status: e.target.value as 'Active' | 'Planned' | 'Completed' })}
                  className="w-full px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Planned" className="bg-white dark:bg-slate-900">Planned</option>
                  <option value="Active" className="bg-white dark:bg-slate-900">Active</option>
                  <option value="Completed" className="bg-white dark:bg-slate-900">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
              {editingSprint && (
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de eliminar este sprint?')) {
                      onDeleteSprint(editingSprint.id);
                      setEditingSprint(null);
                      setSprintForm({ name: '', startDate: '', endDate: '', goal: '', status: 'Planned' });
                    }
                  }}
                  className="mr-auto px-5 py-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Ciclo
                </button>
              )}

              <button
                onClick={() => {
                  if (editingSprint) {
                    setEditingSprint(null);
                    setSprintForm({ name: '', startDate: '', endDate: '', goal: '', status: 'Planned' });
                  } else {
                    setIsSprintModalOpen(false);
                  }
                }}
                className="px-6 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
              >
                {editingSprint ? 'Volver' : 'Cerrar'}
              </button>
              <button
                onClick={handleSaveSprint}
                className="px-8 py-3.5 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-[#7b68ee]/20 flex items-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" />
                {editingSprint ? 'Guardar Cambios' : 'Confirmar Ciclo'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Task Creation/Editing Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Editar Historia' : 'Nueva Historia de Usuario'}
        size="lg"
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Título del Objetivo</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400"
              placeholder="Como usuario, quiero..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Descripción Táctica</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none h-32 resize-none transition-all"
              placeholder="Criterios de aceptación y detalles técnicos..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prioridad</label>
              <div className="relative">
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none appearance-none cursor-pointer"
                >
                  {Object.values(Priority).map(p => (
                    <option key={p} value={p} className="bg-white dark:bg-slate-900">{p}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Esfuerzo Estimado</label>
              <input
                type="number"
                value={newTask.points}
                onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) || 0 })}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-xl text-center focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reclutar Responsable</label>
              <div className="relative">
                <select
                  value={newTask.assigneeId || ''}
                  onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-900">Reservar (Sin asignar)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900">{u.name} — {u.role}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deadline Operativo</label>
              <input
                type="date"
                value={newTask.dueDate || ''}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4 border-t border-slate-100 dark:border-white/10">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3.5 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-[#7b68ee]/20 flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              {editingTask ? 'Guardar Cambios' : 'Confirmar Historia'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BacklogView;
