import React, { useState } from 'react';
import {
    ClipboardList, CheckCircle2, Circle, Clock, AlertCircle,
    FileText, ShieldCheck, Rocket, Cpu, Flag, Link as LinkIcon,
    ChevronRight, Search, Filter, MoreVertical, Layout, Database,
    Shield, Terminal, Users, Target, X, Save, Share2
} from 'lucide-react';
import Modal from './common/Modal';

interface Artifact {
    id: string;
    name: string;
    description: string;
    status: 'Pending' | 'In Progress' | 'Reviewed' | 'Approved';
    ownerRole: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
}

interface Gate {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    artifacts: Artifact[];
}

interface DocumentViewerProps {
    artifact: Artifact;
    onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ artifact, onClose }) => {
    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={artifact.name}
            size="xl"
        >
            <div className="flex flex-col gap-8">
                {/* Content Area */}
                <div className="max-w-4xl mx-auto w-full space-y-8">
                    {/* simulation of a real document */}
                    <div className="bg-white dark:bg-white/[0.02] p-8 sm:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-white/5 space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 dark:border-white/5 pb-8 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-[#7b68ee] uppercase tracking-[0.2em]">Identificador Operativo</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{artifact.name}</p>
                            </div>
                            <div className="sm:text-right space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha de Emisión</p>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{artifact.dueDate}</p>
                            </div>
                        </div>

                        <div className="space-y-10 text-slate-600 dark:text-slate-300">
                            <section className="space-y-4">
                                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-[#7b68ee] rounded-full"></div>
                                    1. Resumen Estratégico
                                </h4>
                                <p className="text-sm leading-relaxed font-medium italic opacity-80">{artifact.description}</p>
                            </section>

                            <section className="space-y-4">
                                <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-[#7b68ee] rounded-full"></div>
                                    2. Especificaciones de Fase
                                </h4>
                                <div className="space-y-6">
                                    <p className="text-sm leading-relaxed">
                                        Este artefacto constituye una pieza crítica en la arquitectura del proyecto PIG 2026.
                                        El responsable asignado ({artifact.ownerRole}) ha validado la integridad de los datos presentados.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            'Validación de Estándares ISO',
                                            'Alineación Técnica Senior',
                                            'Integración con Core IA',
                                            'Optimización de Rendimiento'
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                                                <div className="w-2 h-2 rounded-full bg-[#7b68ee]"></div>
                                                <span className="text-xs font-black uppercase tracking-widest">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <div className="pt-10 mt-10 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-4">
                                <div className="w-48 h-px bg-slate-200 dark:bg-white/10"></div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma Autorizada Electrónica</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1 uppercase tracking-tight">{artifact.ownerRole}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-emerald-500/10 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Estado de Validación</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{artifact.status}</p>
                            </div>
                            <ShieldCheck className="w-10 h-10 text-emerald-500 opacity-40 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="bg-[#7b68ee]/5 border border-[#7b68ee]/20 p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-[#7b68ee]/10 transition-all">
                            <div>
                                <p className="text-[10px] font-black text-[#7b68ee] uppercase tracking-widest mb-1">Impacto Táctico</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{artifact.priority}</p>
                            </div>
                            <Target className="w-10 h-10 text-[#7b68ee] opacity-40 group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-4 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
                    >
                        Cerrar Visor
                    </button>
                    <button
                        className="flex-[2] px-8 py-4 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#7b68ee]/20 hover:shadow-2xl hover:shadow-[#7b68ee]/30 transition-all flex justify-center items-center gap-3 active:scale-95"
                    >
                        <Rocket className="w-5 h-5 animate-pulse" />
                        Desplegar a Siguiente Fase
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const GATES_DATA: Gate[] = [
    {
        id: 1,
        title: "PIG 1: Inicio (Launch)",
        description: "Definición estratégica y alineación inicial del proyecto.",
        icon: <Rocket className="w-6 h-6" />,
        artifacts: [
            { id: '1-1', name: 'Project Charter', description: 'Documento de visión y objetivos del proyecto.', status: 'Approved', ownerRole: 'Product Owner', dueDate: '2026-01-15', priority: 'High' },
            { id: '1-2', name: 'Stack Tecnológico', description: 'Definición de lenguajes, frameworks y herramientas.', status: 'Reviewed', ownerRole: 'Scrum Master', dueDate: '2026-01-20', priority: 'High' },
            { id: '1-3', name: 'Plan de Stakeholders', description: 'Identificación y matriz de influencia.', status: 'In Progress', ownerRole: 'Product Owner', dueDate: '2026-01-25', priority: 'Medium' }
        ]
    },
    {
        id: 2,
        title: "PIG 2: Definición (Design)",
        description: "Arquitectura técnica y refinamiento del backlog detallado.",
        icon: <Cpu className="w-6 h-6" />,
        artifacts: [
            { id: '2-1', name: 'Diagrama de Arquitectura', description: 'Esquema de servicios, base de datos y flujos.', status: 'In Progress', ownerRole: 'Desarrollador', dueDate: '2026-02-10', priority: 'High' },
            { id: '2-2', name: 'Definition of Done (DoD)', description: 'Criterios de calidad para considerar una tarea lista.', status: 'Pending', ownerRole: 'Scrum Master', dueDate: '2026-02-12', priority: 'Medium' },
            { id: '2-3', name: 'Bocetos de UI/UX', description: 'Diseños de alta fidelidad de las interfaces.', status: 'Pending', ownerRole: 'Desarrollador', dueDate: '2026-02-15', priority: 'High' }
        ]
    },
    {
        id: 3,
        title: "PIG 3: Ejecución (Build)",
        description: "Desarrollo iterativo, pruebas de calidad y revisiones técnicas.",
        icon: <ShieldCheck className="w-6 h-6" />,
        artifacts: [
            { id: '3-1', name: 'Reporte de QA', description: 'Resultados de pruebas unitarias y de integración.', status: 'Pending', ownerRole: 'Desarrollador', dueDate: '2026-03-20', priority: 'High' },
            { id: '3-2', name: 'Manual Técnico', description: 'Documentación para mantenimiento del sistema.', status: 'Pending', ownerRole: 'Desarrollador', dueDate: '2026-03-25', priority: 'Low' },
            { id: '3-3', name: 'Plan de Despliegue', description: 'Pasos para el paso a producción.', status: 'Pending', ownerRole: 'Scrum Master', dueDate: '2026-03-30', priority: 'Medium' }
        ]
    },
    {
        id: 4,
        title: "PIG 4: Cierre (Close)",
        description: "Formalización de entrega y lecciones aprendidas.",
        icon: <Flag className="w-6 h-6" />,
        artifacts: [
            { id: '4-1', name: 'Acta de Aceptación', description: 'Firma de conformidad por parte del cliente.', status: 'Pending', ownerRole: 'Product Owner', dueDate: '2026-04-10', priority: 'High' },
            { id: '4-2', name: 'Lecciones Aprendidas', description: 'Feedback del equipo sobre el proceso PIG.', status: 'Pending', ownerRole: 'Scrum Master', dueDate: '2026-04-12', priority: 'Medium' },
            { id: '4-3', name: 'Cierre de Presupuesto', description: 'Deducción final de costos y recursos.', status: 'Pending', ownerRole: 'Product Owner', dueDate: '2026-04-15', priority: 'Low' }
        ]
    }
];

const ArtifactRepository: React.FC = () => {
    const [activeGate, setActiveGate] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

    const currentGate = GATES_DATA.find(g => g.id === activeGate) || GATES_DATA[0];

    const getStatusStyle = (status: Artifact['status']) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Reviewed': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            case 'In Progress': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
        }
    };

    const getPriorityStyle = (priority: Artifact['priority']) => {
        switch (priority) {
            case 'High': return 'text-red-600 dark:text-red-400';
            case 'Medium': return 'text-orange-600 dark:text-orange-400';
            default: return 'text-blue-600 dark:text-blue-400';
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-full bg-[#f8f9fc] dark:bg-[#0b0c14] overflow-hidden relative font-jakarta">
            {/* Mobile Header Toggle */}
            <div className="lg:hidden h-16 bg-white dark:bg-[#161922] border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-6 z-30">
                <div className="flex items-center gap-2">
                    <ClipboardList className="text-[#7b68ee] w-5 h-5" />
                    <span className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Hitos & Artefactos</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-600 dark:text-slate-400"
                >
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Sidebar de Gates */}
            <div className={`
        fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-10
        ${isSidebarCollapsed ? 'w-0 lg:w-0 overflow-hidden opacity-0' : 'w-full lg:w-80 xl:w-96 3xl:w-[450px] opacity-100'}
        bg-white dark:bg-[#161922] border-r border-slate-200 dark:border-white/5 
        flex flex-col pt-8 lg:pt-8 transition-all duration-500 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="lg:hidden absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="px-6 3xl:px-10 mb-6 xl:mb-8 3xl:mb-12 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl lg:text-lg xl:text-2xl 3xl:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2 3xl:gap-4">
                            <ClipboardList className="text-[#7b68ee] w-6 h-6 lg:w-5 lg:h-5 xl:w-7 xl:h-7 3xl:w-12 3xl:h-12" /> Hitos & Artefactos
                        </h2>
                        <p className="text-sm lg:text-[11px] xl:text-xs 3xl:text-lg text-slate-500 dark:text-slate-400 mt-1 3xl:mt-3 font-medium italic opacity-80 leading-tight">
                            Gestión estratégica por fase
                        </p>
                    </div>
                    <button
                        onClick={() => setIsSidebarCollapsed(true)}
                        className="hidden lg:flex p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
                        title="Contraer panel"
                    >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                </div>

                <nav className="flex-1 px-4 3xl:px-8 space-y-3 xl:space-y-4 3xl:space-y-6 overflow-y-auto custom-scrollbar pb-6">
                    {GATES_DATA.map((gate) => (
                        <button
                            key={gate.id}
                            onClick={() => { setActiveGate(gate.id); setIsSidebarOpen(false); }}
                            className={`w-full group flex flex-col p-5 xl:p-6 3xl:p-10 rounded-3xl 3xl:rounded-[2.5rem] transition-all duration-500 border relative overflow-hidden ${activeGate === gate.id
                                ? 'bg-gradient-to-br from-[#7b68ee] to-[#6a5acd] border-[#7b68ee] text-white shadow-xl shadow-[#7b68ee]/30 scale-[1.02]'
                                : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-4 3xl:gap-6 mb-3 xl:mb-4 relative z-10">
                                <div className={`p-2.5 xl:p-3 3xl:p-5 rounded-2xl transition-colors duration-500 ${activeGate === gate.id ? 'bg-white/20' : 'bg-[#7b68ee]/10 text-[#7b68ee]'
                                    }`}>
                                    {React.cloneElement(gate.icon as React.ReactElement, { className: 'w-5 h-5 xl:w-6 xl:h-6 3xl:w-10 3xl:h-10' })}
                                </div>
                                <span className="font-black text-sm xl:text-base 3xl:text-2xl uppercase tracking-tight leading-tight">{gate.title}</span>
                            </div>
                            <p className={`text-[11px] xl:text-xs 3xl:text-lg leading-relaxed xl:leading-loose text-left relative z-10 font-medium ${activeGate === gate.id ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                {gate.description}
                            </p>
                            {activeGate === gate.id && (
                                <div className="absolute top-0 right-0 p-4 3xl:p-8 opacity-20 transform translate-x-1 translate-y--1">
                                    <ChevronRight className="w-12 h-12 3xl:w-20 3xl:h-20" />
                                </div>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-6 3xl:p-10 mt-auto border-t border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-black/10 shrink-0">
                    <div className="flex items-center justify-between mb-2 3xl:mb-4">
                        <span className="text-[10px] 3xl:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ritmo del Proyecto</span>
                        <span className="text-xs 3xl:text-lg font-black text-[#7b68ee]">Gate 2 - 45%</span>
                    </div>
                    <div className="h-2 3xl:h-4 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[45%] bg-[#7b68ee] rounded-full shadow-[0_0_15px_rgba(123,104,238,0.4)] animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Área Principal de Artefactos */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
                {/* Header de Artefactos */}
                <header className="min-h-[80px] lg:h-20 3xl:h-32 bg-white dark:bg-[#161922] border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between px-4 lg:px-8 xl:px-12 3xl:px-20 py-4 md:py-0 gap-4 shrink-0 transition-all duration-300">
                    <div className="flex items-center gap-3 xl:gap-4 3xl:gap-8 w-full md:w-auto">
                        {isSidebarCollapsed && (
                            <button
                                onClick={() => setIsSidebarCollapsed(false)}
                                className="p-2.5 bg-[#7b68ee] text-white rounded-xl shadow-lg shadow-[#7b68ee]/30 hover:scale-105 transition-all active:scale-95"
                                title="Expandir panel"
                            >
                                <Filter className="w-4 h-4 2xl:w-5 2xl:h-5" />
                            </button>
                        )}
                        <div className="p-2 3xl:p-5 bg-[#7b68ee]/10 text-[#7b68ee] rounded-xl 3xl:rounded-2xl hidden sm:block">
                            {React.cloneElement(currentGate.icon as React.ReactElement, { className: 'w-5 h-5 3xl:w-12 3xl:h-12' })}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-tight text-sm lg:text-base xl:text-lg 3xl:text-4xl truncate lg:whitespace-normal">{currentGate.title}</h3>
                            <p className="text-[9px] xl:text-[10px] 3xl:text-lg text-slate-500 dark:text-slate-400 font-bold mt-0.5 3xl:mt-3 uppercase tracking-widest leading-tight">Documentación de validación técnica</p>
                        </div>
                    </div>

                    <div className="relative flex-1 md:flex-none group">
                        <Search className="w-4 h-4 3xl:w-8 3xl:h-8 absolute left-4 3xl:left-6 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#7b68ee]" />
                        <input
                            type="text"
                            placeholder="Buscar documento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 3xl:pl-20 pr-4 py-2.5 3xl:py-6 bg-slate-50 dark:bg-[#0f0f15] border border-slate-200 dark:border-[#7b68ee]/20 rounded-full text-xs xl:text-sm 3xl:text-2xl focus:ring-2 focus:ring-[#7b68ee]/40 focus:border-[#7b68ee]/40 focus:outline-none dark:text-white w-full md:w-56 xl:w-72 3xl:w-[500px] transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-5 pr-12 xl:pr-14 3xl:pr-24 py-2.5 3xl:py-6 bg-slate-50 dark:bg-[#0f0f15] border border-slate-200 dark:border-[#7b68ee]/40 rounded-full text-[11px] xl:text-sm 3xl:text-2xl font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7b68ee]/40 cursor-pointer hover:border-[#7b68ee]/60 transition-all active:scale-95"
                        >
                            <option value="All" className="bg-white dark:bg-[#1a1d28]">Todos</option>
                            <option value="Approved" className="bg-white dark:bg-[#1a1d28]">Aprobados</option>
                            <option value="Reviewed" className="bg-white dark:bg-[#1a1d28]">Revisados</option>
                            <option value="In Progress" className="bg-white dark:bg-[#1a1d28]">Progreso</option>
                            <option value="Pending" className="bg-white dark:bg-[#1a1d28]">Pendientes</option>
                        </select>
                        <ChevronRight className="w-4 h-4 3xl:w-8 3xl:h-8 absolute right-4 3xl:right-8 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                    </div>
                </header>

                {/* Lista de Artefactos */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 xl:p-12 2xl:p-16 3xl:p-24 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                    <div className={`grid grid-cols-1 gap-4 lg:gap-6 xl:gap-8 3xl:gap-14 pb-32 ${isSidebarCollapsed
                        ? 'lg:grid-cols-2 4xl:grid-cols-3'
                        : '2xl:grid-cols-2 4xl:grid-cols-3'
                        }`}>
                        {currentGate.artifacts
                            .filter(a => statusFilter === 'All' || a.status === statusFilter)
                            .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((artifact) => (
                                <div
                                    key={artifact.id}
                                    className="group bg-white dark:bg-[#1a1d28] p-5 lg:p-6 xl:p-8 3xl:p-12 rounded-[2.5rem] 3xl:rounded-[4rem] border border-slate-200 dark:border-white/5 hover:border-[#7b68ee]/40 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-[#7b68ee]/10 flex flex-col relative overflow-hidden"
                                >
                                    {/* Background Decor */}
                                    <div className="absolute -top-12 -right-12 3xl:-top-24 3xl:-right-24 w-24 h-24 3xl:w-48 3xl:h-48 bg-[#7b68ee]/5 rounded-full blur-3xl group-hover:bg-[#7b68ee]/10 transition-colors" />

                                    <div className="flex justify-between items-start mb-6 3xl:mb-10 relative z-10">
                                        <div className="flex items-center gap-4 3xl:gap-8">
                                            <div className="p-4 3xl:p-8 bg-slate-50 dark:bg-white/5 rounded-3xl 3xl:rounded-[2.5rem] group-hover:scale-110 group-hover:bg-[#7b68ee] group-hover:text-white transition-all duration-500 shadow-sm">
                                                <FileText className="w-6 h-6 xl:w-7 xl:h-7 3xl:w-14 3xl:h-14" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-base xl:text-lg 3xl:text-3xl lg:text-md">{artifact.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2 3xl:gap-4 mt-1.5 3xl:mt-3">
                                                    <span className={`text-[8px] xl:text-[9px] 3xl:text-base font-black uppercase tracking-widest px-2.5 3xl:px-5 py-1 3xl:py-2 border rounded-full backdrop-blur-md ${getStatusStyle(artifact.status)}`}>
                                                        {artifact.status}
                                                    </span>
                                                    <span className="text-[9px] xl:text-[10px] 3xl:text-base text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight italic">Entrega: {artifact.dueDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 3xl:p-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-50 dark:bg-white/5 rounded-xl 3xl:rounded-2xl">
                                            <MoreVertical className="w-5 h-5 3xl:w-10 3xl:h-10" />
                                        </button>
                                    </div>

                                    <p className="text-xs xl:text-sm 3xl:text-xl text-slate-500 dark:text-slate-400 leading-relaxed 3xl:leading-relaxed mb-8 3xl:mb-14 font-medium italic opacity-90 relative z-10">
                                        {artifact.description}
                                    </p>

                                    <div className="flex flex-wrap items-center justify-between gap-6 pt-6 lg:pt-8 3xl:pt-12 border-t border-slate-100 dark:border-white/5 mt-auto relative z-10">
                                        <div className="flex flex-wrap items-center gap-5 3xl:gap-10">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] xl:text-[9px] 3xl:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 3xl:mb-2">Responsable</span>
                                                <span className="text-[10px] xl:text-[11px] 3xl:text-lg font-black text-slate-700 dark:text-slate-300 flex items-center gap-2 3xl:gap-4">
                                                    <div className="w-5 h-5 3xl:w-10 3xl:h-10 rounded-full bg-[#7b68ee]/20 flex items-center justify-center">
                                                        <Users className="w-3 h-3 3xl:w-6 3xl:h-6 text-[#7b68ee]" />
                                                    </div>
                                                    {artifact.ownerRole}
                                                </span>
                                            </div>
                                            <div className="w-px h-10 3xl:h-20 bg-slate-100 dark:bg-white/10 hidden sm:block" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] xl:text-[9px] 3xl:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 3xl:mb-2">Prioridad</span>
                                                <span className={`text-[10px] xl:text-[11px] 3xl:text-lg font-black flex items-center gap-2 3xl:gap-4 ${getPriorityStyle(artifact.priority)}`}>
                                                    <div className="p-1 3xl:p-2 bg-black/5 dark:bg-white/5 rounded-lg 3xl:rounded-xl">
                                                        <Target className="w-3 h-3 3xl:w-6 3xl:h-6" />
                                                    </div>
                                                    {artifact.priority}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedArtifact(artifact)}
                                            className="flex-1 sm:flex-none min-w-[140px] flex items-center justify-center gap-3 3xl:gap-5 px-6 3xl:px-12 py-3 3xl:py-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl 3xl:rounded-[2rem] text-[10px] xl:text-xs 3xl:text-xl font-black text-slate-600 dark:text-slate-300 hover:bg-[#7b68ee] hover:text-white hover:border-[#7b68ee] hover:shadow-lg hover:shadow-[#7b68ee]/30 transition-all active:scale-95 group/btn whitespace-nowrap"
                                        >
                                            <LinkIcon className="w-4 h-4 3xl:w-8 3xl:h-8 group-hover/btn:rotate-12 transition-transform" />
                                            <span>Abrir Documento</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </main>
            </div>

            {/* Document Viewer Modal */}
            {selectedArtifact && (
                <DocumentViewer
                    artifact={selectedArtifact}
                    onClose={() => setSelectedArtifact(null)}
                />
            )}
        </div>
    );
};

export default ArtifactRepository;
