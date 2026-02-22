import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, X, Send, Bot, Loader2, FileDown, BarChart2, FileText,
  AlertTriangle, Zap, Lock, Calendar, Trash2, Sparkles, ChevronDown,
  Mic, MicOff, Copy, Check, Gamepad2, Target, Trophy, Brain, Ghost,
  History, Lightbulb, Rocket, Coffee, Globe, Maximize2, ClipboardCopy, ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { generateScrumAdvice } from '../services/geminiService';
import { ReportService } from '../services/reportService';
import { ExcelReportService } from '../services/excelReportService';
import { PDFReportService } from '../services/pdfReportService';
import { getAllRecordingsMeta, getRecordingTranscript } from '../services/recordingService';
import { Task, Sprint, User, ChatMessage, Priority, TaskStatus } from '../types';
import { MOCK_INCIDENTS, MOCK_AUDIT_LOGS, MOCK_COMPLIANCE_AUDITS } from '../constants';

import { addDays, isSameDay, format, parseISO, startOfToday, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Helper Components ---

const CodeBlock: React.FC<{ language: string, code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-sm group">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#7b68ee] transition-colors bg-white dark:bg-slate-700 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <div className="p-3 overflow-x-auto custom-scrollbar">
        <code className="text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre font-medium leading-relaxed">
          {code}
        </code>
      </div>
    </div>
  );
};

const TypewriterText = ({ text, onComplete, shouldAnimate = true }: { text: string, onComplete?: () => void, shouldAnimate?: boolean }) => {
  const [displayedText, setDisplayedText] = useState(shouldAnimate ? '' : text);
  const hasCompleted = useRef(!shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate || hasCompleted.current) {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    // Faster typing speed: 5ms
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        hasCompleted.current = true;
        onComplete?.();
      }
    }, 5);
    return () => clearInterval(timer);
  }, [text, shouldAnimate, onComplete]);

  return <>{displayedText}</>;
};

interface AIChatbotProps {
  tasks: Task[];
  sprints: Sprint[];
  users: User[];
  projects?: any[];
  roadmapItems?: any[];
  retroItems?: any[];
  currentUser: User | null;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  externalQuery?: string | null;
  onQueryHandled?: () => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({
  tasks,
  sprints,
  users,
  projects = [],
  roadmapItems = [],
  retroItems = [],
  currentUser,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  externalQuery,
  onQueryHandled
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [interimInput, setInterimInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setInterimInput('');
    } else {
      if (!window.isSecureContext) {
        alert('El reconocimiento de voz requiere un contexto seguro (HTTPS o localhost).');
        return;
      }

      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = false; // Detenerse automáticamente al silencio para enviar comandos rápidos
        recognition.interimResults = true; // Mostrar resultados parciales

        recognitionRef.current = recognition;

        recognition.onstart = () => {
          setIsListening(true);
          setInterimInput('');
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimInput('');
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          setInterimInput('');

          if (event.error === 'not-allowed') {
            alert('⚠️ Acceso al micrófono denegado.\n\nPor favor, verifica los permisos de tu navegador:\n1. Haz clic en el icono de candado/información en la barra de direcciones.\n2. Activa el permiso de "Micrófono".\n3. Recarga la página.');
          } else if (event.error === 'no-speech') {
            // Ignore no-speech, just stop listening
          } else if (event.error === 'network') {
            alert('Error de red. Verifica tu conexión a internet para usar el reconocimiento de voz.');
          } else {
            alert('Error en el reconocimiento de voz: ' + event.error);
          }
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (final) {
            setInput(prev => (prev + ' ' + final).trim());
            setInterimInput('');
          } else {
            setInterimInput(interim);
          }
        };

        try {
          recognition.start();
        } catch (e) {
          console.error("Error starting recognition", e);
        }
      } else {
        alert('Tu navegador no soporta reconocimiento de voz. Intenta usar Google Chrome o Microsoft Edge.');
      }
    }
  };

