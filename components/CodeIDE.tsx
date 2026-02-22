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
  ArrowRight
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

interface CodeIDEProps {
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
    <div className="relative group my-4 2xl:my-8 rounded-xl 2xl:rounded-3xl overflow-hidden border border-slate-200/20 dark:border-white/[0.03] bg-white/40 dark:bg-[#0b0b0f]/20 backdrop-blur-md transition-all duration-500 hover:border-[#7b68ee]/20 hover:shadow-2xl hover:shadow-indigo-500/5">
      <div className="flex items-center justify-between px-4 py-2 2xl:px-8 2xl:py-4 bg-slate-50/10 dark:bg-white/[0.01] border-b border-slate-200/20 dark:border-white/[0.03]">
        <div className="flex items-center gap-3 2xl:gap-6">
          <div className="flex gap-1.5 2xl:gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 2xl:w-4 2xl:h-4 rounded-full bg-red-500/40" />
            <div className="w-2 h-2 2xl:w-4 2xl:h-4 rounded-full bg-yellow-500/40" />
            <div className="w-2 h-2 2xl:w-4 2xl:h-4 rounded-full bg-green-500/40" />
          </div>
          <div className="w-px h-3 2xl:h-6 bg-slate-200 dark:bg-white/10 mx-1" />
          <span className="text-[9px] 2xl:text-base font-black text-slate-400 dark:text-slate-500 font-mono uppercase tracking-[0.2em]">{language || 'code'}</span>
        </div>
        <button 
          onClick={handleCopy}
          className={`flex items-center gap-2 2xl:gap-4 px-2.5 py-1 2xl:px-6 2xl:py-3 rounded-lg 2xl:rounded-2xl transition-all duration-300 text-[9px] 2xl:text-base font-black uppercase tracking-widest
            ${copied 
              ? 'bg-green-500/10 text-green-500' 
              : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-400 dark:text-slate-500 opacity-40 hover:opacity-100'
            }
          `}
        >
          {copied ? <Check className="w-3 h-3 2xl:w-6 2xl:h-6" /> : <Copy className="w-3 h-3 2xl:w-6 2xl:h-6" />}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>
      <div className="p-4 2xl:p-10 overflow-x-auto custom-scrollbar">
        <pre className="font-mono text-[10.5px] 2xl:text-xl leading-relaxed text-slate-600 dark:text-slate-400 selection:bg-[#7b68ee]/20">
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
        <div key={index} className="space-y-3 2xl:space-y-6 mb-3 2xl:mb-6 last:mb-0">
          {part.split('\n\n').map((paragraph, pIdx) => (
            <p key={pIdx} className="leading-relaxed text-[13px] 2xl:text-2xl font-medium tracking-tight opacity-90">
              {paragraph.split(/(\*\*.*?\*\*)/g).map((subPart, i) => {
                if (subPart.startsWith('**') && subPart.endsWith('**')) {
                  return <strong key={i} className="font-bold text-[#7b68ee] dark:text-[#a594ff] px-1.5 py-0.5 2xl:px-4 2xl:py-2 rounded-md 2xl:rounded-2xl bg-[#7b68ee]/5 border border-[#7b68ee]/10">{subPart.slice(2, -2)}</strong>;
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
    <div className={`flex gap-5 2xl:gap-8 mb-10 group ${isUser ? 'flex-row-reverse' : ''} animate-in fade-in-up duration-700 slide-in-from-bottom-4`}>
      <div className={`w-8 h-8 2xl:w-14 2xl:h-14 rounded-xl 2xl:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-700 group-hover:scale-110 group-hover:-rotate-3 shadow-lg relative
        ${isUser 
          ? 'bg-gradient-to-br from-indigo-500/80 to-purple-600/80 shadow-indigo-500/10' 
          : 'bg-gradient-to-br from-[#7b68ee]/80 to-violet-600/80 shadow-indigo-500/10'
        }
      `}>
        {isUser ? <User className="w-3.5 h-3.5 2xl:w-7 2xl:h-7 text-white/90" /> : <Bot className="w-3.5 h-3.5 2xl:w-7 2xl:h-7 text-white/90" />}
        {!isUser && isLatest && (
          <div className="absolute -top-1 -right-1 2xl:-top-2 2xl:-right-2 w-2.5 h-2.5 2xl:w-4 2xl:h-4 bg-green-500 rounded-full border-2 border-white dark:border-[#050507] animate-pulse" />
        )}
      </div>
      
      <div className={`flex-1 max-w-[85%] lg:max-w-[80%] xl:max-w-[75%] 2xl:max-w-[80%] min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-3 mb-2 2xl:mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className={`font-black text-[9px] 2xl:text-sm tracking-[0.2em] uppercase opacity-40 ${isUser ? 'text-indigo-600 dark:text-indigo-400' : 'text-[#7b68ee]'}`}>
            {isUser ? 'Desarrollador' : 'Asistente Debugger'}
          </span>
          <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-white/5" />
          <span className="text-[8px] 2xl:text-sm text-slate-400 font-bold opacity-30">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={`relative p-5 2xl:p-10 rounded-2xl 2xl:rounded-[40px] transition-all duration-500 backdrop-blur-3xl border
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
          
          <div className={`text-slate-600 dark:text-slate-300 text-[13.5px] 2xl:text-2xl leading-relaxed font-medium relative z-10`}>
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

const CodeIDE: React.FC<CodeIDEProps> = ({ isDarkMode = false }) => {

  // Use passed prop or local check, though prop is preferred for synchronization
  const isLight = !isDarkMode;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('debug_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          // Optional: Load last session or start new
          // setCurrentSessionId(parsed[0].id);
          // setMessages(parsed[0].messages);
        }
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
      { text: "Analizando contexto del error...", icon: Bug },
      { text: "Conectando a GitHub API...", icon: Github },
      { text: "Buscando issues similares en repositorios...", icon: Search },
      { text: "Consultando StackOverflow...", icon: Database },
      { text: "Verificando documentación oficial...", icon: Globe },
      { text: "Sintetizando solución óptima...", icon: Lightbulb },
    ];

    for (const step of steps) {
      setSearchStatus(step.text);
      // Random delay between 800ms and 1500ms for realism
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

    // Create session if not exists
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
      // Update existing session
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: [...s.messages, userMsg] }
          : s
      ));
    }

    // Trigger AI
    try {
      // Run simulation in parallel with actual API call start, but await simulation before showing result
      const simulationPromise = simulateExternalSearch();
      
      // Convert current messages to history format for Gemini
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

      // Update session with AI response
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

  return (
    <div className={`flex h-full transition-colors duration-500 overflow-hidden relative font-sans selection:bg-[#7b68ee]/30
      ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#09090b] text-slate-100'}
    `}>
      {/* Sidebar - History */}
      <div className={`w-64 lg:w-72 xl:w-80 2xl:w-96 flex flex-col border-r transition-all duration-300 z-20
        ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-[#09090b]/50 border-white/5'} backdrop-blur-xl
      `}>
        <div className="p-5 2xl:p-8 flex items-center justify-between">
          <h2 className={`font-bold text-sm 2xl:text-lg tracking-wide uppercase ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Historial
          </h2>
          <button 
            onClick={startNewSession}
            className={`p-1.5 2xl:p-3 rounded-md 2xl:rounded-xl transition-all duration-300 opacity-40 hover:opacity-100
              ${isLight ? 'text-slate-400 hover:text-indigo-600' : 'text-slate-500 hover:text-white'}
            `}
            title="Nueva Sesión"
          >
            <Sparkles className="w-3.5 h-3.5 2xl:w-6 2xl:h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 2xl:px-5 pb-3 2xl:pb-5">
          <div className="space-y-2 2xl:space-y-4">
            {sessions.map(session => (
              <div 
                key={session.id} 
                onClick={() => loadSession(session)}
                className={`group flex items-center justify-between py-2 2xl:py-4 px-3 2xl:px-5 rounded-lg 2xl:rounded-2xl cursor-pointer transition-all duration-200
                  ${currentSessionId === session.id 
                    ? (isLight ? 'bg-indigo-50/50 text-indigo-600' : 'bg-white/5 text-white')
                    : (isLight ? 'text-slate-500 hover:bg-slate-100/50' : 'text-slate-400 hover:bg-white/5')
                  }
                `}
              >
                <div className="flex items-center gap-2.5 2xl:gap-4 overflow-hidden">
                  <div className={`shrink-0 transition-colors
                    ${currentSessionId === session.id 
                      ? (isLight ? 'text-indigo-500' : 'text-white') 
                      : 'text-slate-400 opacity-40'
                    }
                  `}>
                    <History className="w-3.5 h-3.5 2xl:w-6 2xl:h-6" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[13px] 2xl:text-lg font-medium truncate">
                      {session.title || 'Consulta sin título'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-40 p-1 hover:opacity-100 text-slate-400 hover:text-red-500 rounded transition-all"
                >
                  <Trash2 className="w-3 h-3 2xl:w-5 2xl:h-5" />
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-400 text-center">
                <div className="w-12 h-12 2xl:w-20 2xl:h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 2xl:mb-6">
                  <History className="w-6 h-6 2xl:w-10 2xl:h-10 opacity-50" />
                </div>
                <p className="text-sm 2xl:text-xl font-medium">Sin historial</p>
                <p className="text-xs 2xl:text-base opacity-60 mt-1 2xl:mt-3">Tus consultas aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
        
        {/* User Mini Profile / Settings */}
        <div className="p-4 2xl:p-8 border-t border-slate-100 dark:border-white/5">
           <div className={`flex items-center gap-3 2xl:gap-5 p-2.5 2xl:p-5 rounded-xl 2xl:rounded-3xl transition-colors
             ${isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-white/5 hover:bg-white/10'}
           `}>
             <div className="w-8 h-8 2xl:w-12 2xl:h-12 rounded-lg 2xl:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs 2xl:text-base font-bold">
               PRO
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-xs 2xl:text-lg font-semibold truncate text-slate-700 dark:text-slate-200">Debugger Pro</p>
               <p className="text-[10px] 2xl:text-sm text-green-500 flex items-center gap-1">
                 <span className="w-1.5 h-1.5 2xl:w-2.5 2xl:h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                 System Online
               </p>
             </div>
             <Zap className="w-4 h-4 2xl:w-6 2xl:h-6 text-yellow-500 fill-yellow-500/20" />
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 transition-colors duration-700
            ${isLight ? 'bg-indigo-300' : 'bg-[#7b68ee]'}
          `}></div>
          <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2 transition-colors duration-700
            ${isLight ? 'bg-purple-300' : 'bg-violet-600'}
          `}></div>
        </div>

        {/* Header */}
        <div className={`h-14 lg:h-16 2xl:h-24 flex items-center justify-between px-8 2xl:px-14 transition-all duration-500 z-40 border-b
          ${isLight ? 'bg-white/70 border-slate-200/40' : 'bg-[#050507]/70 border-white/[0.03]'} backdrop-blur-2xl
        `}>
          <div className="flex items-center gap-4 2xl:gap-8">
            <div className="relative group cursor-pointer">
              <div className={`relative w-8 h-8 2xl:w-16 2xl:h-16 rounded-lg 2xl:rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-105 border border-white/10
                ${isLight ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/10' : 'bg-gradient-to-br from-[#7b68ee] via-[#6b58de] to-[#a855f7] shadow-indigo-500/10'}
              `}>
                <Code2 className="w-4 h-4 2xl:w-8 2xl:h-8 text-white" />
                <div className="absolute inset-0 rounded-lg 2xl:rounded-3xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div>
              <h1 className="text-[13px] 2xl:text-2xl font-black tracking-[0.15em] uppercase flex items-center gap-2 2xl:gap-4">
                CodeIDE
                <span className={`px-1.5 py-0.5 2xl:px-3 2xl:py-1 rounded text-[8px] 2xl:text-xs font-bold border ${isLight ? 'border-indigo-100 bg-indigo-50 text-indigo-600' : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'}`}>BETA</span>
              </h1>
              <p className="text-[10px] 2xl:text-base font-bold text-slate-400 opacity-60 uppercase tracking-widest">IA Debugging Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-2 2xl:gap-6">
            <div className={`hidden sm:flex items-center gap-1.5 2xl:gap-4 px-3 py-1 2xl:px-6 2xl:py-3 rounded-full border text-[10px] 2xl:text-base font-bold
              ${isLight ? 'border-slate-100 bg-slate-50/50 text-slate-500' : 'border-white/[0.03] bg-white/[0.02] text-slate-400'}
            `}>
              <div className="w-1.5 h-1.5 2xl:w-3 2xl:h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
              <span>Secure Channel</span>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 2xl:p-24 text-center max-w-4xl 2xl:max-w-7xl mx-auto">
              <div className="mb-8 2xl:mb-16 relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] 2xl:blur-[120px] rounded-full animate-pulse" />
                <div className={`relative w-24 h-24 2xl:w-48 2xl:h-48 rounded-[30px] 2xl:rounded-[60px] flex items-center justify-center border transition-all duration-700
                  ${isLight ? 'bg-white border-slate-100 shadow-2xl' : 'bg-white/[0.02] border-white/5 shadow-2xl shadow-black/40'}
                `}>
                  <Bot className="w-12 h-12 2xl:w-24 2xl:h-24 text-indigo-500" />
                </div>
              </div>
              
              <h2 className="text-4xl 2xl:text-7xl font-black mb-6 2xl:mb-10 tracking-tight">
                ¿Qué vamos a <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">depurar</span> hoy?
              </h2>
              <p className={`text-base 2xl:text-3xl max-w-lg 2xl:max-w-4xl mx-auto mb-12 2xl:mb-20 font-medium leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Pega tu código con errores o sube una captura de pantalla. Analizaré el flujo, buscaré soluciones en la red y optimizaré tu lógica.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 2xl:gap-8 w-full max-w-3xl 2xl:max-w-5xl">
                {[
                  { icon: Bug, title: "Fix de Errores", desc: "Analiza logs y trazas de error", color: "from-red-500/20 to-orange-500/20" },
                  { icon: Zap, title: "Optimización", desc: "Mejora el rendimiento del código", color: "from-yellow-500/20 to-amber-500/20" },
                  { icon: Terminal, title: "Explicación", desc: "Entiende qué hace cada línea", color: "from-blue-500/20 to-indigo-500/20" },
                  { icon: Database, title: "Query Debug", desc: "Optimiza tus consultas SQL", color: "from-green-500/20 to-emerald-500/20" }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(item.title)}
                    className={`group p-6 2xl:p-10 rounded-2xl 2xl:rounded-[40px] border text-left transition-all duration-300 hover:scale-[1.02]
                      ${isLight ? 'bg-white border-slate-100 hover:shadow-xl' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}
                    `}
                  >
                    <div className={`w-12 h-12 2xl:w-20 2xl:h-20 rounded-xl 2xl:rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 2xl:mb-8 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6 2xl:w-10 2xl:h-10 text-slate-600 dark:text-slate-300" />
                    </div>
                    <h3 className="text-sm 2xl:text-2xl font-black uppercase tracking-wider mb-2 2xl:mb-4">{item.title}</h3>
                    <p className={`text-xs 2xl:text-lg font-medium opacity-60 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 lg:p-12 2xl:p-24 max-w-5xl 2xl:max-w-7xl mx-auto">
              {messages.map((msg, i) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  isLatest={i === messages.length - 1} 
                />
              ))}
              
              {searchStatus && (
                <div className="flex gap-5 2xl:gap-8 mb-10 animate-in fade-in duration-500">
                  <div className="w-8 h-8 2xl:w-16 2xl:h-16 rounded-xl 2xl:rounded-3xl bg-indigo-500/10 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 2xl:w-8 2xl:h-8 text-indigo-500 animate-spin" />
                  </div>
                  <div className={`px-4 py-2 2xl:px-8 2xl:py-4 rounded-2xl 2xl:rounded-3xl border ${isLight ? 'bg-white border-slate-100' : 'bg-white/[0.02] border-white/5'} flex items-center gap-3 2xl:gap-6`}>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 h-1 2xl:w-2 2xl:h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <span className="text-[11px] 2xl:text-xl font-bold tracking-wide text-indigo-500 uppercase">{searchStatus}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-6 lg:px-12 xl:px-24 2xl:px-48 py-8 2xl:py-24 border-t ${isLight ? 'bg-white/80 border-slate-100' : 'bg-[#050507]/80 border-white/5'} backdrop-blur-xl`}>
          <div className="max-w-5xl 2xl:max-w-[1400px] mx-auto relative">
            {/* Image Previews */}
            {selectedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 2xl:gap-8 mb-4 2xl:mb-12 animate-in slide-in-from-bottom-2 duration-300">
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative group rounded-xl 2xl:rounded-[40px] overflow-hidden border border-slate-200/50 dark:border-white/10 shadow-xl">
                    <img src={img} alt="Preview" className="h-16 2xl:h-48 w-auto object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                    <button 
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 2xl:top-5 2xl:right-5 p-1 2xl:p-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-3 h-3 2xl:w-8 2xl:h-8" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={`relative rounded-2xl 2xl:rounded-[50px] border transition-all duration-500 shadow-2xl
              ${isLight 
                ? 'bg-slate-50 border-slate-200/60 focus-within:border-indigo-500/50 focus-within:shadow-indigo-500/10' 
                : 'bg-white/[0.02] border-white/5 focus-within:border-[#7b68ee]/40 focus-within:bg-white/[0.04] focus-within:shadow-indigo-500/5'
              }
            `}>
              <div className="flex items-end p-2 2xl:p-10">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 2xl:p-8 rounded-xl 2xl:rounded-[32px] transition-all duration-300 group
                    ${isLight ? 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-500' : 'hover:bg-white/5 text-slate-500 hover:text-white'}
                  `}
                >
                  <ImageIcon className="w-5 h-5 2xl:w-12 2xl:h-12 transition-transform group-hover:scale-110" />
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
                  placeholder="Describe el error o pega tu código..."
                  className="flex-1 bg-transparent border-none focus:ring-0 py-3 2xl:py-10 px-4 2xl:px-12 text-[13.5px] 2xl:text-3xl placeholder:text-slate-400/50 dark:placeholder:text-slate-500/50 resize-none max-h-48 2xl:max-h-[600px] min-h-[44px] 2xl:min-h-[120px] font-medium leading-relaxed"
                />

                <div className="flex items-center gap-2 2xl:gap-8 p-1.5 2xl:p-6">
                  <div className={`hidden lg:flex items-center gap-2 2xl:gap-5 px-3 py-1.5 2xl:px-8 2xl:py-4 rounded-lg 2xl:rounded-3xl border text-[9px] 2xl:text-lg font-black tracking-widest uppercase
                    ${isLight ? 'bg-white/50 border-slate-200 text-slate-400' : 'bg-black/20 border-white/5 text-slate-500'}
                  `}>
                    <Command className="w-3 h-3 2xl:w-8 2xl:h-8" />
                    <span>Enter</span>
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
                    className={`p-3 2xl:p-8 rounded-xl 2xl:rounded-[32px] transition-all duration-500 shadow-xl
                      ${(!input.trim() && selectedImages.length === 0) || isLoading
                        ? 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:scale-105 active:scale-95 shadow-indigo-500/20'
                      }
                    `}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 2xl:w-12 2xl:h-12 animate-spin" /> : <Send className="w-5 h-5 2xl:w-12 2xl:h-12" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4 2xl:mt-16 flex items-center justify-between px-2 2xl:px-12">
              <p className={`text-[10px] 2xl:text-2xl font-bold uppercase tracking-[0.2em] opacity-30 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                IA Debugger <span className="mx-2 2xl:mx-6">|</span> Solution Engine v2.0
              </p>
              <div className="flex items-center gap-4 2xl:gap-12 opacity-30">
                <div className="flex items-center gap-1.5 2xl:gap-5">
                  <div className="w-1.5 h-1.5 2xl:w-4 2xl:h-4 rounded-full bg-indigo-500" />
                  <span className="text-[9px] 2xl:text-lg font-black uppercase tracking-widest">Global Search</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        multiple 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default CodeIDE;
