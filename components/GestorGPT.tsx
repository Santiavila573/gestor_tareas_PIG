import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Image as ImageIcon,
  Bot,
  User,
  Trash2,
  History,
  Code2,
  Check,
  Loader2,
  Github,
  Globe,
  Database,
  Search,
  X,
  Copy,
  Terminal,
  Bug,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Zap,
  Command,
  Bell,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { generateBugSolution } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  images?: string[];
  timestamp: number;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface GestorGPTProps {
  isDarkMode?: boolean;
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 xl:my-6 3xl:my-8 rounded-xl 2xl:rounded-2xl overflow-hidden border border-slate-200/20 dark:border-white/[0.03] bg-white/40 dark:bg-[#0b0b0f]/20 backdrop-blur-md transition-all duration-500 hover:border-[#7b68ee]/20 hover:shadow-2xl hover:shadow-indigo-500/5">
      <div className="flex items-center justify-between px-4 py-2 xl:px-6 xl:py-3 bg-slate-50/10 dark:bg-white/[0.01] border-b border-slate-200/20 dark:border-white/[0.03]">
        <div className="flex items-center gap-3 2xl:gap-4">
          <div className="flex gap-1.5 2xl:gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 2xl:w-3 2xl:h-3 rounded-full bg-red-500/40" />
            <div className="w-2 h-2 2xl:w-3 2xl:h-3 rounded-full bg-yellow-500/40" />
            <div className="w-2 h-2 2xl:w-3 2xl:h-3 rounded-full bg-green-500/40" />
          </div>
          <div className="w-px h-3 2xl:h-5 bg-slate-200 dark:bg-white/10 mx-1" />
          <span className="text-[9px] 2xl:text-xs font-black text-slate-400 dark:text-slate-500 font-mono uppercase tracking-[0.2em]">{language || 'código'}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 2xl:gap-3 px-2.5 py-1 xl:px-4 xl:py-2 rounded-lg 2xl:rounded-xl transition-all duration-300 text-[9px] 2xl:text-xs font-black uppercase tracking-widest
            ${copied
              ? 'bg-green-500/10 text-green-500'
              : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 opacity-40 hover:opacity-100'
            }
          `}
        >
          {copied ? <Check className="w-3 h-3 2xl:w-4 2xl:h-4" /> : <Copy className="w-3 h-3 2xl:w-4 2xl:h-4" />}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>
      <div className="p-4 2xl:p-6 4xl:p-10 overflow-x-auto custom-scrollbar">
        <pre className="font-mono text-[10.5px] 2xl:text-sm 4xl:text-xl leading-relaxed text-slate-600 dark:text-slate-400 selection:bg-[#7b68ee]/20">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message; isLatest?: boolean }> = ({ message, isLatest }) => {
  const isUser = message.role === 'user';

  const renderContent = (text: string) => {
    const parts = text.split(/(```[\w]*\n[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          return <CodeBlock key={index} language={match[1] || ''} code={match[2]} />;
        }
      }
      return (
        <div key={index} className="space-y-3 xl:space-y-4 mb-3 xl:mb-4 last:mb-0">
          {part.split('\n\n').map((paragraph, pIdx) => (
            <p key={pIdx} className="leading-relaxed text-[13px] 2xl:text-base 4xl:text-2xl font-medium tracking-tight opacity-90">
              {paragraph.split(/(\*\*.*?\*\*)/g).map((subPart, i) => {
                if (subPart.startsWith('**') && subPart.endsWith('**')) {
                  return <strong key={i} className="font-bold text-[#7b68ee] dark:text-[#a594ff] px-1.5 py-0.5 xl:px-2 rounded-md bg-[#7b68ee]/5 border border-[#7b68ee]/10">{subPart.slice(2, -2)}</strong>;
                }
                return subPart;
              })}
            </p>
          ))}
        </div>
      );
    });
  };

  return (
    <div className={`flex gap-4 2xl:gap-6 4xl:gap-8 mb-8 group ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in-up duration-700 slide-in-from-bottom-4`}>
      <div className={`w-8 h-8 2xl:w-10 4xl:w-14 rounded-xl 2xl:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 shadow-lg relative
        ${isUser
          ? 'bg-gradient-to-br from-indigo-500/80 to-purple-600/80 shadow-indigo-500/10'
          : 'bg-gradient-to-br from-[#7b68ee]/80 to-violet-600/80 shadow-indigo-500/10'
        }
      `}>
        {isUser ? <User className="w-3.5 h-3.5 2xl:w-5 4xl:w-7 text-white/90" /> : <Bot className="w-3.5 h-3.5 2xl:w-5 4xl:w-7 text-white/90" />}
        {!isUser && isLatest && (
          <div className="absolute -top-1 -right-1 2xl:-top-1.5 2xl:-right-1.5 w-2.5 h-2.5 2xl:w-3 4xl:w-4 bg-green-500 rounded-full border-2 border-white dark:border-[#050507] animate-pulse" />
        )}
      </div>

      <div className={`flex-1 max-w-[92%] lg:max-w-[85%] xl:max-w-[75%] 3xl:max-w-[80%] min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-3 mb-2 3xl:mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className={`font-black text-[9px] 2xl:text-[11px] 4xl:text-sm tracking-[0.2em] uppercase opacity-40 ${isUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-[#7b68ee]'}`}>
            {isUser ? 'Desarrollador' : 'Gestor GPT'}
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/5" />
          <span className={`font-black text-[8px] 2xl:text-[11px] 4xl:text-sm text-slate-400 font-jakarta opacity-30`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={`relative p-4 lg:p-5 3xl:p-10 rounded-2xl 3xl:rounded-[40px] transition-all duration-500 backdrop-blur-3xl border
          ${isUser
            ? 'bg-white/60 dark:bg-[#0f0f15]/60 border-slate-200/30 dark:border-white/[0.03] rounded-tr-none shadow-2xl shadow-black/[0.02]'
            : 'bg-slate-50/30 dark:bg-white/[0.01] border-slate-200/30 dark:border-white/[0.03] rounded-tl-none hover:bg-white/[0.02] hover:border-white/5'
          }
        `}>
          {!isUser && (
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          )}

          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-3 2xl:gap-6 mb-4 2xl:mb-8">
              {message.images.map((img, i) => (
                <div key={i} className="relative group rounded-xl 2xl:rounded-3xl overflow-hidden border border-slate-200/50 dark:border-white/10 shadow-xl transition-all duration-500 hover:scale-[1.02]">
                  <img
                    src={img}
                    alt="Code context"
                    className="max-h-48 2xl:max-h-[500px] object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}

          <div className={`text-slate-600 dark:text-slate-300 text-[13.5px] 2xl:text-2xl leading-relaxed font-inter font-medium relative z-10`}>
            {renderContent(message.text)}
          </div>

          {!isUser && isLatest && (
            <div className="absolute -bottom-2 -right-2 2xl:-bottom-4 2xl:-right-4 flex gap-1 z-20">
              <div className="w-7 h-7 2xl:w-14 2xl:h-14 rounded-xl 2xl:rounded-2xl bg-white dark:bg-[#0f0f15] border border-slate-200/50 dark:border-white/[0.03] flex items-center justify-center shadow-2xl text-[#7b68ee] animate-bounce-slow">
                <Sparkles className="w-3.5 h-3.5 2xl:w-7 2xl:h-7 opacity-80" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const GestorGPT: React.FC<GestorGPTProps> = ({ isDarkMode = false }) => {
  const isLight = !isDarkMode;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse move effect for advanced UI
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;

      containerRef.current.style.setProperty('--mouse-x', `${x}%`);
      containerRef.current.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('debug_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, searchStatus]);

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('debug_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedImages(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const simulateExternalSearch = async () => {
    const steps = [
      { text: "Analizando contexto del código...", icon: Bug },
      { text: "Escaneando repositorios en GitHub...", icon: Github },
      { text: "Consultando documentación técnica...", icon: Globe },
      { text: "Buscando patrones en StackOverflow...", icon: Database },
      { text: "Verificando compatibilidad de versiones...", icon: Terminal },
      { text: "Generando solución optimizada...", icon: Lightbulb },
    ];

    for (const step of steps) {
      setSearchStatus(step.text);
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    }
    setSearchStatus('');
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      images: [...selectedImages],
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);

    if (!currentSessionId) {
      const newSessionId = Date.now().toString();
      setCurrentSessionId(newSessionId);
      const newSession: Session = {
        id: newSessionId,
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [userMsg],
        createdAt: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
    } else {
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId
          ? { ...s, messages: [...s.messages, userMsg] }
          : s
      ));
    }
    if (input.includes("Ver Recordatorios")) {
      const savedReminders = localStorage.getItem('calendar_reminders');
      let reminderText = "No tienes recordatorios pendientes.";

      if (savedReminders) {
        const reminders = JSON.parse(savedReminders);
        const upcoming = reminders
          .filter((r: any) => new Date(`${r.date}T${r.time}`) > new Date())
          .sort((a: any, b: any) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

        if (upcoming.length > 0) {
          reminderText = "**Tus próximos recordatorios:**\n\n" + upcoming.map((r: any) =>
            `- **${r.title}**: ${r.date} a las ${r.time}`
          ).join('\n');
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: reminderText,
        timestamp: Date.now()
      };

      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId ? { ...s, messages: updatedMessages } : s
      ));
      setIsLoading(false);
      return;
    }
    try {
      const simulationPromise = simulateExternalSearch();

      const historyForGemini = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const [response, _] = await Promise.all([
        generateBugSolution(userMsg.text, userMsg.images, historyForGemini),
        simulationPromise
      ]);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response,
        timestamp: Date.now()
      };

      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);

      setSessions(prev => prev.map(s =>
        s.id === currentSessionId
          ? { ...s, messages: updatedMessages }
          : s
      ));

    } catch (error) {
      console.error("Error in chat:", error);
    } finally {
      setIsLoading(false);
      setSearchStatus('');
    }
  };

  const startNewSession = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setInput('');
    setSelectedImages([]);
  };

  const loadSession = (session: Session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      startNewSession();
    }
  };

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    setMousePos({ x: clientX - left, y: clientY - top });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`flex h-full overflow-hidden transition-all duration-700 font-sans selection:bg-[#7b68ee]/30 relative group
        ${isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#050507] text-slate-100'}
      `}
    >
      {/* Interactive Spotlight Effect */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${isLight ? 'rgba(123, 104, 238, 0.03)' : 'rgba(123, 104, 238, 0.06)'}, transparent 40%)`
        }}
      />
      {/* Dynamic Cursor Light Effect */}
      <div
        className="pointer-events-none absolute z-50 w-[400px] h-[400px] rounded-full opacity-[0.15] dark:opacity-[0.2] blur-[100px] transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, #7b68ee 0%, transparent 70%)`,
          left: `${mousePos.x - 200}px`,
          top: `${mousePos.y - 200}px`,
        }}
      />
      {/* Professional Sidebar */}
      <div className={`flex flex-col border-r transition-all duration-500 z-30 relative overflow-hidden
        ${isSidebarOpen ? 'w-64 lg:w-72 xl:w-80 3xl:w-96 4xl:w-[550px] opacity-100' : 'w-0 opacity-0 pointer-events-none'}
        ${isLight ? 'bg-white/90 border-slate-200' : 'bg-[#0a0a0f]/90 border-white/5'} backdrop-blur-3xl
      `}>
        {/* Decorative elements for sidebar */}
        <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[30%] bg-gradient-to-br from-[#7b68ee]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="p-5 3xl:p-8 relative z-10">
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2.5 lg:gap-3 xl:gap-4 bg-gradient-to-r from-[#7b68ee] to-[#c084fc] hover:from-[#6b58de] hover:to-[#a855f7] text-white p-3.5 xl:p-4.5 3xl:p-6 rounded-2xl xl:rounded-3xl 3xl:rounded-[2rem] font-black text-xs xl:text-sm 2xl:text-base 3xl:text-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95 group/btn overflow-hidden relative"
          >
            <div className="relative z-10 flex items-center gap-2.5 lg:gap-3">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 3xl:w-8 3xl:h-8 group-hover:rotate-12 transition-transform duration-500" />
              <span className="font-outfit tracking-tight">Nueva Sesión</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 relative z-10">
          <div>
            <div className="flex items-center justify-between px-2 mb-3">
              <h3 className="text-[11px] 2xl:text-lg 3xl:text-xl font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                Historial
              </h3>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/5 ml-3" />
            </div>

            <div className="space-y-1.5">
              {sessions.map((session, idx) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`group relative flex items-center justify-between p-3 xl:p-4 rounded-xl xl:rounded-2xl cursor-pointer transition-all duration-500 border overflow-hidden
                    ${currentSessionId === session.id
                      ? 'bg-white dark:bg-white/10 border-slate-200/50 dark:border-white/10 shadow-2xl shadow-indigo-500/5 scale-[1.02]'
                      : 'hover:bg-white/80 dark:hover:bg-white/[0.03] border-transparent hover:border-slate-100 dark:hover:border-white/5'
                    }
                  `}
                >
                  {/* Active Shine Effect */}
                  {currentSessionId === session.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shine pointer-events-none" />
                  )}

                  <div className="flex items-center gap-3.5 overflow-hidden relative z-10">
                    <div className={`w-9 h-9 xl:w-11 xl:h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6
                      ${currentSessionId === session.id
                        ? 'bg-gradient-to-br from-[#7b68ee] to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-[#7b68ee]/10 group-hover:text-[#7b68ee]'
                      }
                    `}>
                      <Terminal className="w-4 h-4 xl:w-5 xl:h-5" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className={`text-[13px] xl:text-base 2xl:text-xl font-bold truncate transition-colors duration-300 ${currentSessionId === session.id ? 'text-[#7b68ee] dark:text-[#a594ff]' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                        {session.title || 'Sesión sin título'}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest opacity-60">
                          {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {currentSessionId === session.id && (
                          <div className="flex gap-0.5">
                            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                            <div className="w-1 h-1 rounded-full bg-green-500/50 animate-pulse delay-75" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all duration-300 transform hover:scale-110 active:scale-90 relative z-20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-400 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-center">
                    <History className="w-5 h-5 opacity-20" />
                  </div>
                  <div>
                    <p className="text-[13px] 2xl:text-lg font-bold text-slate-500 dark:text-slate-400">Sin historial</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Footer Profile */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 relative z-10">
          <div className={`flex items-center gap-3 p-3 xl:p-4 rounded-xl xl:rounded-2xl transition-all duration-500 border
             ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}
           `}>
            <div className="relative">
              <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-lg bg-gradient-to-br from-[#7b68ee] to-[#c084fc] flex items-center justify-center text-white text-[8px] xl:text-[10px] font-black shadow-md shadow-indigo-500/20">
                DEV
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f] animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] xl:text-sm font-black tracking-tight text-slate-800 dark:text-slate-200">Sistema Activo</p>
              <p className="text-[9px] xl:text-[10px] text-[#7b68ee] font-bold uppercase tracking-widest">v2.4.0 PRO</p>
            </div>
            <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Experience Area */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Dynamic Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <div className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.07] dark:opacity-[0.12] transition-colors duration-1000 animate-blob
            ${isLight ? 'bg-indigo-600' : 'bg-[#7b68ee]'}
          `}></div>
          <div className={`absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.07] dark:opacity-[0.12] transition-colors duration-1000 animate-blob animation-delay-2000
            ${isLight ? 'bg-purple-600' : 'bg-violet-700'}
          `}></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
        </div>

        {/* Premium Header */}
        <div className={`h-16 lg:h-20 xl:h-24 3xl:h-28 4xl:h-36 flex items-center justify-between px-4 lg:px-8 xl:px-10 2xl:px-16 3xl:px-20 4xl:px-32 transition-all duration-500 z-40 border-b
          ${isLight ? 'bg-white/70 border-slate-200/40' : 'bg-[#050507]/70 border-white/[0.03]'} backdrop-blur-2xl
        `}>
          <div className="flex items-center gap-4 3xl:gap-6">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 lg:p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center
                  ${isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-white/5 text-slate-400 hover:bg-white/10'}
                `}
                title="Mostrar Historial"
              >
                <Menu className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
              </button>
            )}
            <div className="relative group cursor-pointer" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
              <div className="relative w-9 h-9 lg:w-12 lg:h-12 xl:w-14 xl:h-14 3xl:w-16 3xl:h-16 bg-gradient-to-br from-[#7b68ee] via-[#6b58de] to-[#a855f7] rounded-lg lg:rounded-xl 3xl:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/10 transition-all duration-500 group-hover:scale-105 border border-white/10">
                <Bot className="w-5 h-5 lg:w-7 lg:h-7 xl:w-8 xl:h-8 3xl:w-10 3xl:h-10 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="absolute -top-1 -right-1 bg-red-500/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PanelLeftClose className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 lg:gap-3 3xl:gap-4">
                <h2 className={`font-black text-sm lg:text-lg xl:text-xl 3xl:text-2xl tracking-tight font-outfit ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Gestor GPT
                </h2>
                <span className="text-[10px] lg:text-xs 3xl:text-sm font-black px-2 py-0.5 rounded-md text-[#7b68ee] bg-[#7b68ee]/5 border border-[#7b68ee]/10 tracking-[0.1em]">PRO</span>
              </div>
              <div className="flex items-center gap-3 lg:gap-4 xl:gap-5 mt-0.5">
                <span className="text-[10px] lg:text-xs xl:text-sm text-slate-400 flex items-center gap-1.5 3xl:gap-2 font-bold uppercase tracking-tighter opacity-50">
                  <Github className="w-3 h-3 lg:w-4 lg:h-4" /> Repositorios
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                <span className="text-[10px] lg:text-xs xl:text-sm text-green-500 flex items-center gap-1.5 2xl:gap-2 font-black uppercase tracking-tighter">
                  <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  Gemini 1.5
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 2xl:gap-8">
            <div className={`hidden md:flex items-center gap-2.5 xl:gap-4 px-4 py-2 xl:px-6 xl:py-3 rounded-xl xl:rounded-2xl text-[10px] lg:text-xs xl:text-sm font-black uppercase tracking-widest border transition-all duration-300
               ${isLight
                ? 'bg-white border-slate-200 text-slate-500 shadow-sm'
                : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:border-white/10 shadow-lg'
              }
             `}>
              <Database className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 opacity-60" />
              <span className="opacity-70">Base de Conocimientos</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 lg:p-8 xl:p-10 2xl:p-16 3xl:p-20 4xl:p-32 scroll-smooth relative z-10">
          {messages.length === 0 ? (
            <div className="min-h-full flex flex-col items-center justify-center text-center max-w-5xl 3xl:max-w-6xl mx-auto py-8 lg:py-12 xl:py-14">
              <div className="relative mb-6 lg:mb-8 xl:mb-10 3xl:mb-16 4xl:mb-24 group cursor-default scale-95 lg:scale-100 xl:scale-110 2xl:scale-100 transition-transform duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-[#7b68ee] to-purple-600 rounded-full blur-[60px] 3xl:blur-[120px] 4xl:blur-[180px] opacity-10 group-hover:opacity-30 transition-opacity duration-1000"></div>
                <div className={`relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 3xl:w-48 3xl:h-48 4xl:w-64 4xl:h-64 rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] xl:rounded-[36px] 3xl:rounded-[48px] 4xl:rounded-[64px] flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:scale-105 group-hover:rotate-3
                  ${isLight ? 'bg-white border border-slate-100 shadow-indigo-500/5' : 'bg-[#0f0f15] border border-white/5 shadow-black/40'}
                `}>
                  <Code2 className="w-10 h-10 lg:w-14 lg:h-14 xl:w-16 xl:h-16 3xl:w-24 3xl:h-24 text-[#7b68ee] drop-shadow-xl animate-float" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 xl:-bottom-2 xl:-right-2 3xl:-bottom-4 3xl:-right-4 w-7 h-7 xl:w-10 xl:h-10 3xl:w-14 3xl:h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg xl:rounded-xl 3xl:rounded-2xl flex items-center justify-center shadow-lg rotate-12 group-hover:rotate-0 transition-transform">
                  <Zap className="w-3.5 h-3.5 xl:w-5 xl:h-5 3xl:w-7 3xl:h-7 text-white" />
                </div>
              </div>

              <h1 className={`text-2xl sm:text-3xl lg:text-5xl xl:text-5xl 2xl:text-6xl 4xl:text-[8rem] font-black mb-2 lg:mb-3 xl:mb-4 3xl:mb-8 font-outfit tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                ¿Qué vamos a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7b68ee] to-[#c084fc]">arreglar?</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg 3xl:max-w-4xl mb-6 lg:mb-8 xl:mb-10 3xl:mb-16 text-sm sm:text-base lg:text-xl 3xl:text-2xl leading-relaxed font-inter font-medium opacity-70">
                Describe tu bug o pega el código. Analizaré el problema para encontrar la solución exacta.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-5 xl:gap-6 3xl:gap-8 w-full max-w-6xl 3xl:max-w-[90rem] px-4 stagger-1">
                {[
                  { icon: AlertTriangle, label: "Analizar Error", desc: "Pega el stack trace", color: "from-red-500/10 to-red-600/10", iconColor: "text-red-500", border: "border-red-500/10" },
                  { icon: Terminal, label: "Depurar Script", desc: "Archivos .js/.ts", color: "from-blue-500/10 to-blue-600/10", iconColor: "text-blue-500", border: "border-blue-500/10" },
                  { icon: ImageIcon, label: "Captura", desc: "Sube una imagen", color: "from-purple-500/10 to-purple-600/10", iconColor: "text-purple-500", border: "border-purple-500/10" },
                  { icon: Bell, label: "Ver Recordatorios", desc: "Próximos eventos", color: "from-orange-500/10 to-orange-600/10", iconColor: "text-orange-500", border: "border-orange-500/10" },
                  { icon: Search, label: "Docs", desc: "Documentación", color: "from-green-500/10 to-green-600/10", iconColor: "text-green-500", border: "border-green-500/10" },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(`Ayuda con: ${item.label}... `)}
                    className={`group relative p-2.5 sm:p-3 xl:p-4 2xl:p-6 3xl:p-8 rounded-lg sm:rounded-xl xl:rounded-2xl 2xl:rounded-[28px] 3xl:rounded-[32px] text-left transition-all duration-300 border animate-in fade-in-up fill-mode-backwards
                      ${isLight
                        ? 'bg-white border-slate-200 hover:border-[#7b68ee]/30 hover:shadow-md'
                        : 'bg-[#0a0a0f] border-white/5 hover:border-[#7b68ee]/30 hover:shadow-lg'
                      }
                      hover:-translate-y-1 active:scale-95
                    `}
                  >
                    <div className="flex items-center gap-2 xl:gap-4 3xl:gap-6">
                      <div className={`p-1.5 sm:p-2 xl:p-2.5 2xl:p-3.5 3xl:p-4 rounded-lg xl:rounded-xl 2xl:rounded-2xl 3xl:rounded-2xl transition-all duration-300 group-hover:scale-110 bg-gradient-to-br ${item.color} ${item.iconColor} ${item.border} border`}>
                        <item.icon className="w-3.5 h-3.5 xl:w-5 xl:h-5 3xl:w-8 3xl:h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between xl:mb-0.5 3xl:mb-1">
                          <span className={`font-black text-xs sm:text-sm xl:text-base 2xl:text-lg 3xl:text-xl tracking-tight font-jakarta whitespace-nowrap ${isLight ? 'text-slate-800' : 'text-white'}`}>{item.label}</span>
                        </div>
                        <p className="text-[10px] xl:text-[11px] 2xl:text-xs 3xl:text-sm text-slate-500 dark:text-slate-400 font-inter opacity-60 group-hover:opacity-100 transition-opacity leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl 2xl:max-w-6xl mx-auto pb-8 2xl:pb-20">
              {messages.map((msg, idx) => (
                <MessageBubble key={msg.id} message={msg} isLatest={idx === messages.length - 1} />
              ))}

              {/* Intelligent Search Simulation */}
              {searchStatus && (
                <div className="flex items-center gap-4 2xl:gap-10 mb-12 2xl:mb-24 animate-in fade-in duration-500 pl-[52px] 2xl:pl-[88px]">
                  <div className="relative flex items-center justify-center w-8 h-8 2xl:w-16 2xl:h-16">
                    <div className="absolute inset-0 rounded-lg 2xl:rounded-2xl border border-[#7b68ee]/20"></div>
                    <div className="absolute inset-0 rounded-lg 2xl:rounded-2xl border border-[#7b68ee] border-t-transparent animate-spin"></div>
                    <Bot className="w-3.5 h-3.5 2xl:w-7 2xl:h-7 text-[#7b68ee] opacity-80" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] 2xl:text-2xl font-black text-[#7b68ee] animate-pulse uppercase tracking-[0.15em] opacity-80">
                      {searchStatus}
                    </span>
                    <span className="text-[8px] 2xl:text-base text-slate-400 font-bold uppercase tracking-[0.2em] opacity-30">Unidad de Procesamiento Neuronal</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4 2xl:h-10" />
            </div>
          )}
        </div>

        {/* Premium Message Input Area */}
        <div className="p-3 lg:p-4 xl:p-6 3xl:p-10 4xl:p-20 relative z-40 bg-gradient-to-t from-slate-50 dark:from-[#050507] via-slate-50/80 dark:via-[#050507]/80 to-transparent">
          <div className={`max-w-5xl 3xl:max-w-6xl mx-auto rounded-xl lg:rounded-2xl 3xl:rounded-[2.5rem] 4xl:rounded-[4rem] border shadow-2xl transition-all duration-500 group/input focus-within:scale-[1.01] focus-within:shadow-[#7b68ee]/20
            ${isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#0f0f15]/80 border-white/5 focus-within:border-[#7b68ee]/30 backdrop-blur-xl shadow-black/40'
            }
          `}>
            {selectedImages.length > 0 && (
              <div className="flex gap-2 3xl:gap-3 mb-2 3xl:mb-4 px-3 3xl:px-4 pt-3 3xl:pt-4 overflow-x-auto custom-scrollbar pb-2">
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative group shrink-0 animate-in fade-in zoom-in duration-500">
                    <img src={img} alt="Vista previa" className="h-12 3xl:h-20 rounded-lg 3xl:rounded-xl border border-slate-200/50 dark:border-white/[0.05] shadow-lg object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-30"
                    >
                      <X className="w-2 h-2 3xl:w-4 3xl:h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2 2xl:gap-4 3xl:gap-6 p-2 2xl:p-4 3xl:p-6">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 2xl:p-5 3xl:p-6 rounded-xl 2xl:rounded-2xl shrink-0 transition-all duration-500 mb-0.5 group/btn
                  ${isLight
                    ? 'hover:bg-slate-100 text-slate-400 hover:text-[#7b68ee]'
                    : 'hover:bg-white/[0.03] text-slate-500 hover:text-[#7b68ee]'
                  }
                `}
                title="Adjuntar contexto"
              >
                <ImageIcon className="w-5 h-5 2xl:w-10 3xl:w-14 2xl:h-10 3xl:h-14 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ayuda con: Actualización PIG 2026..."
                className={`w-full bg-transparent border-none outline-none resize-none max-h-32 2xl:max-h-64 4xl:max-h-96 min-h-[44px] 2xl:min-h-[80px] 3xl:min-h-[100px] py-3 2xl:py-5 text-[15px] 2xl:text-3xl 4xl:text-4xl leading-relaxed font-medium
                  ${isLight ? 'text-slate-700 placeholder-slate-400/60' : 'text-slate-300 placeholder-slate-500/60'}
                `}
                style={{ height: 'auto', fieldSizing: 'content' } as any}
              />

              <div className="hidden md:flex items-center gap-2 2xl:gap-4 3xl:gap-6 mb-2 2xl:mb-5 3xl:mb-8 px-3 2xl:px-6 py-2 2xl:py-4 rounded-lg 2xl:rounded-2xl bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/30 dark:border-white/[0.03] opacity-0 group-focus-within/input:opacity-100 transition-all duration-700">
                <Command className="w-3 h-3 2xl:w-6 3xl:w-8 2xl:h-6 3xl:h-8 text-slate-400" />
                <span className="text-[10px] 2xl:text-xl 3xl:text-2xl font-black text-slate-400 uppercase tracking-[0.2em]">Enter</span>
              </div>

              <button
                onClick={handleSend}
                disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
                className={`p-3 2xl:p-6 3xl:p-8 rounded-xl 2xl:rounded-2xl 3xl:rounded-[2rem] shrink-0 transition-all duration-500 mb-0.5 3xl:mb-1 flex items-center justify-center relative overflow-hidden
                  ${(!input.trim() && selectedImages.length === 0) || isLoading
                    ? 'bg-slate-100/50 dark:bg-white/[0.02] text-slate-300 dark:text-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#7b68ee] to-violet-600 text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95'
                  }
                `}
              >
                {isLoading ? <Loader2 className="w-5 h-5 2xl:w-10 3xl:w-12 animate-spin" /> : <Send className="w-5 h-5 2xl:w-10 3xl:w-12" />}
              </button>
            </div>

            <div className="px-4 2xl:px-12 pb-1 lg:pb-1.5 2xl:pb-6 flex justify-center border-t border-slate-200/10 dark:border-white/[0.02] mt-0 lg:mt-0.5 2xl:mt-2 pt-1 lg:pt-1.5 2xl:pt-6">
              <p className="text-[6px] 2xl:text-base text-slate-500 font-black uppercase tracking-[0.4em] opacity-20 flex items-center gap-2 2xl:gap-8 hover:opacity-40 transition-opacity cursor-default">
                <span className="w-0.5 h-0.5 2xl:w-3 2xl:h-3 rounded-full bg-[#7b68ee] animate-pulse"></span>
                Canal Neuronal Seguro
                <span className="w-0.5 h-0.5 2xl:w-3 2xl:h-3 rounded-full bg-[#7b68ee] animate-pulse"></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestorGPT;