  const isChatOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleChat = () => {
    if (controlledOnToggle) {
      controlledOnToggle(!isChatOpen);
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
    // Reset wheel state when toggling chat
    setIsWeaponWheelOpen(false);
    setActiveWheelCategory(null);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: currentUser
          ? `Sistemas sincronizados, ${currentUser.name.split(' ')[0]}. Soy el Oráculo Estratégico PIG 2026. ¿En qué área del Arsenal de Datos deseas profundizar hoy?`
          : 'Protocolo de inicio activado. Soy el Oráculo Estratégico. ¿Qué análisis de proyecto requieres?',
        timestamp: new Date()
      }
    ]);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: currentUser
        ? `Sistemas sincronizados, ${currentUser.name.split(' ')[0]}. Soy el Oráculo Estratégico PIG 2026. ¿En qué área del Arsenal de Datos deseas profundizar hoy?`
        : 'Protocolo de inicio activado. Soy el Oráculo Estratégico. ¿Qué análisis de proyecto requieres?',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [expandedMessage, setExpandedMessage] = useState<{ text: string; timestamp: Date } | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatOpen]);

  // Handle external queries
  useEffect(() => {
    if (externalQuery && !isLoading) {
      if (!isChatOpen && controlledIsOpen === undefined) {
        setInternalIsOpen(true);
      }
      handleSend(externalQuery);
      if (onQueryHandled) onQueryHandled();
    }
  }, [externalQuery]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // --- ACCESO ABSOLUTO: RECOLECCIÓN DE TODO EL ARSENAL DE DATOS ---
      let personalNotes = [];
      let requirementTickets = [];
      let checklistTasks = [];
      let whiteboardElements = [];
      let umlDiagram = null;

      let teamChat = [];
      let notifications = [];
      let timesheets = [];

      if (currentUser) {
        try {
          const savedNotes = localStorage.getItem(`personal_notes_${currentUser.id}`);
          if (savedNotes) personalNotes = JSON.parse(savedNotes);

          const savedTickets = localStorage.getItem('pig_requirement_tickets');
          if (savedTickets) requirementTickets = JSON.parse(savedTickets);

          const savedChecklist = localStorage.getItem('pig_checklist_board_v1');
          if (savedChecklist) checklistTasks = JSON.parse(savedChecklist);

          const savedWhiteboard = localStorage.getItem('pig_whiteboard_elements');
          if (savedWhiteboard) whiteboardElements = JSON.parse(savedWhiteboard);

          const savedUML = localStorage.getItem('uml_diagram_v1');
          if (savedUML) umlDiagram = JSON.parse(savedUML);

          // NUEVOS DATOS DEL ARSENAL TOTAL
          const savedChat = localStorage.getItem('scrum_team_chat_messages_v3');
          if (savedChat) teamChat = JSON.parse(savedChat);

          const savedNotifications = localStorage.getItem(`scrum_notifications_${currentUser.id}`);
          if (savedNotifications) notifications = JSON.parse(savedNotifications);

          const savedTimesheets = localStorage.getItem('pig_timesheets');
          if (savedTimesheets) timesheets = JSON.parse(savedTimesheets);
        } catch (e) {
          console.error("Error reading application data arsenal", e);
        }
      }

      // Recuperar metadatos de grabaciones
      const recordings = getAllRecordingsMeta();

      // Si el usuario pregunta por una grabación específica, intentar buscar su transcripción
      let recordingContext = {
        meta: recordings,
        currentTranscript: null as string | null
      };

      // Detectar si pide resumen de grabación
      const summaryMatch = textToSend.match(/resum(?:e|ir|en).+grabaci[oó]n[:\s]+(.+)/i) ||
        textToSend.match(/resum(?:e|ir|en).+meeting[:\s]+(.+)/i);

      if (summaryMatch) {
        const queryIdOrName = summaryMatch[1].trim().toLowerCase();
        // Buscar por ID o nombre aproximado
        const recording = recordings.find(r =>
          r.id === queryIdOrName ||
          r.name.toLowerCase().includes(queryIdOrName) ||
          (queryIdOrName === 'ultima' || queryIdOrName === 'última') // Simple 'latest' logic could be added
        ) || (queryIdOrName.includes('ultima') ? recordings[0] : null);

        if (recording && recording.hasTranscript) {
          const transcript = await getRecordingTranscript(recording.id);
          recordingContext.currentTranscript = transcript;
        }
      }

      // Generar Agenda Semanal para el Contexto
      const today = startOfToday();
      const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
      const agenda = next7Days.map(date => {
        const events = [];
        const dateStr = format(date, 'yyyy-MM-dd');

        // Daily Scrum
        if (!isWeekend(date)) events.push("Daily Scrum (10:00)");

        // Sprints
        sprints.forEach(s => {
          if (s.startDate === dateStr) events.push(`Inicio Sprint: ${s.name}`);
          if (s.endDate === dateStr) events.push(`Fin Sprint: ${s.name}`, "Sprint Review (14:00)", "Retrospectiva (16:00)");
        });

        if (events.length === 0) return null;
        return `${format(date, 'EEEE d MMM', { locale: es })}: ${events.join(', ')}`;
      }).filter(Boolean);

      const context = {
        tasks,
        sprints,
        users,
        projects,
        roadmapItems,
        retroItems,
        userRole: currentUser?.role,
        userName: currentUser?.name,
        personalNotes,
        requirementTickets, // Arsenal: Requerimientos
        checklistTasks,    // Arsenal: Checklists
        whiteboardElements, // Arsenal: Pizarra visual
        umlDiagram,        // Arsenal: Arquitectura
        recordings: recordingContext,
        currentDate: new Date().toISOString(),
        agenda,
        teamChat,          // Arsenal: Chat de equipo
        notifications,     // Arsenal: Notificaciones
        timesheets,        // Arsenal: Hojas de tiempo
        incidents: MOCK_INCIDENTS, // Arsenal: Incidentes mock
        auditLogs: MOCK_AUDIT_LOGS, // Arsenal: Registro de auditoría
        compliance: MOCK_COMPLIANCE_AUDITS // Arsenal: Cumplimiento
      };

      const responseText = await generateScrumAdvice(textToSend, context);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Lo siento, tuve un problema procesando tu solicitud. Por favor intenta de nuevo.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const downloadCSV = (content: string) => {
    ReportService.downloadCSV(content);
  };

  const generateProfessionalReport = async () => {
    try {
      const reportData = {
        tasks,
        sprints,
        users,
        currentUser
      };

      // Usar el servicio de Excel Profesional (Dashboard, Estilos, Múltiples Hojas)
      await ExcelReportService.generateProfessionalExcel(reportData);

      // Agregar mensaje de confirmación en el chat
      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: '💎 **Reporte Premium (ExcelJS) Generado**\n\nHe activado el motor de inteligencia de datos avanzado. El archivo incluye:\n\n• 📑 **Tablas Inteligentes**: Con auto-filtros activos para segmentación inmediata.\n• 🎨 **Formato Condicional**: Resaltado automático de tareas críticas.\n• 📈 **Dashboard Dinámico**: Panel ejecutivo con KPIs analíticos.\n• ⚙️ **Integración Pivot**: Estructura lista para análisis profundo.\n\nEl archivo se abrirá en Excel con capacidades de filtrado y ordenamiento nativos.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmMsg]);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: '❌ Error al generar el reporte avanzado. Por favor intenta de nuevo.',
        timestamp: new Date()
      }]);
    }
  };

  const generateCSVReport = () => {
    const reportData = {
      tasks,
      sprints,
      users,
      currentUser
    };
    const csvContent = ReportService.generateProfessionalCSV(reportData);
    ReportService.downloadCSV(csvContent);

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      text: '✅ Reporte CSV (Datos Planos) descargado para uso rápido.',
      timestamp: new Date()
    }]);
  };

  const generateProfessionalPDFReport = async () => {
    try {
      setIsLoading(true);

      // Arsenal de datos
      let requirementTickets = [];
      let checklistTasks = [];
      const savedTickets = localStorage.getItem('pig_requirement_tickets');
      if (savedTickets) requirementTickets = JSON.parse(savedTickets);
      const savedChecklist = localStorage.getItem('pig_checklist_board_v1');
      if (savedChecklist) checklistTasks = JSON.parse(savedChecklist);

      const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
      const blocked = tasks.filter(t => t.isBlocked).length;
      const efficiency = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

      const reportData = {
        projectName: projects[0]?.name || "Mi Proyecto Ágil",
        userName: currentUser?.name || "Usuario",
        tasks,
        sprints,
        requirements: requirementTickets,
        checklist: checklistTasks,
        stats: {
          totalTasks: tasks.length,
          completedTasks: completed,
          blockedTasks: blocked,
          efficiency
        },
        chartsContainerId: 'chat-messages-container'
      };

      await PDFReportService.generateProfessionalPDF(reportData);

      const confirmMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: '📄 **Reporte PDF Profesional Generado**\n\nHe compilado todo el arsenal de datos en un documento de alta fidelidad. El reporte incluye:\n\n• 🏢 **Portada Corporativa**: Con branding y resumen ejecutivo.\n• 📊 **Métricas de Rendimiento**: KPIs de eficiencia y carga de trabajo.\n• 📋 **Detalle de Arsenal**: Desglose de tareas y requerimientos técnicos.\n• 🏛️ **Estructura Estratégica**: Sprints y cronograma actual.\n\nEl archivo se ha descargado automáticamente con un diseño profesional listo para presentación.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmMsg]);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: '❌ Error al generar el reporte PDF. Por favor intenta de nuevo.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isWeaponWheelOpen, setIsWeaponWheelOpen] = useState(false);
  const [hoveredWheelItem, setHoveredWheelItem] = useState<any>(null);
  const [activeWheelCategory, setActiveWheelCategory] = useState<string | null>(null);

  const ALL_OPTIONS = [
    {
      category: "Análisis y Reportes",
      icon: FileText,
      color: "text-blue-500",
      items: [
        { label: "Reporte PDF Pro", icon: FileText, action: generateProfessionalPDFReport, color: "text-rose-500", desc: "PDF premium con gráficos y diseño profesional" },
        { label: "Excel Pro (Dashboard)", icon: FileDown, action: generateProfessionalReport, color: "text-emerald-500", desc: "Reporte visual con gráficos, hojas y KPIs" },
        { label: "Reporte CSV (Datos)", icon: FileDown, action: generateCSVReport, color: "text-blue-500", desc: "Descargar datos tabulares rápidos" },
        { label: "Analizar Riesgos", icon: AlertTriangle, action: () => handleSend("Realiza un análisis profundo de riesgos cruzando Tareas, Tickets de Requerimientos y bloqueos en el Checklist. Identifica cuellos de botella críticos."), color: "text-orange-500", desc: "Detectar riesgos y problemas potenciales" },
        { label: "Tareas Bloqueadas", icon: Lock, action: () => handleSend("Analizar todas las tareas bloqueadas, tickets de requerimientos detenidos e impedimentos detectados en la pizarra."), color: "text-red-500", desc: "Ver tareas que requieren atención inmediata" },
        { label: "Resumen de Progreso", icon: BarChart2, action: () => handleSend("Generar un resumen ejecutivo del progreso actual analizando la salud de los Sprints y el cumplimiento de los Requerimientos técnicos."), color: "text-emerald-500", desc: "Visión general del estado del proyecto" }
      ]
    },
    {
      category: "Visualización de Datos",
      icon: BarChart2,
      color: "text-indigo-500",
      items: [
        { label: "Gráfico de Prioridades", icon: BarChart2, action: () => handleSend("Graficar el estado de las tareas por prioridad cruzando con la urgencia de los requerimientos."), color: "text-[#7b68ee]", desc: "Distribución de tareas por importancia" },
        { label: "Gráfico de Estado", icon: BarChart2, action: () => handleSend("Graficar distribución de tareas por estado (Todo, In Progress, Done) incluyendo el avance del checklist."), color: "text-indigo-500", desc: "Ver carga de trabajo por estado" },
        { label: "Burndown Chart", icon: Zap, action: () => handleSend("Generar gráfico Burndown analizando la velocidad real de cierre de tareas y tickets de requerimientos."), color: "text-yellow-500", desc: "Velocidad de completitud del equipo" }
      ]
    },
    {
      category: "Asistente Scrum",
      icon: Bot,
      color: "text-purple-500",
      items: [
        { label: "Resumen Daily", icon: Calendar, action: () => handleSend("Generar un resumen para el Daily Scrum basado en tareas realizadas, tickets avanzados y notas de la pizarra de ayer."), color: "text-blue-400", desc: "Puntos clave para tu reunión diaria" },
        { label: "Sugerir Mejoras", icon: Sparkles, action: () => handleSend("Analiza todo mi arsenal de datos (tareas, requerimientos, arquitectura) y sugiere 3 mejoras para optimizar el flujo de trabajo."), color: "text-purple-500", desc: "Ideas para optimizar el flujo de trabajo" },
        { label: "Agenda Semanal", icon: Calendar, action: () => handleSend("¿Qué eventos, hitos y fechas de entrega de requerimientos importantes tengo esta semana?"), color: "text-pink-500", desc: "Revisar compromisos y entregas próximas" },
        { label: "Ver Mis Notas", icon: FileText, action: () => handleSend("Listar mis notas personales, apuntes de la pizarra y recordatorios importantes del checklist."), color: "text-yellow-500", desc: "Revisar checklist de notas personales" },
        { label: "Redactar User Story", icon: FileText, action: () => handleSend("Ayúdame a redactar una User Story basándote en los requerimientos técnicos actuales del tablero."), color: "text-cyan-500", desc: "Plantilla guiada para nuevas historias" }
      ]
    },
    {
      category: "IA Estratégica Local",
      icon: Brain,
      color: "text-rose-500",
      items: [
        { label: "Balance de Carga", icon: Zap, action: () => handleSend("Analizar el balance de carga de trabajo entre miembros cruzando tareas asignadas y tickets de requerimientos."), color: "text-orange-500", desc: "Detectar si alguien tiene demasiadas tareas" },
        { label: "Eficiencia del Equipo", icon: BarChart2, action: () => handleSend("Calcular la eficiencia del equipo basándose en el cierre de tareas, tickets y limpieza del checklist."), color: "text-emerald-500", desc: "Métricas de rendimiento y velocidad real" },
        { label: "Auditoría de Calidad", icon: Check, action: () => handleSend("Realizar una auditoría de calidad de todo el arsenal (requerimientos incompletos, tareas sin puntos, etc)."), color: "text-blue-500", desc: "Encontrar tareas incompletas o mal definidas" },
        { label: "Predicción de Entrega", icon: Target, action: () => handleSend("Estimar la fecha de finalización real considerando el volumen total de tareas y tickets pendientes."), color: "text-rose-500", desc: "Cálculo matemático de cierre del sprint" }
      ]
    },
    {
      category: "Ingenio y Curiosidades",
      icon: Sparkles,
      color: "text-amber-500",
      items: [
        { label: "Estado del Ecosistema", icon: Globe, action: () => handleSend("Dame un informe 'Oracle' sobre el estado absoluto de mi ecosistema: cruza arquitectura, tareas y pizarra."), color: "text-indigo-600", desc: "Análisis 360 del proyecto" },
        { label: "Predicción del Futuro", icon: Target, action: () => handleSend("Predice la fecha real de finalización analizando todos los módulos de datos y sugiere cómo mejorarla."), color: "text-indigo-600", desc: "¿Cuándo terminaremos realmente?" },
        { label: "MVP de la Semana", icon: Trophy, action: () => handleSend("¿Quién es el MVP según la complejidad de tareas y requerimientos resueltos?"), color: "text-yellow-600", desc: "Reconocer el talento del equipo" },
        { label: "Filósofo Ágil", icon: Brain, action: () => handleSend("Dame una reflexión filosófica basándote en los desafíos que ves en mis requerimientos y tareas actuales."), color: "text-blue-600", desc: "Inspiración para momentos de estrés" },
        { label: "Tarea Monstruo", icon: Ghost, action: () => handleSend("Identifica la 'Tarea Monstruo' en cualquier tablero y dime cómo derrotarla."), color: "text-purple-600", desc: "Enfrentar el desafío más grande" },
        { label: "Cápsula del Tiempo", icon: History, action: () => handleSend("¿Cómo ha evolucionado el proyecto (notas, tickets, tareas) en los últimos 7 días?"), color: "text-teal-600", desc: "Viaje por la evolución del sprint" },
        { label: "Sabías que...", icon: Lightbulb, action: () => handleSend("Cuéntame 3 datos curiosos de mi arsenal de datos que probablemente no haya notado."), color: "text-amber-500", desc: "Descubrimientos inesperados" },
        { label: "Modo Zen", icon: Coffee, action: () => handleSend("Dame un consejo de bienestar basado en la carga de trabajo que ves en todos mis tableros."), color: "text-green-600", desc: "Bienestar en medio de la agilidad" }
      ]
    }
  ];

  const handleOptionClick = (action: () => void) => {
    action();
    setIsOptionsModalOpen(false);
    setIsWeaponWheelOpen(false);
    setActiveWheelCategory(null);
  };

  const getWheelItems = () => {
    if (!activeWheelCategory) {
      return ALL_OPTIONS.map(cat => ({
        label: cat.category,
        icon: cat.icon,
        color: cat.color,
        isCategory: true,
        action: () => setActiveWheelCategory(cat.category)
      }));
    }
    const category = ALL_OPTIONS.find(cat => cat.category === activeWheelCategory);
    return category ? category.items.map(item => ({ ...item, isCategory: false })) : [];
  };

  const wheelItems = getWheelItems();
  const flatOptions = ALL_OPTIONS.flatMap(category => category.items);

  // ── Inline Markdown Renderer ──────────────────
  const renderInlineMd = (text: string): React.ReactNode => {
    // Bold **text** and italic *text*
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-xs font-mono text-[#7b68ee]">{part.slice(1, -1)}</code>;
      return <span key={i}>{part}</span>;
    });
  };

  // ── Full Markdown Block Renderer ──────────────
  const renderMarkdown = (text: string, animate: boolean): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Empty
      if (!trimmed) { elements.push(<div key={i} className="h-2" />); i++; continue; }

      // H3 ###
      if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-xs font-bold uppercase tracking-widest text-[#7b68ee] dark:text-[#a89aff] mt-3 mb-1">{renderInlineMd(trimmed.slice(4))}</h3>);
        i++; continue;
      }
      // H2 ##
      if (trimmed.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-sm font-bold text-slate-800 dark:text-white mt-4 mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">{renderInlineMd(trimmed.slice(3))}</h2>);
        i++; continue;
      }
      // Divider ---
      if (trimmed === '---') {
        elements.push(<hr key={i} className="border-slate-200 dark:border-slate-700 my-2" />);
        i++; continue;
      }
      // Markdown Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        const rows = tableLines.filter(l => !l.trim().match(/^\|[\s\-|]+\|$/));
        if (rows.length > 0) {
          const headers = rows[0].split('|').slice(1, -1).map(h => h.trim());
          const bodyRows = rows.slice(1);
          elements.push(
            <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>{headers.map((h, hi) => <th key={hi} className="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap border-b border-slate-200 dark:border-slate-700">{renderInlineMd(h)}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {bodyRows.map((row, ri) => {
                    const cells = row.split('|').slice(1, -1).map(c => c.trim());
                    return <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {cells.map((cell, ci) => <td key={ci} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">{renderInlineMd(cell)}</td>)}
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }
      // Unordered list •  or -
      if (trimmed.startsWith('• ') || (trimmed.startsWith('- ') && !trimmed.startsWith('---'))) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('• ') || (lines[i].trim().startsWith('- ') && !lines[i].trim().startsWith('---')))) {
          listItems.push(lines[i].trim().replace(/^[•\-]\s/, ''));
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="space-y-1 my-1 ml-1">
            {listItems.map((item, li) => (
              <li key={li} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#7b68ee] flex-shrink-0"></span>
                <span>{renderInlineMd(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }
      // Ordered list 1.
      if (/^\d+\.\s/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="space-y-1 my-1 ml-1">
            {listItems.map((item, li) => (
              <li key={li} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#7b68ee]/10 text-[#7b68ee] text-[10px] font-bold flex items-center justify-center mt-0.5">{li + 1}</span>
                <span>{renderInlineMd(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }
      // Normal paragraph
      elements.push(
        <p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {animate && i === 0 ? <TypewriterText text={trimmed} /> : renderInlineMd(trimmed)}
        </p>
      );
      i++;
    }
    return <div className="space-y-1">{elements}</div>;
  };

  // ── Master Message Content Renderer ──────────
  const renderMessageContent = (text: string, isLatestModelMessage: boolean = false) => {
    // 1. JSON Chart block
    const jsonRegex = /```json([\s\S]*?)```/;
    const jsonMatch = text.match(jsonRegex);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        if (jsonData.type === 'chart') {
          const parts = text.split(jsonRegex);
          const preText = parts[0]?.trim();
          const postText = parts[2]?.trim();
          return (
            <div className="w-full flex flex-col gap-3">
              {preText && (
                <div className="text-sm text-left">{renderMarkdown(preText, isLatestModelMessage)}</div>
              )}
              <div
                className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm w-full cursor-zoom-in hover:shadow-md transition-shadow animate-in zoom-in-95 duration-500"
                onClick={() => setSelectedChart(jsonData)}
                title="Clic para ampliar gráfico"
              >
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  {jsonData.title.includes('RIESGO') || jsonData.title.includes('VULNERAB') ? (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  ) : (
                    <BarChart2 className="w-4 h-4 text-[#7b68ee]" />
                  )}
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{jsonData.title}</h4>
                  <span className="ml-auto text-[9px] text-slate-400 font-medium">↗ Ampliar</span>
                </div>
                <div className="h-52 w-full pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jsonData.data} margin={{ top: 5, right: 5, left: -25, bottom: 25 }} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-20} textAnchor="end" interval={0} height={40} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                      <Bar dataKey="value" radius={[5, 5, 0, 0]} name="Valor">
                        {jsonData.data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || '#7b68ee'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {postText && <div className="text-sm text-left">{renderMarkdown(postText, false)}</div>}
            </div>
          );
        }
      } catch (e) { /* fall through */ }
    }

    // 2. CSV block
    const csvRegex = /```csv([\s\S]*?)```/;
    const csvMatch = text.match(csvRegex);
    if (csvMatch) {
      const parts = text.split(csvRegex);
      const csvContent = csvMatch[1].trim();
      return (
        <div className="flex flex-col gap-2">
          {parts[0] && <div className="text-sm">{renderMarkdown(parts[0].trim(), isLatestModelMessage)}</div>}
          <div className="mt-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Reporte CSV</span>
              <button onClick={() => downloadCSV(csvContent)} className="bg-[#7b68ee] text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-[#6b58de] transition-all">
                <FileDown className="w-3 h-3" /> Descargar
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg max-h-48">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>{csvContent.split('\n')[0].split(',').map((h: string, i: number) => <th key={i} className="px-3 py-2 text-left font-bold text-slate-500 dark:text-slate-400">{h.replace(/"/g, '')}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {csvContent.split('\n').slice(1, 8).map((row: string, i: number) => (
                    <tr key={i}>{row.split(',').map((cell: string, j: number) => <td key={j} className="px-3 py-1.5 text-slate-600 dark:text-slate-400">{cell.replace(/"/g, '')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // 3. Code blocks
    if (text.includes('```')) {
      const splitText = text.split(/(```[\w]*\n[\s\S]*?```)/g);
      return (
        <div className="flex flex-col gap-2">
          {splitText.map((part, index) => {
            if (part.startsWith('```')) {
              const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
              if (match) return <CodeBlock key={index} language={match[1] || ''} code={match[2]} />;
            }
            if (!part.trim()) return null;
            return <div key={index} className="text-left">{renderMarkdown(part.trim(), isLatestModelMessage && index === 0)}</div>;
          })}
        </div>
      );
    }

    // 4. Rich markdown text
    return <div className="text-left">{renderMarkdown(text, isLatestModelMessage)}</div>;
  };


  return (
    <>
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center justify-center group ${isChatOpen ? 'bg-red-500 hover:bg-red-600 rotate-90' : 'bg-gradient-to-r from-[#7b68ee] to-[#a89aff] hover:shadow-purple-500/40 hover:scale-110 active:scale-95'
          }`}
      >
        {!isChatOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#1e1e2d] rounded-full animate-pulse"></span>
        )}
        {isChatOpen ? <X className="text-white w-6 h-6" /> : <Bot className="text-white w-7 h-7 animate-bounce [animation-duration:3s]" />}
      </button>

      {/* Main Chat Window */}
      <div
        className={`fixed z-50 flex flex-col transition-all duration-500 bg-white dark:bg-[#0f0f1a] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.35)] border
          ${isChatOpen ? 'opacity-100 pointer-events-auto translate-y-0 scale-100' : 'opacity-0 pointer-events-none translate-y-6 scale-[0.97]'}
          border-slate-200/80 dark:border-[#7b68ee]/15
          /* Mobile: Full screen */
          bottom-0 right-0 w-full h-[100dvh] rounded-none
          /* Tablet */
          sm:bottom-6 sm:right-6 sm:w-[520px] sm:h-[82vh] sm:max-h-[780px] sm:rounded-3xl sm:origin-bottom-right
          /* Desktop */
          lg:w-[620px] lg:h-[85vh] lg:max-h-[860px]
          `}
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#5b50c8] via-[#7b68ee] to-[#9d8eff] text-white px-5 py-4 sm:rounded-t-3xl flex items-center gap-4 shrink-0 shadow-lg shadow-[#7b68ee]/20 relative overflow-hidden">
          {/* Background glow orbs */}
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-4 left-10 w-20 h-20 bg-[#40ffaa]/10 rounded-full blur-xl pointer-events-none" />

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#40ffaa] border-2 border-[#7b68ee] rounded-full animate-pulse shadow-[0_0_8px_rgba(64,255,170,0.9)]"></span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base leading-tight tracking-tight">Oráculo Estratégico</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-semibold text-white/70 tracking-widest uppercase">PIG 2026 · Núcleo IA Activo</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={clearChat}
              className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/80 hover:text-white"
              title="Nueva conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleChat()}
              className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/80 hover:text-white"
              title="Cerrar"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Messages ───────────────────────────────── */}
        <div
          id="chat-messages-container"
          className="flex-1 overflow-y-auto px-5 py-6 bg-slate-50 dark:bg-[#0a0a14] space-y-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#7b68ee30 transparent' }}
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {/* AI Avatar for model messages */}
              {msg.role === 'model' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#7b68ee] to-[#a89aff] flex items-center justify-center shadow-md shadow-[#7b68ee]/20 mb-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[88%] rounded-2xl overflow-hidden relative group/bubble transition-all duration-300 ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-[#7b68ee] to-[#5b4fd4] text-white rounded-br-sm shadow-lg shadow-[#7b68ee]/20'
                    : 'bg-white dark:bg-[#1a1a2e] text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-100 dark:border-[#7b68ee]/10 shadow-sm'
                  }`}
              >
                {/* Top accent line for AI */}
                {msg.role === 'model' && (
                  <div className="h-[2px] w-full bg-gradient-to-r from-[#7b68ee]/60 via-[#a89aff]/40 to-transparent" />
                )}

                {/* Content */}
                <div className="px-5 py-4">
                  {/* Expand button */}
                  {msg.role === 'model' && (
                    <button
                      onClick={() => setExpandedMessage({ text: msg.text, timestamp: msg.timestamp })}
                      className="absolute top-3 right-3 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 p-1.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-[#7b68ee] hover:text-white rounded-lg text-slate-400 dark:text-slate-400 z-10 shadow-sm"
                      title="Vista ampliada"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  )}

                  {renderMessageContent(msg.text, msg.role === 'model' && idx === messages.length - 1)}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 dark:border-white/5">
                    <span className={`text-[10px] font-medium opacity-50 ${msg.role === 'user' ? 'text-white' : 'text-slate-500 dark:text-slate-500'
                      }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.role === 'model' && (
                      <button
                        onClick={() => setExpandedMessage({ text: msg.text, timestamp: msg.timestamp })}
                        className="text-[10px] opacity-0 group-hover/bubble:opacity-70 hover:!opacity-100 transition-all text-[#7b68ee] flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> Ampliar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-end gap-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#7b68ee] to-[#a89aff] flex items-center justify-center shadow-md shadow-[#7b68ee]/20">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-[#1a1a2e] border border-slate-100 dark:border-[#7b68ee]/10 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#7b68ee] rounded-full animate-bounce [animation-delay:-0.3s] opacity-80"></div>
                    <div className="w-2 h-2 bg-[#7b68ee] rounded-full animate-bounce [animation-delay:-0.15s] opacity-80"></div>
                    <div className="w-2 h-2 bg-[#7b68ee] rounded-full animate-bounce opacity-80"></div>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Analizando datos...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Bottom Panel ──────────────────────────── */}
        <div className="shrink-0 bg-white dark:bg-[#0f0f1a] border-t border-slate-100 dark:border-[#7b68ee]/10 sm:rounded-b-3xl">

          {/* Proactive Chips */}
          {isChatOpen && (
            <div className="px-5 pt-3 pb-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600 mb-2">Análisis rápido</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '📊 Estado', q: 'Dame un informe de estado maestro' },
                  { label: '🚨 Riesgos', q: '¿Qué riesgos y bloqueos detectas hoy?' },
                  { label: '⚖️ Carga', q: 'Analiza el balance de carga del equipo' },
                  { label: '🔮 Predicción', q: '¿Cuál es la predicción real de entrega?' },
                  { label: '🧠 Arsenal', q: 'Muestra todo el arsenal de datos disponible' },
                  { label: '📝 Mis tareas', q: 'Muéstrame mis tareas pendientes' },
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip.q)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-[#1a1a2e] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#7b68ee]/15 hover:border-[#7b68ee]/50 hover:text-[#7b68ee] hover:bg-[#7b68ee]/5 dark:hover:bg-[#7b68ee]/10 whitespace-nowrap transition-all disabled:opacity-40"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="px-4 pt-3 pb-4">
            <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-[#1a1a2e] rounded-2xl border border-slate-200 dark:border-[#7b68ee]/15 focus-within:border-[#7b68ee]/50 focus-within:shadow-[0_0_0_3px_rgba(123,104,238,0.08)] transition-all px-4 py-3">
              {/* Mic indicator */}
              {isListening && (
                <span className="absolute left-4 bottom-4 animate-pulse">
                  <Mic className="w-4 h-4 text-red-400" />
                </span>
              )}
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                }}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🎙 Escuchando...' : 'Consulta al Oráculo...'}
                rows={1}
                className={`flex-1 bg-transparent border-none focus:outline-none resize-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 min-h-[24px] max-h-[160px] leading-relaxed scrollbar-hide transition-all ${isListening ? 'pl-6' : ''
                  }`}
                style={{ height: '24px' }}
              />
              {/* Action buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0 self-end pb-0.5">
                <button
                  onClick={toggleListening}
                  className={`p-2 rounded-xl transition-all ${isListening
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 shadow-inner'
                      : 'text-slate-400 hover:text-[#7b68ee] hover:bg-[#7b68ee]/10'
                    }`}
                  title={isListening ? 'Detener voz' : 'Entrada de voz'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="p-2 bg-gradient-to-br from-[#7b68ee] to-[#6a5acd] text-white rounded-xl hover:from-[#6a5acd] hover:to-[#5b4fc4] disabled:opacity-40 transition-all shadow-md shadow-[#7b68ee]/25 hover:shadow-[#7b68ee]/40 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Command bar */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => setIsWeaponWheelOpen(true)}
                className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest py-2 bg-slate-100 dark:bg-[#1a1a2e] hover:bg-[#7b68ee]/10 text-slate-400 dark:text-slate-500 hover:text-[#7b68ee] rounded-xl transition-all border border-transparent hover:border-[#7b68ee]/20 group"
              >
                <Gamepad2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                Rueda de Comandos
              </button>
              <span className="text-[9px] text-slate-300 dark:text-slate-700 font-medium whitespace-nowrap">
                {input.length > 0 ? `${input.length} car.` : 'Enter para enviar'}
              </span>
            </div>
          </div>
        </div>

        {/* Weapon Wheel Overlay */}
        {isWeaponWheelOpen && (
          <div
            className="absolute inset-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300"
            onClick={() => {
              setIsWeaponWheelOpen(false);
              setActiveWheelCategory(null);
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {/* Central Hub */}
              <div
                onClick={() => activeWheelCategory && setActiveWheelCategory(null)}
                className={`absolute z-20 w-32 h-32 rounded-full bg-white dark:bg-slate-800 shadow-[0_0_40px_rgba(123,104,238,0.3)] border-4 border-[#7b68ee] flex flex-col items-center justify-center text-center p-2 transition-all duration-300 ${hoveredWheelItem ? 'scale-110 shadow-[0_0_60px_rgba(123,104,238,0.6)]' : ''} ${activeWheelCategory ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700' : ''}`}
              >
                {hoveredWheelItem ? (
                  <div className="animate-in fade-in zoom-in duration-200 flex flex-col items-center">
                    <hoveredWheelItem.icon className={`w-8 h-8 mb-1 ${hoveredWheelItem.color} drop-shadow-[0_0_10px_rgba(123,104,238,0.5)]`} />
                    <span className="text-[10px] font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">{hoveredWheelItem.label}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center opacity-50">
                    {activeWheelCategory ? (
                      <>
                        <ChevronDown className="w-8 h-8 text-[#7b68ee] mb-1 rotate-180" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7b68ee]">Volver</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-10 h-10 text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Seleccionar</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Satellite Items */}
              {wheelItems.map((item, idx) => {
                const totalItems = wheelItems.length;
                const angleDeg = (idx * (360 / totalItems)) - 90; // Start at top
                const angleRad = angleDeg * (Math.PI / 180);
                const radius = activeWheelCategory ? 150 : 120; // Distance from center
                const x = Math.cos(angleRad) * radius;
                const y = Math.sin(angleRad) * radius;

                return (
                  <button
                    key={idx}
                    onClick={() => item.isCategory ? (item as any).action() : handleOptionClick((item as any).action)}
                    onMouseEnter={() => setHoveredWheelItem(item)}
                    onMouseLeave={() => setHoveredWheelItem(null)}
                    className={`absolute z-10 w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-lg border-2 flex items-center justify-center hover:scale-125 transition-all duration-300 group ${item.isCategory ? 'border-[#7b68ee]/50 scale-110' : 'border-slate-200 dark:border-slate-700'} hover:border-[#7b68ee] hover:shadow-[0_0_25px_rgba(123,104,238,0.6)] hover:z-30`}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  >
                    <item.icon className={`w-6 h-6 ${item.color} transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(123,104,238,0.8)]`} />

                    {/* Label for categories in initial view */}
                    {!activeWheelCategory && (
                      <span className="absolute -bottom-6 w-24 text-[8px] font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.label}
                      </span>
                    )}

                    {/* Connecting Line (Energy Beam effect) */}
                    <div
                      className={`absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#7b68ee]/30 to-transparent -z-10 origin-left pointer-events-none transition-all duration-300 group-hover:h-[2px] group-hover:bg-[#7b68ee] group-hover:shadow-[0_0_10px_#7b68ee] ${item.isCategory ? 'opacity-60' : 'opacity-30'}`}
                      style={{
                        transform: `rotate(${angleDeg + 180}deg)`,
                        width: `${radius}px`
                      }}
                    />
                  </button>
                );
              })}

              {/* Close Hint */}
              <div className="absolute bottom-8 text-xs font-medium text-slate-500 bg-white/80 dark:bg-slate-900/80 px-3 py-1 rounded-full backdrop-blur-sm">
                Click fuera para cerrar
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Chart Modal Overlay */}
      {selectedChart && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedChart(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#7b68ee] dark:text-[#7b68ee]" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase">{selectedChart.title}</h3>
              </div>
              <button
                onClick={() => setSelectedChart(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="p-6 h-[500px] w-full bg-white dark:bg-slate-900">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedChart.data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  barSize={60}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    angle={-15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontSize: '14px',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      color: '#fff'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ paddingTop: '10px', textTransform: 'uppercase', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Valor">
                    {selectedChart.data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
              <p className="text-sm text-slate-500">Visualización ampliada generada por IA</p>
            </div>
          </div>
        </div>
      )}

      {/* Options Modal Overlay */}
      {isOptionsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">

            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#7b68ee]/10 rounded-lg">
                  <Bot className="w-5 h-5 text-[#7b68ee]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">Comandos Disponibles</h3>
                  <p className="text-xs text-slate-500">Selecciona una opción para generar contenido</p>
                </div>
              </div>
              <button
                onClick={() => setIsOptionsModalOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
              {ALL_OPTIONS.map((category, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{category.category}</h4>
                    {category.category === "Ingenio y Curiosidades" && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                        NUEVO
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {category.items.map((item, itemIdx) => (
                      <button
                        key={itemIdx}
                        onClick={() => handleOptionClick(item.action)}
                        className={`flex items-start gap-3 p-3 border rounded-xl hover:border-[#7b68ee] hover:shadow-md transition-all group text-left relative overflow-hidden ${category.category === "Ingenio y Curiosidades"
                          ? "bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-800 dark:to-indigo-900/10 border-indigo-100 dark:border-indigo-900/30"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          }`}
                      >
                        {category.category === "Ingenio y Curiosidades" && (
                          <div className="absolute -right-2 -top-2 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Sparkles className="w-12 h-12 rotate-12" />
                          </div>
                        )}
                        <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-900 group-hover:scale-110 transition-transform ${item.color}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block font-semibold text-slate-700 dark:text-slate-200 text-sm mb-0.5 group-hover:text-[#7b68ee] transition-colors">
                            {item.label}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                            {item.desc}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Tip: También puedes escribir tus propios comandos en el chat.
              </p>
            </div>

          </div>
        </div>
      )}
      {/* ─── Message Expand Modal ──────────────────────── */}
      {expandedMessage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setExpandedMessage(null)}
        >
          <div
            className="bg-white dark:bg-[#13131f] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_0_80px_rgba(123,104,238,0.25)] border border-slate-200 dark:border-[#7b68ee]/20 flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-[#7b68ee]/5 to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7b68ee] to-[#a89aff] flex items-center justify-center shadow-lg shadow-[#7b68ee]/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">Oráculo Estratégico</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {expandedMessage.timestamp.toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(expandedMessage.text);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#7b68ee]/10 hover:text-[#7b68ee] text-slate-500 dark:text-slate-400 text-xs font-medium transition-all border border-transparent hover:border-[#7b68ee]/20"
                  title="Copiar al portapapeles"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  Copiar
                </button>
                <button
                  onClick={() => setExpandedMessage(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content — full rich render */}
            <div className="overflow-y-auto flex-1 px-6 py-6 space-y-4">
              <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                {renderMessageContent(expandedMessage.text, false)}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0e0e18] shrink-0 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#40ffaa] animate-pulse inline-block"></span>
                Generado por el Oráculo Estratégico PIG 2026
              </span>
              <button
                onClick={() => setExpandedMessage(null)}
                className="text-xs font-medium text-slate-400 hover:text-[#7b68ee] transition-colors"
              >
                Cerrar ✕
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default AIChatbot;