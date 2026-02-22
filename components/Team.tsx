import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { Plus, Edit2, Trash2, User as UserIcon, Shield, X, Save, Search, Code, Briefcase, UserCog, Image as ImageIcon, ShieldCheck, Award, ChevronRight } from 'lucide-react';
import Modal from './common/Modal';

interface TeamProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  highlightedUserId?: string | null;
  onClearHighlight?: () => void;
}

const Team: React.FC<TeamProps> = ({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  highlightedUserId,
  onClearHighlight
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const RoleDetails: Record<Role, { title: string, description: string, responsibilities: string[] }> = {
    [Role.SCRUM_MASTER]: {
      title: "Scrum Master",
      description: "El Scrum Master es el facilitador del equipo ágil, responsable de asegurar que el proceso Scrum sea comprendido y seguido por todos.",
      responsibilities: [
        "Eliminar impedimentos que bloqueen el progreso del equipo.",
        "Facilitar las reuniones de Sprint (Daily, Planning, Review, Retrospective).",
        "Proteger al equipo de interferencias externas para mantener el enfoque.",
        "Fomentar la cultura de mejora continua y auto-organización."
      ]
    },
    [Role.PRODUCT_OWNER]: {
      title: "Product Owner",
      description: "El Product Owner es el responsable de maximizar el valor del producto y de gestionar el flujo de trabajo hacia el equipo.",
      responsibilities: [
        "Definir y priorizar el Product Backlog según el valor de negocio.",
        "Asegurar que el equipo comprenda claramente los objetivos del proyecto.",
        "Actuar como enlace principal entre los stakeholders y el equipo técnico.",
        "Validar que las funcionalidades entregadas cumplan con los criterios de aceptación."
      ]
    },
    [Role.DEVELOPER]: {
      title: "Desarrollador",
      description: "Los desarrolladores son los profesionales encargados de transformar las ideas y requerimientos en software funcional y de alta calidad.",
      responsibilities: [
        "Diseñar, codificar y probar nuevas funcionalidades del sistema.",
        "Colaborar con otros miembros en revisiones de código y arquitectura.",
        "Estimar el esfuerzo técnico para las tareas del sprint.",
        "Mantener la excelencia técnica y la calidad del código fuente."
      ]
    },
    [Role.SYSTEM_ADMIN]: {
      title: "Administrador del Sistema",
      description: "Encargado de la infraestructura, permisos globales y la configuración técnica de la plataforma.",
      responsibilities: [
        "Gestionar accesos y niveles de seguridad para todos los usuarios.",
        "Configurar integraciones externas y herramientas del ecosistema.",
        "Monitorear el rendimiento y la estabilidad de la plataforma.",
        "Brindar soporte técnico avanzado al resto del equipo."
      ]
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: Role.DEVELOPER,
    avatar: ''
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        role: user.role,
        avatar: user.avatar
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        role: Role.DEVELOPER,
        avatar: `https://picsum.photos/200?random=${Date.now()}` // Default random avatar
      });
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (highlightedUserId) {
      const user = users.find(u => u.id === highlightedUserId);
      if (user) {
        handleOpenModal(user);
        if (onClearHighlight) onClearHighlight();
      }
    }
  }, [highlightedUserId, users, onClearHighlight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      avatar: formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
    };

    if (editingUser) {
      onUpdateUser({ ...editingUser, ...submitData });
    } else {
      onAddUser(submitData);
    }
    setIsModalOpen(false);
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.SCRUM_MASTER: return <UserCog className="w-4 h-4" />;
      case Role.PRODUCT_OWNER: return <Briefcase className="w-4 h-4" />;
      case Role.DEVELOPER: return <Code className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.SCRUM_MASTER: return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case Role.PRODUCT_OWNER: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case Role.DEVELOPER: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 3xl:p-10 4xl:p-14 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl 3xl:text-6xl 4xl:text-7xl font-bold text-slate-900 dark:text-white">Equipo</h1>
          <p className="text-slate-600 dark:text-slate-400 3xl:text-2xl 4xl:text-3xl">Gestiona los miembros, roles y permisos del proyecto.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar miembro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 3xl:py-3.5 4xl:py-4.5 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-xl text-sm 3xl:text-base 4xl:text-lg focus:outline-none focus:ring-2 focus:ring-[#7b68ee] text-slate-700 dark:text-slate-200 shadow-sm placeholder-slate-400"
            />
          </div>
          {currentUser?.role === 'Scrum Master' && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-[#7b68ee] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#6b58de] transition-all shadow-lg shadow-[#7b68ee]/20 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo Miembro</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-6 3xl:gap-10 4xl:gap-14 pb-20">
        {filteredUsers.map((user, index) => (
          <div
            key={user.id}
            onClick={() => setViewingUser(user)}
            style={{ animationDelay: `${index * 100}ms` }}
            className="glass-premium rounded-2xl 3xl:rounded-[2rem] 4xl:rounded-[3rem] shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 3xl:p-10 4xl:p-14 flex flex-col items-center group relative overflow-hidden animate-in fade-in-up fill-mode-backwards cursor-pointer"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-24 3xl:h-40 4xl:h-52 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 z-0"></div>

            {/* Actions */}
            {currentUser?.role === 'Scrum Master' && (
              <div className="absolute top-3 right-3 3xl:top-6 3xl:right-6 flex gap-2 3xl:gap-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenModal(user);
                  }}
                  className="p-2 3xl:p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 hover:text-[#7b68ee] dark:text-slate-400 dark:hover:text-[#a89aff] rounded-lg 3xl:rounded-xl shadow-sm hover:shadow border border-slate-200/50 dark:border-slate-700 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5 3xl:w-6 3xl:h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteUser(user.id);
                  }}
                  className="p-2 3xl:p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg 3xl:rounded-xl shadow-sm hover:shadow border border-slate-200/50 dark:border-slate-700 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 3xl:w-6 3xl:h-6" />
                </button>
              </div>
            )}

            {/* Avatar */}
            <div className="relative z-10 mb-4 mt-4 3xl:mb-8 3xl:mt-8">
              <div className="w-24 h-24 3xl:w-40 3xl:h-40 4xl:w-52 4xl:h-52 rounded-full p-1 3xl:p-2 bg-white dark:bg-slate-900 shadow-lg">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover border border-slate-100 dark:border-slate-800"
                />
              </div>
              <div className="absolute bottom-1 right-1 3xl:bottom-3 3xl:right-3 w-5 h-5 3xl:w-8 3xl:h-8 bg-green-500 border-2 3xl:border-4 border-white dark:border-slate-900 rounded-full" title="Online"></div>
            </div>

            {/* Content */}
            <div className="text-center z-10 w-full">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg 3xl:text-3xl 4xl:text-4xl mb-1 3xl:mb-3">{user.name}</h3>

              <div className={`inline-flex items-center gap-1.5 3xl:gap-3 px-3 py-1 3xl:px-6 3xl:py-2.5 rounded-full text-xs 3xl:text-xl 4xl:text-2xl font-semibold border mb-4 3xl:mb-8 ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
                {user.role}
              </div>

              <div className="w-full pt-4 3xl:pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-6 3xl:gap-12">
                <div className="text-center">
                  <span className="block font-bold text-slate-700 dark:text-slate-300 text-sm 3xl:text-2xl 4xl:text-3xl">12</span>
                  <span className="text-[10px] 3xl:text-lg 4xl:text-xl text-slate-500 dark:text-slate-500 uppercase tracking-tighter">Tareas</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-slate-700 dark:text-slate-300 text-sm 3xl:text-2xl 4xl:text-3xl">98%</span>
                  <span className="text-[10px] 3xl:text-lg 4xl:text-xl text-slate-500 dark:text-slate-500 uppercase tracking-tighter">Eficacia</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-block p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-4">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">No se encontraron miembros</p>
          </div>
        )}
      </div>

      {/* Member Viewer Modal */}
      {viewingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[60] flex items-center justify-center p-8 lg:p-16 3xl:p-24 4xl:p-32 animate-in fade-in duration-300">
          <div className="bg-white/95 dark:bg-[#1a1b26]/95 backdrop-blur-3xl rounded-[3rem] 4xl:rounded-[4rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.6)] w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl 3xl:max-w-5xl 4xl:max-w-7xl max-h-[85vh] overflow-hidden border border-white/20 dark:border-white/5 relative transform animate-in zoom-in-95 duration-500 flex flex-col">
            {/* Action Header */}
            <div className="absolute top-6 right-6 3xl:top-10 3xl:right-10 z-20 flex gap-4 3xl:gap-6">
              {currentUser?.role === 'Scrum Master' && (
                <button
                  onClick={() => {
                    handleOpenModal(viewingUser);
                    setViewingUser(null);
                  }}
                  className="p-4 bg-white/20 hover:bg-[#7b68ee] text-white rounded-2xl backdrop-blur-md transition-all border border-white/20 shadow-xl active:scale-95"
                >
                  <Edit2 className="w-5 h-5 3xl:w-10 3xl:h-10" />
                </button>
              )}
              <button
                onClick={() => setViewingUser(null)}
                className="p-4 bg-black/20 hover:bg-red-500/80 text-white rounded-2xl backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95 shadow-xl border border-white/10"
              >
                <X className="w-5 h-5 3xl:w-10 3xl:h-10" />
              </button>
            </div>

            {/* Profile Hero */}
            <div className="relative h-44 lg:h-56 xl:h-64 3xl:h-96 4xl:h-[500px] shrink-0 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-700 opacity-80 ${getRoleColor(viewingUser.role).split(' ')[0]}`}></div>
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[4px]"></div>

              {/* Decorative Glow */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 blur-[100px] rounded-full"></div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center w-full z-10">
                <div className="relative group/avatar">
                  <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-110 animate-pulse"></div>
                  <div className="w-20 h-20 lg:w-28 lg:h-28 xl:w-36 xl:h-36 3xl:w-64 3xl:h-64 4xl:w-80 4xl:h-80 rounded-full border-4 lg:border-8 border-white/20 p-1 lg:p-2 3xl:p-3 mb-4 3xl:mb-10 shadow-3xl relative overflow-hidden transition-transform duration-500 group-hover/avatar:scale-105">
                    <img src={viewingUser.avatar} alt={viewingUser.name} className="w-full h-full rounded-full object-cover" />
                  </div>
                </div>
                <h2 className="text-2xl lg:text-3xl xl:text-4xl 3xl:text-7xl 4xl:text-9xl font-black text-white text-center leading-none tracking-tight uppercase tracking-[-0.02em]">{viewingUser.name}</h2>
                <div className={`mt-4 3xl:mt-10 px-6 py-2 lg:px-8 lg:py-2.5 rounded-2xl text-[10px] lg:text-[12px] 3xl:text-3xl 4xl:text-5xl font-black uppercase tracking-[0.3em] border backdrop-blur-2xl ${getRoleColor(viewingUser.role)} shadow-2xl ring-4 ring-white/5`}>
                  {viewingUser.role}
                </div>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="p-8 lg:p-12 xl:p-16 3xl:p-24 4xl:p-40 space-y-10 lg:space-y-14 3xl:space-y-20 4xl:space-y-32 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-white/30 to-white/0 dark:from-white/5 dark:to-transparent">
              <section className="space-y-4 lg:space-y-6 3xl:space-y-12">
                <div className="flex items-center gap-3 lg:gap-4 3xl:gap-6">
                  <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                    <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 3xl:w-16 3xl:h-16 text-[#7b68ee]" />
                  </div>
                  <h4 className="text-sm lg:text-base xl:text-xl 3xl:text-5xl 4xl:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Visión Estratégica del Rol</h4>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm lg:text-base xl:text-lg 3xl:text-4xl 4xl:text-6xl font-black opacity-90 italic border-l-4 lg:border-l-8 border-[#7b68ee]/30 pl-6 lg:pl-8 3xl:pl-16 ml-2">
                  "{RoleDetails[viewingUser.role]?.description || 'Responsable de la ejecución técnica y estratégica del proyecto.'}"
                </p>
              </section>

              <section className="space-y-6 lg:space-y-10 xl:space-y-12 3xl:space-y-24">
                <div className="flex items-center gap-3 lg:gap-4 3xl:gap-6">
                  <div className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm">
                    <Award className="w-5 h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 3xl:w-16 3xl:h-16 text-emerald-500" />
                  </div>
                  <h4 className="text-sm lg:text-base xl:text-xl 3xl:text-5xl 4xl:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">Despliegue de Responsabilidades</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 3xl:gap-14 4xl:gap-24">
                  {(RoleDetails[viewingUser.role]?.responsibilities || ["Liderar con excelencia.", "Asegurar la calidad.", "Colaboración proactiva."]).map((resp, i) => (
                    <div key={i} className="flex gap-4 lg:gap-6 3xl:gap-12 p-6 lg:p-8 3xl:p-14 rounded-3xl lg:rounded-[2.5rem] 3xl:rounded-[3.5rem] bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-[#7b68ee]/40 transition-all group/resp shadow-xl hover:shadow-2xl hover:-translate-y-1">
                      <div className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 3xl:w-8 3xl:h-8 rounded-full bg-[#7b68ee]/20 flex items-center justify-center mt-1 3xl:mt-2 shrink-0">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 3xl:w-4 3xl:h-4 rounded-full bg-[#7b68ee]" />
                      </div>
                      <p className="text-[11px] lg:text-[13px] xl:text-base 3xl:text-3xl 4xl:text-5xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-snug">{resp}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Stats Footer in Modal */}
              <div className="grid grid-cols-3 gap-6 pt-10 lg:pt-14 3xl:pt-24 border-t border-slate-200 dark:border-white/10">
                <div className="text-center group/stat">
                  <span className="block text-xl lg:text-3xl xl:text-4xl 3xl:text-8xl 4xl:text-[10rem] font-black text-[#7b68ee] transition-transform group-hover/stat:scale-110">12</span>
                  <span className="text-[8px] lg:text-[10px] xl:text-[12px] 3xl:text-3xl 4xl:text-5xl font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Misiones</span>
                </div>
                <div className="text-center group/stat">
                  <span className="block text-xl lg:text-3xl xl:text-4xl 3xl:text-8xl 4xl:text-[10rem] font-black text-emerald-500 transition-transform group-hover/stat:scale-110">98%</span>
                  <span className="text-[8px] lg:text-[10px] xl:text-[12px] 3xl:text-3xl 4xl:text-5xl font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Eficacia</span>
                </div>
                <div className="text-center group/stat">
                  <span className="block text-xl lg:text-3xl xl:text-4xl 3xl:text-8xl 4xl:text-[10rem] font-black text-blue-500 transition-transform group-hover/stat:scale-110">2.4k</span>
                  <span className="text-[8px] lg:text-[10px] xl:text-[12px] 3xl:text-3xl 4xl:text-5xl font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Poder</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Miembro de Élite' : 'Reclutar Nuevo Miembro'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nombre del Agente</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
              </div>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400"
                placeholder="Ej. Ana García"
              />
            </div>
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Asignación Operativa</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
              </div>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="block w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest focus:ring-2 focus:ring-[#7b68ee] focus:outline-none appearance-none cursor-pointer"
              >
                {Object.values(Role).map(role => (
                  <option key={role} value={role} className="bg-white dark:bg-slate-900">{role}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>

          {/* Avatar Field */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Firma Visual (Avatar URL)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <ImageIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
              </div>
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400"
                placeholder="https://ejemplo.com/identidad_visual.jpg"
              />
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">El sistema generará una identidad si este campo permanece vacío.</p>
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
              {editingUser ? 'Actualizar Ficha' : 'Reclutar Agente'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Team;