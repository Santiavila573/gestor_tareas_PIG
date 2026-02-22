import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { Plus, Edit2, Trash2, Folder, User as UserIcon, X, Save, Type, AlignLeft, Briefcase, ShieldCheck, Award, Rocket, Layout, Database, Terminal, ChevronRight } from 'lucide-react';
import Modal from './common/Modal';

interface ProjectsProps {
  projects: Project[];
  users: User[];
  currentUser: User | null;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  highlightedProjectId?: string | null;
  onClearHighlight?: () => void;
}

const Projects: React.FC<ProjectsProps> = ({
  projects,
  users,
  currentUser,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  highlightedProjectId,
  onClearHighlight
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ownerId: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        name: project.name,
        description: project.description,
        ownerId: project.ownerId
      });
    } else {
      setEditingProject(null);
      setFormData({ name: '', description: '', ownerId: users[0]?.id || '' });
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (highlightedProjectId) {
      const project = projects.find(p => p.id === highlightedProjectId);
      if (project) {
        handleOpenModal(project);
        if (onClearHighlight) onClearHighlight();
      }
    }
  }, [highlightedProjectId, projects, onClearHighlight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      onUpdateProject({ ...editingProject, ...formData });
    } else {
      onAddProject(formData);
    }
    setIsModalOpen(false);
  };

  const getOwner = (id: string) => users.find(u => u.id === id);

  // Decorative data for detailed view
  const getProjectTech = (id: string) => {
    const techStacks = [
      { stack: "React, Node.js, PostgreSQL", icon: <Layout className="w-4 h-4" /> },
      { stack: "Next.js, Tailwind, MongoDB", icon: <Layout className="w-4 h-4" /> },
      { stack: "Python, Django, AWS", icon: <Terminal className="w-4 h-4" /> },
      { stack: "Vue.js, Firebase, Google Cloud", icon: <Database className="w-4 h-4" /> }
    ];
    return techStacks[id.length % techStacks.length];
  };

  const getProjectPhases = (id: string) => [
    "Análisis de Requerimientos",
    "Diseño de Arquitectura",
    "Desarrollo Core",
    "QA & Pruebas de Usuario"
  ];

  return (
    <div className="p-6 3xl:p-10 4xl:p-14 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl 3xl:text-6xl 4xl:text-7xl font-bold text-slate-900 dark:text-white">Proyectos</h1>
          <p className="text-slate-500 dark:text-slate-400 3xl:text-2xl 4xl:text-3xl">Gestiona los portafolios y asignaciones.</p>
        </div>

        <div className="flex gap-3">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 3xl:py-3.5 4xl:py-4.5 w-full bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-xl text-sm 3xl:text-base 4xl:text-lg focus:outline-none focus:ring-2 focus:ring-[#7b68ee] text-slate-700 dark:text-slate-200"
            />
          </div>

          {(currentUser?.role === 'Scrum Master' || currentUser?.role === 'Product Owner') && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-[#7b68ee] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#6b58de] transition-all shadow-lg shadow-[#7b68ee]/20 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nuevo Proyecto
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-6 3xl:gap-10 4xl:gap-14 pb-20">
        {filteredProjects.map(project => {
          const owner = getOwner(project.ownerId);
          return (
            <div
              key={project.id}
              onClick={() => setViewingProject(project)}
              className="group bg-white dark:bg-[#1e1e2d] rounded-[2rem] border border-slate-200 dark:border-white/5 hover:border-[#7b68ee]/50 transition-all duration-500 p-6 3xl:p-10 flex flex-col relative overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7b68ee] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="p-4 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 text-[#7b68ee] dark:text-[#a89aff] rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                  <Folder className="w-6 h-6 3xl:w-10 3xl:h-10" />
                </div>
                {(currentUser?.role === 'Scrum Master' || currentUser?.role === 'Product Owner') && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(project);
                      }}
                      className="p-2 text-slate-400 hover:text-[#7b68ee] dark:hover:text-[#a89aff] hover:bg-[#7b68ee]/10 dark:hover:bg-[#7b68ee]/20 rounded-xl transition-all active:scale-90"
                    >
                      <Edit2 className="w-4 h-4 3xl:w-8 3xl:h-8" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-xl transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4 3xl:w-8 3xl:h-8" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-xl 3xl:text-4xl 4xl:text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter group-hover:text-[#7b68ee] transition-colors relative z-10">{project.name}</h3>
              <p className="text-sm 3xl:text-2xl 4xl:text-3xl text-slate-500 dark:text-slate-400 mb-8 flex-1 leading-relaxed line-clamp-3 relative z-10">{project.description}</p>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5 mt-auto relative z-10">
                <div className="flex items-center gap-3">
                  {owner ? (
                    <img src={owner.avatar} alt={owner.name} className="w-10 h-10 3xl:w-16 3xl:h-16 rounded-full border-2 border-white dark:border-slate-800 shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-10 h-10 3xl:w-16 3xl:h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/5">
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="text-xs 3xl:text-xl">
                    <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5 text-[9px] 3xl:text-base">Product Owner</p>
                    <p className="font-black text-slate-700 dark:text-slate-200">{owner?.name || 'Sin asignar'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] 3xl:text-lg font-bold text-slate-400 uppercase tracking-widest">Activo</span>
                </div>
              </div>
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
              <Folder className="w-8 h-8 text-[#7b68ee]/40" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No hay proyectos</h3>
            <p className="text-sm mt-1 mb-6 max-w-sm text-center">Comienza creando tu primer proyecto para organizar sprints y tareas.</p>
            <button
              onClick={() => handleOpenModal()}
              className="text-[#7b68ee] dark:text-[#a89aff] font-medium text-sm hover:underline"
            >
              Crear proyecto ahora
            </button>
          </div>
        )}
      </div>

      {/* Project Viewer Modal */}
      {viewingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[60] flex items-center justify-center p-8 lg:p-16 3xl:p-24 4xl:p-32 animate-in fade-in duration-300">
          <div className="bg-white/95 dark:bg-[#1a1b26]/95 backdrop-blur-3xl rounded-[3rem] 4xl:rounded-[4rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.6)] w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl 3xl:max-w-5xl 4xl:max-w-7xl max-h-[85vh] overflow-hidden border border-white/20 dark:border-white/5 relative transform animate-in zoom-in-95 duration-500 flex flex-col">
            {/* Action Header */}
            <div className="absolute top-6 right-6 3xl:top-10 3xl:right-10 z-20 flex gap-4 3xl:gap-6">
              {(currentUser?.role === 'Scrum Master' || currentUser?.role === 'Product Owner') && (
                <button
                  onClick={() => {
                    handleOpenModal(viewingProject);
                    setViewingProject(null);
                  }}
                  className="p-4 bg-white/20 hover:bg-[#7b68ee] text-white rounded-2xl backdrop-blur-md transition-all border border-white/20 shadow-xl active:scale-95"
                >
                  <Edit2 className="w-5 h-5 3xl:w-10 3xl:h-10" />
                </button>
              )}
              <button
                onClick={() => setViewingProject(null)}
                className="p-4 bg-black/20 hover:bg-red-500/80 text-white rounded-2xl backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95 shadow-xl border border-white/10"
              >
                <X className="w-5 h-5 3xl:w-10 3xl:h-10" />
              </button>
            </div>

            {/* Project Hero */}
            <div className="relative h-44 lg:h-56 xl:h-64 3xl:h-96 4xl:h-[500px] shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7b68ee] to-indigo-900 transition-all duration-700 opacity-90"></div>
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"></div>

              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 blur-[100px] rounded-full"></div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full z-10 px-8">
                <div className="p-6 lg:p-8 3xl:p-16 bg-white/10 rounded-[2.5rem] 3xl:rounded-[4rem] backdrop-blur-3xl border border-white/20 mb-6 lg:mb-10 3xl:mb-16 shadow-3xl group/icon overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Folder className="w-10 h-10 lg:w-14 lg:h-14 xl:w-20 xl:h-20 3xl:w-32 3xl:h-32 text-white relative z-10 transition-transform group-hover:scale-110" />
                </div>
                <h2 className="text-3xl lg:text-4xl xl:text-5xl 3xl:text-7xl 4xl:text-9xl font-black text-white text-center leading-none tracking-tight uppercase tracking-[-0.02em]">{viewingProject.name}</h2>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="p-8 lg:p-12 xl:p-16 3xl:p-24 4xl:p-40 space-y-10 lg:space-y-14 3xl:space-y-20 4xl:space-y-32 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-white/30 to-white/0 dark:from-white/5 dark:to-transparent">
              <section className="space-y-4 lg:space-y-6 3xl:space-y-12">
                <div className="flex items-center gap-3 lg:gap-4 3xl:gap-6">
                  <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                    <Rocket className="w-5 h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 3xl:w-16 3xl:h-16 text-[#7b68ee]" />
                  </div>
                  <h4 className="text-sm lg:text-base xl:text-xl 3xl:text-5xl 4xl:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Alcance y Objetivos Estratégicos</h4>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm lg:text-base xl:text-lg 3xl:text-4xl 4xl:text-6xl font-black opacity-90 italic border-l-4 lg:border-l-8 border-[#7b68ee]/30 pl-6 lg:pl-8 3xl:pl-16 ml-2">
                  "{viewingProject.description}"
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 3xl:gap-24">
                <section className="space-y-6 lg:space-y-8 xl:space-y-10 3xl:space-y-20">
                  <div className="flex items-center gap-3 lg:gap-4 3xl:gap-6">
                    <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                      <Terminal className="w-5 h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 3xl:w-16 3xl:h-16 text-blue-500" />
                    </div>
                    <h4 className="text-sm lg:text-base xl:text-xl 3xl:text-5xl 4xl:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Ecosistema Tecnológico</h4>
                  </div>
                  <div className="p-8 lg:p-10 3xl:p-20 rounded-3xl lg:rounded-[2.5rem] 3xl:rounded-[4rem] bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center gap-6 lg:gap-8 3xl:gap-16 shadow-xl hover:shadow-2xl transition-all cursor-default">
                    <div className="p-4 lg:p-6 3xl:p-12 bg-blue-500/10 text-blue-500 rounded-2xl 3xl:rounded-[2rem] shadow-inner">
                      {React.cloneElement(getProjectTech(viewingProject.id).icon as React.ReactElement, { className: "w-8 h-8 lg:w-10 lg:h-10 3xl:w-24 3xl:h-24" })}
                    </div>
                    <p className="text-sm lg:text-base xl:text-xl 3xl:text-4xl 4xl:text-6xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                      {getProjectTech(viewingProject.id).stack}
                    </p>
                  </div>
                </section>

                <section className="space-y-6 lg:space-y-8 xl:space-y-10 3xl:space-y-20">
                  <div className="flex items-center gap-3 lg:gap-4 3xl:gap-6">
                    <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                      <Award className="w-5 h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 3xl:w-16 3xl:h-16 text-emerald-500" />
                    </div>
                    <h4 className="text-sm lg:text-base xl:text-xl 3xl:text-5xl 4xl:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Roadmap de Ejecución</h4>
                  </div>
                  <div className="space-y-4 lg:space-y-6 3xl:space-y-12">
                    {getProjectPhases(viewingProject.id).map((phase, i) => (
                      <div key={i} className="flex items-center gap-4 lg:gap-6 3xl:gap-12 group/phase">
                        <div className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 3xl:w-10 3xl:h-10 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] group-hover/phase:scale-125 transition-transform" />
                        <span className="text-xs lg:text-sm xl:text-lg 3xl:text-3xl 4xl:text-5xl font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest group-hover/phase:text-slate-900 dark:group-hover/phase:text-white transition-colors">{phase}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Project Owner Section */}
              <section className="pt-10 lg:pt-14 3xl:pt-24 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between bg-white/50 dark:bg-white/5 p-6 lg:p-8 3xl:p-14 rounded-[2rem] 3xl:rounded-[3.5rem] border border-slate-100 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-4 lg:gap-6 3xl:gap-12">
                    {getOwner(viewingProject.ownerId) ? (
                      <div className="relative group/owner">
                        <div className="absolute inset-0 bg-[#7b68ee]/20 blur-xl rounded-full scale-110 opacity-0 group-hover/owner:opacity-100 transition-opacity"></div>
                        <img src={getOwner(viewingProject.ownerId)?.avatar} alt="Owner" className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 3xl:w-40 3xl:h-40 rounded-full shadow-2xl border-4 border-white dark:border-slate-800 relative z-10" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 3xl:w-40 3xl:h-40 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-800">
                        <UserIcon className="w-6 h-6 lg:w-8 lg:h-8 3xl:w-16 3xl:h-16 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-[8px] lg:text-[10px] xl:text-[12px] 3xl:text-2xl font-black text-[#7b68ee] uppercase tracking-[0.3em] leading-none mb-2 lg:mb-3">Liderazgo de Producto</p>
                      <h5 className="text-sm lg:text-base xl:text-xl 3xl:text-5xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">{getOwner(viewingProject.ownerId)?.name || 'Sin asignar'}</h5>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg lg:text-xl xl:text-2xl 3xl:text-6xl font-black text-emerald-500">85% SCORE</span>
                    <p className="text-[8px] lg:text-[10px] xl:text-[12px] 3xl:text-2xl font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Salud Operativa</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Project Management Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? 'Configurar Centro de Operaciones' : 'Inaugurar Nuevo Proyecto'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificador del Proyecto</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Type className="h-5 w-5 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
              </div>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400"
                placeholder="Ej. Rediseño App Móvil"
              />
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Manifiesto y Objetivos</label>
            <div className="relative group">
              <div className="absolute top-4 left-4 pointer-events-none">
                <AlignLeft className="h-5 w-5 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
              </div>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400 resize-none"
                placeholder="Describe la visión, metas y el impacto esperado..."
              />
            </div>
          </div>

          {/* Owner Field */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Liderazgo Designado</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none border-r border-slate-200 dark:border-white/10 pr-4">
                <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
              </div>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="block w-full pl-16 pr-12 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest focus:ring-2 focus:ring-[#7b68ee] focus:outline-none appearance-none cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900">{u.name} — {u.role}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-8 border-t border-slate-100 dark:border-white/10 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-4 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-4 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#7b68ee]/20 flex justify-center items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              {editingProject ? 'Aplicar Cambios' : 'Desplegar Proyecto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;