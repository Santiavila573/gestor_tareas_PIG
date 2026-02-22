import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Task, User, TaskStatus, Priority } from '../models/types';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Play,
  X,
  ChevronRight,
  ChevronLeft,
  Layout,
  FileText,
  List,
  Zap,
  Users,
  MessageSquare,
  Bot,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Shield,
  Activity,
  Command,
  Search,
  MoreHorizontal,
  Award,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GlitchText } from './common/GlitchText';
import { TiltCard } from './common/TiltCard';
import { CountUp, TypingText, MagneticButton } from './common/Animations';

// --- Local Subcomponents ---

const TaskRow: React.FC<{ task: Task; onClick?: () => void }> = ({ task, onClick }) => (
  <div onClick={onClick} className="group flex items-center gap-4 p-3 hover:bg-[#7b68ee]/5 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer rounded-xl border border-transparent hover:border-[#7b68ee]/20 dark:hover:border-white/10 relative overflow-hidden">
    <div className={`w-5 h-5 rounded-full border-[2px] flex items-center justify-center flex-shrink-0 transition-all duration-300 ${task.status === TaskStatus.DONE
      ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
      : 'border-slate-300 dark:border-gray-600 group-hover:border-[#7b68ee]'
      }`}>
      {task.status === TaskStatus.DONE && <CheckCircle2 className="w-3 h-3 text-white stroke-[3]" />}
    </div>

    <div className="flex-1 min-w-0">
      <p className={`text-sm 2xl:text-xl 3xl:text-2xl 4xl:text-3xl font-medium transition-colors ${task.status === TaskStatus.DONE ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-gray-200 group-hover:text-[#7b68ee]'
        }`}>
        {task.title}
      </p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${task.priority === Priority.CRITICAL ? 'bg-red-500/10 text-red-500' :
          task.priority === Priority.HIGH ? 'bg-orange-500/10 text-orange-500' :
            task.priority === Priority.MEDIUM ? 'bg-blue-500/10 text-blue-500' :
              'bg-gray-500/10 text-gray-500'
          }`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`text-[10px] flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-slate-400'
            }`}>
            {format(new Date(task.dueDate), 'd MMM', { locale: es })}
          </span>
        )}
      </div>
    </div>
  </div>
);

const Video = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>
);

const FeatureWorkshopPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: "Tablero Ágil",
      description: "Visualiza el flujo de trabajo con nuestro tablero interactivo.",
      icon: <Layout className="w-10 h-10 text-[#7b68ee]" />,
      color: "bg-[#7b68ee]/10",
      accent: "text-[#7b68ee]"
    },
    {
      title: "Gestión Docs",
      description: "Organiza Word, Excel y PDF directamente en la plataforma.",
      icon: <FileText className="w-10 h-10 text-blue-500" />,
      color: "bg-blue-500/10",
      accent: "text-blue-500"
    },
    {
      title: "Sprints Pro",
      description: "Planifica tus metas y gestiona el backlog con precisión.",
      icon: <List className="w-10 h-10 text-green-500" />,
      color: "bg-green-500/10",
      accent: "text-green-500"
    },
    {
      title: "Chat & Colab",
      description: "Comunícate en tiempo real con tu equipo de trabajo.",
      icon: <MessageSquare className="w-10 h-10 text-orange-500" />,
      color: "bg-orange-500/10",
      accent: "text-orange-500"
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-8 sm:right-8 z-[100] w-auto sm:w-[380px] group animate-in slide-in-from-bottom-12 fade-in duration-700">
      {/* Floating Glass Island */}
      <div className="relative bg-white/90 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 dark:border-white/10 overflow-hidden flex flex-col p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_40px_120px_-20px_rgba(123,104,238,0.2)]">

        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7b68ee]/10 blur-[50px] rounded-full -mr-10 -mt-10" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-1.5 hover:bg-red-500/10 rounded-full transition-all text-slate-400 hover:text-red-500"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative flex items-center sm:items-start gap-4 sm:gap-5">
          <div className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 ${slides[currentSlide].color} rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-500 transform hover:rotate-3`}>
            {React.cloneElement(slides[currentSlide].icon as React.ReactElement, { className: "w-6 h-6 sm:w-10 sm:h-10 text-current" })}
          </div>

          <div className="flex-1 pt-0.5 min-w-0">
            <h3 className={`text-[10px] sm:text-xs font-black ${slides[currentSlide].accent} tracking-[0.2em] mb-0.5 sm:mb-1.5 uppercase flex items-center gap-2 truncate`}>
              <Sparkles className="w-3 h-3 animate-pulse" /> {slides[currentSlide].title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-bold leading-tight sm:leading-snug">
              {slides[currentSlide].description}
            </p>
          </div>
        </div>

        <div className="mt-4 sm:mt-8 flex items-center justify-between">
          <div className="flex gap-1 sm:gap-1.5">
            {slides.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-6 sm:w-8 bg-[#7b68ee]' : 'w-1.5 sm:w-2 bg-slate-200 dark:bg-white/10'}`}
              />
            ))}
          </div>

          <button
            onClick={currentSlide === slides.length - 1 ? onClose : nextSlide}
            className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#7b68ee] text-white hover:bg-[#6a5ad3] shadow-lg shadow-purple-500/20 transition-all active:scale-[0.95] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group/btn"
          >
            <span className="hidden sm:inline">{currentSlide === slides.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
            <span className="sm:hidden">{currentSlide === slides.length - 1 ? 'OK' : 'Sig.'}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Home Component ---

interface HomeProps {
  tasks: Task[];
  currentUser: User | null;
  onNewTask?: () => void;
  onStartMeeting?: () => void;
  onCreateDoc?: () => void;
  onNavigateTo?: (view: any) => void;
  onOpenTask?: (task: Task) => void;
}

const Home: React.FC<HomeProps> = ({ tasks, currentUser, onNewTask, onStartMeeting, onCreateDoc, onNavigateTo, onOpenTask }) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return tasks.filter(task => task.assigneeId === currentUser.id);
  }, [tasks, currentUser]);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE);
  }, [myTasks]);

  const nextTasks = useMemo(() => {
    return myTasks.filter(t => t.status !== TaskStatus.DONE && !overdueTasks.includes(t));
  }, [myTasks, overdueTasks]);

  const completedTasks = useMemo(() => {
    return myTasks.filter(t => t.status === TaskStatus.DONE);
  }, [myTasks]);

  const completionRate = useMemo(() => {
    if (myTasks.length === 0) return 0;
    return Math.round((completedTasks.length / myTasks.length) * 100);
  }, [myTasks.length, completedTasks.length]);

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-[#16171f]">
        <div className="text-center p-8 bg-white dark:bg-[#1e1e2d] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2b36]">
          <div className="w-16 h-16 bg-[#7b68ee]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#7b68ee]" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Inicia sesión para ver tu inicio.</p>
        </div>
      </div>
    );
  }

  // Mouse spotlight logic
  const gridRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!gridRef.current) return;
    const cards = gridRef.current.getElementsByClassName('spotlight-card');
    for (const card of cards as any) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`p-3 sm:p-4 md:p-6 lg:p-4 xl:p-8 3xl:p-12 4xl:p-16 max-w-full 2xl:max-w-screen-2xl 3xl:max-w-screen-3xl 4xl:max-w-screen-4xl mx-auto transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-12 gap-4 lg:gap-6 xl:gap-6 2xl:gap-10 3xl:gap-12 4xl:gap-16 auto-rows-[minmax(180px,auto)] 2xl:auto-rows-[minmax(220px,auto)] 3xl:auto-rows-[minmax(280px,auto)] 4xl:auto-rows-[minmax(340px,auto)]">

        {/* 1. Hero Welcome Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5 row-span-3">
          <TiltCard className="h-full rounded-[3rem] overflow-hidden group border border-slate-200 dark:border-white/5 bg-white dark:bg-mesh-purple transition-all duration-700 spotlight-card hover:shadow-[0_20px_60px_-15px_rgba(123,104,238,0.3)] hover:border-[#7b68ee]/40 dark:hover:border-[#7b68ee]/40 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7b68ee]/20 via-transparent to-pink-500/10 opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />
            <svg className="absolute -right-20 -top-20 w-96 h-96 text-[#7b68ee]/5 opacity-50 rotate-12" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M44.7,-76.4C58.2,-69.2,70.1,-58.5,78.1,-45.3C86.1,-32.1,90.2,-16,88.4,-0.9C86.7,14.1,79.1,28.2,69.5,40.1C59.9,52,48.3,61.7,35,68.8C21.7,75.9,6.7,80.4,-8.8,79.1C-24.3,77.8,-40.3,70.6,-53.4,60.5C-66.5,50.4,-76.7,37.3,-81.4,22.6C-86.1,7.9,-85.3,-8.4,-80.4,-23.1C-75.5,-37.8,-66.5,-50.9,-54.6,-58.7C-42.7,-66.5,-27.9,-69.1,-13.7,-74.3C0.5,-79.5,14,-87.3,31.2,-83.6C35.9,-82.6,40.3,-80.1,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>

            <div className="relative z-10 p-5 sm:p-8 md:p-12 xl:p-10 2xl:p-16 3xl:p-20 4xl:p-28 h-full flex flex-col justify-between">
              <div className="space-y-4 sm:space-y-6 md:space-y-8 xl:space-y-6 2xl:space-y-12 3xl:space-y-16">
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 2xl:px-6 2xl:py-3 rounded-full bg-white/80 dark:bg-[#7b68ee]/20 border border-indigo-100 dark:border-[#7b68ee]/40 backdrop-blur-xl text-[9px] sm:text-[10px] 2xl:text-base 3xl:text-xl font-black text-[#7b68ee] dark:text-white uppercase tracking-[0.2em] self-start shadow-xl">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 2xl:w-6 2xl:h-6 text-yellow-500 animate-pulse" />
                  <span>Portal Ágil 2.0</span>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  {/* Greeting line */}
                  <p className="text-sm sm:text-base 2xl:text-2xl font-medium text-slate-400 dark:text-white/30 tracking-[0.25em] uppercase flex items-center gap-2">
                    <span className="inline-block w-5 sm:w-8 h-px bg-gradient-to-r from-[#7b68ee] to-transparent"></span>
                    {greeting}
                    <span className="inline-block w-5 sm:w-8 h-px bg-gradient-to-l from-[#7b68ee] to-transparent"></span>
                  </p>

                  {/* Name — premium animated gradient */}
                  <h1 className="relative inline-block text-5xl sm:text-7xl md:text-8xl lg:text-7xl xl:text-8xl 2xl:text-[9rem] 3xl:text-[12rem] font-black tracking-tight leading-none select-none pb-3">
                    <GlitchText
                      text={currentUser.name.split(' ')[0]}
                      className="text-transparent bg-clip-text bg-gradient-to-br from-[#b8b0ff] via-[#7b68ee] to-[#c084fc] drop-shadow-[0_0_48px_rgba(123,104,238,0.6)] cursor-default"
                    />
                    {/* Underline accent */}
                    <span className="absolute -bottom-0 left-0 right-0 flex items-center gap-1">
                      <span className="h-[3px] rounded-full bg-gradient-to-r from-[#7b68ee] via-[#a78bfa] to-[#f0abfc] opacity-70 shadow-[0_0_14px_rgba(167,139,250,0.7)]" style={{ width: '72%' }}></span>
                      <span className="h-[3px] w-2.5 rounded-full bg-[#7b68ee]/25"></span>
                    </span>
                  </h1>

                  {/* Role badge */}
                  <div className="pt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 border border-[#7b68ee]/20 dark:border-[#7b68ee]/30 text-[10px] sm:text-xs font-bold text-[#7b68ee] dark:text-[#a89aff] uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7b68ee] animate-pulse"></span>
                      {currentUser.role}
                    </span>
                  </div>
                </div>
                <div className="max-w-xl xl:max-w-lg 2xl:max-w-4xl space-y-4">
                  <p className="text-sm sm:text-lg md:text-xl xl:text-lg 2xl:text-2xl 3xl:text-4xl text-slate-800/80 dark:text-indigo-100/70 font-medium leading-relaxed">
                    <TypingText text="Bienvenido a tu entorno de alto rendimiento. Las métricas están sincronizadas." speed={40} />
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 md:pt-10">
                <button onClick={() => setIsTourOpen(true)} className="group/btn relative px-6 py-3.5 sm:px-8 sm:py-4 2xl:px-12 2xl:py-6 bg-white text-[#7b68ee] rounded-xl sm:rounded-2xl font-black shadow-xl hover:scale-105 transition-all duration-500 flex items-center justify-center gap-3 overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 2xl:w-8 2xl:h-8 relative z-10 fill-current" />
                  <span className="relative z-10 text-sm sm:text-base 2xl:text-2xl">Iniciar Workshop</span>
                </button>
                <button onClick={() => onNavigateTo?.('team')} className="px-6 py-3.5 sm:px-8 sm:py-4 2xl:px-12 2xl:py-6 bg-[#7b68ee]/10 dark:bg-white/5 backdrop-blur-2xl border border-[#7b68ee]/30 dark:border-white/10 text-[#7b68ee] dark:text-white rounded-xl sm:rounded-2xl font-black hover:bg-[#7b68ee]/20 dark:hover:bg-white/10 transition-all duration-500 hover:scale-105 flex items-center justify-center gap-3 shadow-inner">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 2xl:w-8 2xl:h-8" />
                  <span className="text-sm sm:text-base 2xl:text-2xl">Squads</span>
                </button>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* 2. Quick Actions */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-4 row-span-3">
          <TiltCard className="h-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] p-6 sm:p-8 2xl:p-12 flex flex-col border border-slate-200 dark:border-white/10 transition-all duration-700 spotlight-card overflow-hidden hover:border-[#7b68ee]/50 hover:shadow-2xl hover:shadow-[#7b68ee]/10 group/actions">
            <div className="mb-6 md:mb-10 lg:mb-6 xl:mb-10">
              <h3 className="font-black text-xl sm:text-2xl 2xl:text-4xl mb-1 text-slate-900 dark:text-white flex items-center gap-3">
                <Zap className="w-6 h-6 text-[#7b68ee]" /> Acciones Rápidas
              </h3>
            </div>
            <div className="flex-1 space-y-4 2xl:space-y-8 relative z-20">
              {[
                { label: 'Nueva Tarea', icon: Sparkles, color: 'from-indigo-600 to-blue-700', action: onNewTask, desc: 'Añadir al backlog actual' },
                { label: 'Video Llamada', icon: Video, color: 'from-cyan-600 to-blue-600', action: onStartMeeting, desc: 'Sync diario de equipo' },
                { label: 'Documentación', icon: FileText, color: 'from-rose-600 to-indigo-700', action: onCreateDoc, desc: 'Generar hito técnico' }
              ].map((item, idx) => (
                <MagneticButton key={idx} onClick={item.action} className="w-full bg-slate-50 dark:bg-white/5 p-5 rounded-[2rem] flex items-center gap-5 border border-slate-200 dark:border-white/5 hover:border-[#7b68ee]/30 transition-all group/btn">
                  <div className={`relative w-12 h-12 flex items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-br ${item.color}`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm 2xl:text-2xl font-black text-slate-800 dark:text-white truncate">{item.label}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-white/40 truncate">{item.desc}</p>
                  </div>
                  <ChevronRight className="ml-auto text-slate-400 dark:text-white/20 flex-shrink-0" />
                </MagneticButton>
              ))}
            </div>
          </TiltCard>
        </div>

        {/* 3. Stats Done */}
        <div className="col-span-1 xl:col-span-3">
          <TiltCard className="h-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] p-8 flex flex-col justify-between border border-slate-200 dark:border-white/10 relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Tareas Done</p>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{completedTasks.length} <span className="text-sm text-slate-400 dark:opacity-40">/ {myTasks.length}</span></div>
              </div>
            </div>
            <div className="mt-8">
              <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" style={{ width: `${completionRate}%` }}></div>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* 3. Stats 2 - Rhythm */}
        <div className="col-span-1 xl:col-span-3">
          <TiltCard className="h-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] p-8 flex flex-col justify-between border border-slate-200 dark:border-white/10 relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">Ritmo</p>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{completionRate}%</div>
              </div>
            </div>
            <div className="mt-8">
              <div className="flex gap-1 h-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={`flex-1 rounded ${i / 10 * 100 < completionRate ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-white/5'}`}></div>
                ))}
              </div>
            </div>
          </TiltCard>
        </div>

        {/* 4. IA Pulse */}
        <div className="col-span-1 xl:col-span-4">
          <TiltCard className="h-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] p-10 border border-slate-200 dark:border-white/10 animate-scan transition-all duration-500 hover:border-[#7b68ee]/40">
            <div className="flex items-center gap-4">
              <div className="p-5 rounded-[2.5rem] bg-gradient-to-br from-[#7b68ee] to-indigo-800">
                <Zap className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-2xl">Radar IA</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tighter">Sincronización Activa</p>
              </div>
            </div>
            <div className="mt-12 p-6 bg-slate-50/80 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 text-center">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Salud del Sprint: Optima</p>
            </div>
          </TiltCard>
        </div>

        {/* Feature Shortcuts Grid */}
        <div className="col-span-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Layout, label: 'Kanban', color: 'purple', view: 'board' },
              { icon: MessageSquare, label: 'Chat', color: 'orange', view: 'chat' },
              { icon: FileText, label: 'Docs', color: 'blue', view: 'docs' },
              { icon: Bot, label: 'Asistente IA', color: 'pink', view: 'more' }
            ].map((feat, i) => (
              <TiltCard key={i} onClick={() => onNavigateTo?.(feat.view)} className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] p-6 flex flex-col items-center gap-4 border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 cursor-pointer transition-all hover:shadow-xl hover:shadow-[#7b68ee]/10 hover:border-[#7b68ee]/30">
                <feat.icon className={`w-8 h-8 text-[#7b68ee] dark:text-indigo-400`} />
                <span className="font-black text-slate-800 dark:text-white text-xs uppercase">{feat.label}</span>
              </TiltCard>
            ))}
          </div>
        </div>

        {/* 5. Calendar Widget */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-4">
          <TiltCard onClick={() => onNavigateTo?.('calendar')} className="h-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] p-8 border border-slate-200 dark:border-white/10 cursor-pointer relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30">
            <div className="flex justify-between items-start h-full flex-col">
              <div>
                <p className="text-xs font-black text-[#7b68ee] uppercase tracking-[0.2em] mb-2">Cronograma</p>
                <h3 className="text-6xl font-black text-slate-900 dark:text-white leading-none">{new Date().getDate()}</h3>
                <p className="text-4xl text-slate-500 dark:text-indigo-100/40 font-black capitalize mt-2">{format(new Date(), 'MMMM', { locale: es })}</p>
              </div>
              <div className="mt-8 flex items-center gap-3 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 p-4 rounded-2xl w-full border border-[#7b68ee]/10 dark:border-transparent">
                <Calendar className="w-6 h-6 text-[#7b68ee] dark:text-white" />
                <span className="text-xs font-black text-[#7b68ee] dark:text-white uppercase tracking-widest">Próxima Daily: 09:00 AM</span>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* 6. Operations Log */}
        <div className="col-span-1 md:col-span-4 lg:col-span-4 xl:col-span-12">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[3rem] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col transition-all duration-500">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <List className="w-8 h-8 text-[#7b68ee]" />
                <h3 className="font-black text-slate-900 dark:text-white text-2xl">Log de Operaciones</h3>
              </div>
            </div>
            <div className="p-8 space-y-4">
              {nextTasks.length === 0 ? (
                <p className="text-slate-300 dark:text-white/20 font-black uppercase text-center py-10">Perímetro Limpio</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nextTasks.slice(0, 8).map(task => (
                    <TaskRow key={task.id} task={task} onClick={() => onOpenTask?.(task)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Panel (Drawer) */}
      {isTourOpen && <FeatureWorkshopPanel onClose={() => setIsTourOpen(false)} />}
    </div>
  );
};

export default Home;
