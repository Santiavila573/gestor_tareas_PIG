import React, { useState, useEffect, useRef } from 'react';
import { User, Role, TeamChatMessage, Channel } from '../models/types';
import {
    Hash, Plus, Image as ImageIcon, Smile, Send,
    Video, Info, FileText, Lock, X,
    Download, ChevronLeft,
    Reply, AtSign,
    Search, Star, Mic, Sparkles, XCircle, Home, Bot
} from 'lucide-react';

interface TeamChatProps {
    currentUser: User | null;
    users: User[];
    onClose?: () => void;
    onNavigateToMeeting?: () => void;
    onNavigateToHome?: () => void;
}

const MOCK_CHANNELS: Channel[] = [
    { id: 'c1', name: 'general', type: 'public', description: 'Discusión general del equipo' },
    { id: 'c2', name: 'anuncios', type: 'public', description: 'Noticias importantes y actualizaciones' },
    { id: 'c3', name: 'sprint-11', type: 'public', description: 'Coordinación del sprint actual' },
    { id: 'c4', name: 'proyecto-api', type: 'private', description: 'Desarrollo del backend' },
    { id: 'c5', name: 'design-system', type: 'public', description: 'Recursos de diseño y UI' },
];

const MOCK_MESSAGES: TeamChatMessage[] = [
    { id: 'm1', channelId: 'c1', senderId: 'u2', content: '¿Alguien ha revisado los últimos cambios en la API?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), readBy: ['u2'], reactions: [{ emoji: '👀', count: 2, userIds: ['u1', 'u3'] }] },
    { id: 'm2', channelId: 'c1', senderId: 'u3', content: 'Sí, ya hice el merge. Todo parece estar estable.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9), readBy: ['u2', 'u3'], reactions: [{ emoji: '🚀', count: 1, userIds: ['u2'] }] },
    { id: 'm3', channelId: 'c1', senderId: 'u1', content: 'Perfecto. Recordad actualizar la documentación.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.8), readBy: ['u1', 'u2', 'u3'] },
];

const COMMON_EMOJIS = ['👍', '👋', '🎉', '🚀', '😄', '😂', '🔥', '❤️', '✅', '👀', '🤔', '🙌', '💯', '✨', '💻', '🐛'];
const CHAT_STORAGE_KEY = 'scrum_team_chat_messages_v3';
const CHAT_CHANNELS_KEY = 'scrum_team_chat_channels_v3';

// Extracted Components to prevent re-renders
interface MessageBubbleProps {
    msg: TeamChatMessage;
    isOwn: boolean;
    isSequential: boolean;
    users: User[];
    currentUser: User | null;
    onReaction: (id: string, emoji: string) => void;
    onReply: (msg: TeamChatMessage) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    msg, 
    isOwn, 
    isSequential, 
    users, 
    currentUser, 
    onReaction, 
    onReply 
}) => {
    const sender = users.find(u => u.id === msg.senderId);
    
    // Helper for safe time formatting
    const formatTime = (date: Date) => {
        try {
            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch (e) {
            return '--:--';
        }
    };
    
    return (
        <div className={`group flex gap-3 ${isSequential ? 'mt-1' : 'mt-6'} ${isOwn ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {!isSequential && !isOwn && (
                <img src={sender?.avatar || `https://ui-avatars.com/api/?name=${sender?.name || 'User'}&background=random`} alt={sender?.name || 'Desconocido'} className="w-8 h-8 rounded-full mt-1 shadow-sm hover:scale-110 transition-transform" />
            )}
            {isSequential && !isOwn && <div className="w-8" />}

            <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isSequential && !isOwn && (
                    <div className="flex items-baseline gap-2 mb-1 ml-1">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 hover:underline cursor-pointer">{sender?.name || 'Usuario Desconocido'}</span>
                        <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                    </div>
                )}
                
                <div className="relative group/bubble">
                        {/* Reply Context */}
                        {msg.replyToId && (
                        <div className="mb-1 text-xs text-gray-500 bg-gray-100 dark:bg-[#2a2b36] px-2 py-1 rounded-md border-l-2 border-[#7b68ee] opacity-80 flex items-center gap-1">
                            <Reply className="w-3 h-3" />
                            <span>Respondiendo a un mensaje...</span>
                        </div>
                    )}

                    <div 
                        className={`px-4 py-2.5 shadow-sm text-sm leading-relaxed relative
                            ${isOwn 
                                ? 'bg-[#7b68ee] text-white rounded-2xl rounded-tr-sm' 
                                : 'bg-white dark:bg-[#2a2b36] text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-700'
                            }
                        `}
                    >
                        {msg.content}
                        
                        {/* Message Actions (Hover) */}
                        <div className={`absolute top-0 ${isOwn ? '-left-12' : '-right-12'} opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 p-1`}>
                            <button onClick={() => onReaction(msg.id, '👍')} className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a2b36] rounded-full text-gray-400 hover:text-[#7b68ee] transition-colors"><Smile className="w-4 h-4" /></button>
                            <button onClick={() => onReply(msg)} className="p-1 hover:bg-gray-100 dark:hover:bg-[#2a2b36] rounded-full text-gray-400 hover:text-[#7b68ee] transition-colors"><Reply className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            {msg.reactions.map((reaction, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => onReaction(msg.id, reaction.emoji)}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all hover:scale-105 ${
                                        reaction.userIds.includes(currentUser?.id || '')
                                            ? 'bg-[#7b68ee]/10 border-[#7b68ee]/30 text-[#7b68ee]'
                                            : 'bg-gray-50 dark:bg-[#2a2b36] border-gray-200 dark:border-gray-700 text-gray-500'
                                    }`}
                                >
                                    <span>{reaction.emoji}</span>
                                    <span className="font-bold">{reaction.count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Attachments */}
                {msg.attachments?.map((att, i) => (
                        <div key={i} className="mt-2 group/att relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2a2b36]">
                        {att.type === 'image' ? (
                            <div className="relative">
                                <img src={att.url} alt={att.name} className="max-w-[200px] max-h-[200px] object-cover hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/att:opacity-100 transition-opacity flex items-center justify-center">
                                    <Download className="w-6 h-6 text-white cursor-pointer hover:scale-110" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 min-w-[200px]">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-500">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{att.name}</p>
                                    <p className="text-[10px] text-gray-500">{att.size}</p>
                                </div>
                                <Download className="w-4 h-4 text-gray-400 hover:text-[#7b68ee] cursor-pointer" />
                            </div>
                        )}
                        </div>
                ))}
            </div>
        </div>
    );
};

interface SidebarProps {
    mobileView: 'list' | 'chat';
    onClose?: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    channels: Channel[];
    activeChannelId: string;
    setActiveChannelId: (id: string) => void;
    setMobileView: (view: 'list' | 'chat') => void;
    users: User[];
    currentUser: User | null;
}

const getChannelIcon = (channel: Channel) => {
    if (channel.type === 'private') return <Lock className="w-4 h-4" />;
    return <Hash className="w-4 h-4" />;
};

const Sidebar = ({
    mobileView,
    onClose,
    searchQuery,
    setSearchQuery,
    channels,
    activeChannelId,
    setActiveChannelId,
    setMobileView,
    users,
    currentUser
}: SidebarProps) => (
    <div className={`w-full md:w-72 bg-gray-50/50 dark:bg-[#1e1e2d]/50 backdrop-blur-xl border-r border-gray-200 dark:border-[#2a2b36] flex flex-col h-full ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#2a2b36] flex items-center justify-between sticky top-0 bg-inherit z-10">
            <h2 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7b68ee]" />
                Team Chat
            </h2>
            <button onClick={onClose} className="md:hidden p-2 text-gray-500 hover:bg-gray-200 rounded-full">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Search */}
        <div className="p-3">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar canales o mensajes..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7b68ee] text-slate-700 dark:text-slate-200 shadow-sm transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6">
            {/* Public Channels */}
            <div className="space-y-1">
                <div className="px-3 flex items-center justify-between group mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-[#7b68ee] transition-colors">Canales</span>
                    <button className="p-1 text-slate-400 hover:bg-[#7b68ee]/10 hover:text-[#7b68ee] rounded opacity-0 group-hover:opacity-100 transition-all">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
                {channels.filter(c => c.type !== 'dm' && c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(channel => (
                    <button
                        key={channel.id}
                        onClick={() => { setActiveChannelId(channel.id); setMobileView('chat'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-backwards ${
                            activeChannelId === channel.id 
                            ? 'bg-white dark:bg-[#2a2b36] text-[#7b68ee] shadow-md shadow-purple-500/10' 
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2b36]/50'
                        }`}
                    >
                        {activeChannelId === channel.id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7b68ee] rounded-r-full" />
                        )}
                        <span className={`opacity-70 group-hover:scale-110 transition-transform ${activeChannelId === channel.id ? 'text-[#7b68ee]' : ''}`}>
                            {getChannelIcon(channel)}
                        </span>
                        <span className="truncate">{channel.name}</span>
                        {channel.type === 'private' && <Lock className="w-3 h-3 ml-auto opacity-50" />}
                    </button>
                ))}
            </div>

            {/* Direct Messages */}
            <div className="space-y-1 stagger-1">
                <div className="px-3 flex items-center justify-between group mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-[#7b68ee] transition-colors">Mensajes Directos</span>
                </div>
                {users.filter(u => u.id !== currentUser?.id && u.name.toLowerCase().includes(searchQuery.toLowerCase())).map(user => {
                    const dmId = [currentUser?.id, user.id].sort().join('_');
                    const isOnline = Math.random() > 0.5; // Mock online status
                    return (
                        <button
                            key={user.id}
                            onClick={() => { setActiveChannelId(dmId); setMobileView('chat'); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-backwards ${
                                activeChannelId === dmId
                                ? 'bg-white dark:bg-[#2a2b36] text-[#7b68ee] shadow-md shadow-purple-500/10' 
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2b36]/50'
                            }`}
                        >
                            <div className="relative">
                                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#7b68ee]/30 transition-all" />
                                {isOnline && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#1e1e2d] rounded-full animate-pulse" />
                                )}
                            </div>
                            <span className="truncate flex-1 text-left">{user.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
        
        {/* User Footer */}
        <div className="p-4 bg-white/50 dark:bg-[#16171f]/50 border-t border-gray-200 dark:border-[#2a2b36]">
            <div className="flex items-center gap-3">
                <div className="relative group cursor-pointer">
                    <img src={currentUser?.avatar} className="w-9 h-9 rounded-full ring-2 ring-purple-500/20 group-hover:ring-purple-500 transition-all" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser?.name}</p>
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        En línea
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const TeamChat: React.FC<TeamChatProps> = ({ currentUser, users = [], onClose, onNavigateToMeeting, onNavigateToHome }) => {
    // --- State Management ---
    const [channels, setChannels] = useState<Channel[]>(() => {
        try {
            const saved = localStorage.getItem(CHAT_CHANNELS_KEY);
            return saved ? JSON.parse(saved) : MOCK_CHANNELS;
        } catch (e) { return MOCK_CHANNELS; }
    });

    const [activeChannelId, setActiveChannelId] = useState('c1');
    const [messages, setMessages] = useState<TeamChatMessage[]>(() => {
        try {
            const saved = localStorage.getItem(CHAT_STORAGE_KEY);
            if (saved) {
                const parsed: any[] = JSON.parse(saved);
                // Validate and sanitize loaded messages
                return parsed.map((m, idx) => {
                    const timestamp = new Date(m.timestamp);
                    return {
                        ...m,
                        id: m.id || `restored-${Date.now()}-${idx}`,
                        timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
                        reactions: m.reactions || [],
                        readBy: m.readBy || []
                    };
                });
            }
        } catch (e) { console.error("Failed to load messages", e); }
        return MOCK_MESSAGES;
    });

    const [inputText, setInputText] = useState('');
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTyping, setIsTyping] = useState<string[]>([]); // User IDs typing
    const [replyTo, setReplyTo] = useState<TeamChatMessage | null>(null);
    const [showChannelInfo, setShowChannelInfo] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // --- Effects ---
    useEffect(() => {
        localStorage.setItem(CHAT_CHANNELS_KEY, JSON.stringify(channels));
    }, [channels]);

    useEffect(() => {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages.length, activeChannelId]);

    // Simulate random typing indicators
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                if (randomUser && randomUser.id !== currentUser?.id) {
                    setIsTyping(prev => [...prev, randomUser.id]);
                    setTimeout(() => {
                        setIsTyping(prev => prev.filter(id => id !== randomUser.id));
                    }, 3000);
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [users, currentUser]);

    // --- Helpers ---
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const getChannelName = (id: string) => {
        const channel = channels.find(c => c.id === id);
        if (channel) return channel.name;
        // Check for DM
        if (id.includes('_')) {
            const parts = id.split('_');
            // If currentUser exists, find the other ID. If not, just take the first part as fallback.
            const otherUserId = currentUser ? parts.find(uid => uid !== currentUser.id) : parts[0];
            const user = users.find(u => u.id === otherUserId);
            return user ? user.name : 'Chat Privado';
        }
        return 'Desconocido';
    };

    const handleSendMessage = () => {
        if (!inputText.trim() || !currentUser) return;

        const newMessage: TeamChatMessage = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            channelId: activeChannelId,
            senderId: currentUser.id,
            content: inputText,
            timestamp: new Date(),
            readBy: [currentUser.id],
            replyToId: replyTo?.id
        };

        setMessages([...messages, newMessage]);
        setInputText('');
        setReplyTo(null);
        setShowEmojiPicker(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleReaction = (msgId: string, emoji: string) => {
        if (!currentUser) return;
        setMessages(prev => prev.map(msg => {
            if (msg.id !== msgId) return msg;
            
            const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
            let newReactions = [...(msg.reactions || [])];

            if (existingReaction) {
                if (existingReaction.userIds.includes(currentUser.id)) {
                    // Remove reaction
                    newReactions = newReactions.map(r => 
                        r.emoji === emoji 
                            ? { ...r, count: r.count - 1, userIds: r.userIds.filter(uid => uid !== currentUser.id) }
                            : r
                    ).filter(r => r.count > 0);
                } else {
                    // Add to existing
                    newReactions = newReactions.map(r => 
                        r.emoji === emoji 
                            ? { ...r, count: r.count + 1, userIds: [...r.userIds, currentUser.id] }
                            : r
                    );
                }
            } else {
                // Create new
                newReactions.push({ emoji, count: 1, userIds: [currentUser.id] });
            }
            return { ...msg, reactions: newReactions };
        }));
    };

    // --- Render Components ---

    // Sidebar extracted to external component


    // Remove internal MessageBubble definition since it's now extracted


    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-[#16171f] flex animate-in fade-in duration-300">
            {/* Left Sidebar */}
            <Sidebar 
                mobileView={mobileView}
                onClose={onClose}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                channels={channels}
                activeChannelId={activeChannelId}
                setActiveChannelId={setActiveChannelId}
                setMobileView={setMobileView}
                users={users}
                currentUser={currentUser}
            />

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col h-full bg-[#ffffff] dark:bg-[#16171f] relative ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
                
                {/* Chat Header */}
                <div className="h-16 px-4 border-b border-gray-200 dark:border-[#2a2b36] flex items-center justify-between bg-white/80 dark:bg-[#16171f]/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileView('list')} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7b68ee] to-[#c026d3] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <Hash className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {getChannelName(activeChannelId)}
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 cursor-pointer hover:scale-110 transition-transform" />
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                {channels.find(c => c.id === activeChannelId)?.description || 'Comienza la conversación...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 mr-4">
                            {users.slice(0, 3).map(u => (
                                <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#16171f] hover:scale-110 transition-transform z-0 hover:z-10" />
                            ))}
                            {users.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2a2b36] border-2 border-white dark:border-[#16171f] flex items-center justify-center text-[10px] font-bold text-gray-500">
                                    +{users.length - 3}
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={onNavigateToHome}
                            className="p-2 text-gray-400 hover:text-[#7b68ee] hover:bg-gray-50 dark:hover:bg-[#2a2b36] rounded-full transition-all"
                            title="Volver al Inicio"
                        >
                            <Home className="w-5 h-5" />
                        </button>

                        <button 
                            onClick={onNavigateToMeeting}
                            className="p-2 text-gray-400 hover:text-[#7b68ee] hover:bg-gray-50 dark:hover:bg-[#2a2b36] rounded-full transition-all"
                            title="Iniciar Videollamada"
                        >
                            <Video className="w-5 h-5" />
                        </button>
                        
                        <button 
                            onClick={() => setShowChannelInfo(!showChannelInfo)} 
                            className="p-2 text-gray-400 hover:text-[#7b68ee] hover:bg-gray-50 dark:hover:bg-[#2a2b36] rounded-full transition-all"
                            title="Información del canal"
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div 
                    className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white dark:bg-[#16171f]"
                    ref={chatContainerRef}
                >
                    <div className="max-w-4xl mx-auto pb-4">
                        {/* Welcome Message / Bot Greeting */}
                        <div className="text-center py-10">
                            <div className="relative w-20 h-20 mx-auto mb-4 group cursor-pointer">
                                {/* Glowing Background Effect */}
                                <div className="absolute inset-0 bg-[#7b68ee] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                                
                                {/* Bot Container */}
                                <div className="relative w-full h-full bg-gradient-to-br from-[#7b68ee] to-[#6a5acd] rounded-full flex items-center justify-center shadow-lg shadow-[#7b68ee]/30 transition-transform duration-500 hover:scale-110 hover:rotate-3">
                                    <Bot className="w-10 h-10 text-white animate-bounce [animation-duration:3s]" />
                                    
                                    {/* Cute Eyes Animation (Pseudo-element simulation via dots) */}
                                    <div className="absolute top-[35%] left-[32%] w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                    <div className="absolute top-[35%] right-[32%] w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                    
                                    {/* Status Dot */}
                                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-[#1e1e2d] rounded-full animate-ping [animation-duration:3s]"></div>
                                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-[#1e1e2d] rounded-full"></div>
                                </div>

                                {/* Speech Bubble on Hover */}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-[#2a2b36] text-gray-800 dark:text-white px-3 py-1.5 rounded-xl shadow-xl border border-gray-100 dark:border-white/5 text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
                                    ¡Hola! Soy tu asistente 👋
                                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#2a2b36] rotate-45 border-r border-b border-gray-100 dark:border-white/5"></div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#7b68ee] to-[#f472b6] mb-2">
                                Bienvenido a #{getChannelName(activeChannelId)}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                                Este es el comienzo de algo genial. ¡Saluda al equipo o empieza una nueva conversación!
                            </p>
                        </div>

                        {messages
                            .filter(m => m.channelId === activeChannelId)
                            .map((msg, idx, arr) => {
                                const isOwn = msg.senderId === currentUser?.id;
                                const isSequential = idx > 0 && arr[idx - 1].senderId === msg.senderId && (msg.timestamp.getTime() - arr[idx - 1].timestamp.getTime() < 1000 * 60 * 5);
                                return <MessageBubble 
                                    key={msg.id} 
                                    msg={msg}  
                                    isOwn={isOwn} 
                                    isSequential={isSequential}
                                    users={users}
                                    currentUser={currentUser}
                                    onReaction={handleReaction}
                                    onReply={setReplyTo}
                                />;
                            })
                        }
                        
                        {/* Typing Indicator */}
                        {isTyping.length > 0 && (
                            <div className="flex items-center gap-2 mt-4 ml-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex gap-1 bg-gray-100 dark:bg-[#2a2b36] px-3 py-2 rounded-full">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                </div>
                                <span className="text-xs text-gray-400">Alguien está escribiendo...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-[#16171f] border-t border-gray-200 dark:border-[#2a2b36]">
                    <div className="max-w-4xl mx-auto">
                        {replyTo && (
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-[#2a2b36] px-4 py-2 rounded-t-lg border-b border-gray-200 dark:border-gray-700 text-sm mb-2 animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <Reply className="w-4 h-4 text-[#7b68ee]" />
                                    <span className="font-bold">Respondiendo a:</span>
                                    <span className="truncate max-w-[200px] opacity-70">{replyTo.content}</span>
                                </div>
                                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4" /></button>
                            </div>
                        )}

                        <div className="bg-gray-100 dark:bg-[#2a2b36] rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#7b68ee]/30 focus-within:bg-white dark:focus-within:bg-[#1e1e2d] transition-all shadow-sm">
                            <textarea
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`Enviar mensaje a #${getChannelName(activeChannelId)}...`}
                                className="w-full bg-transparent border-none focus:outline-none resize-none px-3 py-2 min-h-[44px] max-h-32 text-sm custom-scrollbar"
                                rows={1}
                            />
                            
                            <div className="flex items-center justify-between px-2 pb-1 pt-1">
                                <div className="flex items-center gap-1">
                                    <button className="p-2 text-gray-500 hover:text-[#7b68ee] hover:bg-gray-200 dark:hover:bg-[#3a3b46] rounded-full transition-colors relative group">
                                        <Plus className="w-5 h-5" />
                                        <div className="hidden group-hover:flex absolute bottom-full left-0 mb-2 bg-white dark:bg-[#2a2b36] shadow-xl rounded-lg p-1 gap-1 border border-gray-100 dark:border-gray-700">
                                            <div className="p-2 hover:bg-gray-100 rounded-md cursor-pointer"><ImageIcon className="w-4 h-4 text-green-500"/></div>
                                            <div className="p-2 hover:bg-gray-100 rounded-md cursor-pointer"><FileText className="w-4 h-4 text-blue-500"/></div>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                                        className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-gray-200 dark:hover:bg-[#3a3b46] rounded-full transition-colors relative"
                                    >
                                        <Smile className="w-5 h-5" />
                                        {showEmojiPicker && (
                                            <div className="absolute bottom-full left-0 mb-4 p-2 bg-white dark:bg-[#2a2b36] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 grid grid-cols-6 gap-1 w-64 z-50 animate-in zoom-in-95">
                                                {COMMON_EMOJIS.map(emoji => (
                                                    <button 
                                                        key={emoji} 
                                                        onClick={() => setInputText(prev => prev + emoji)}
                                                        className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-transform hover:scale-125"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                    <button className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#3a3b46] rounded-full transition-colors">
                                        <AtSign className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {inputText.length > 0 ? (
                                        <button 
                                            onClick={handleSendMessage}
                                            className="p-2 bg-[#7b68ee] hover:bg-[#6a5acd] text-white rounded-full shadow-lg shadow-purple-500/30 transition-all hover:scale-105 active:scale-95"
                                        >
                                            <Send className="w-4 h-4 ml-0.5" />
                                        </button>
                                    ) : (
                                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                            <Mic className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" />
                            Los mensajes están cifrados de extremo a extremo
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar (Info) */}
            {showChannelInfo && (
                <div className="w-72 bg-white dark:bg-[#1e1e2d] border-l border-gray-200 dark:border-[#2a2b36] hidden lg:flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-gray-200 dark:border-[#2a2b36] flex items-center justify-between">
                        <h3 className="font-bold">Detalles del Canal</h3>
                        <button onClick={() => setShowChannelInfo(false)} className="text-gray-500 hover:bg-gray-100 rounded-full p-1"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="p-6 text-center border-b border-gray-200 dark:border-[#2a2b36]">
                        <div className="w-20 h-20 bg-gradient-to-br from-[#7b68ee] to-[#c026d3] rounded-2xl mx-auto flex items-center justify-center text-white mb-3 shadow-lg shadow-purple-500/30">
                            <Hash className="w-10 h-10" />
                        </div>
                        <h2 className="font-bold text-lg">#{getChannelName(activeChannelId)}</h2>
                        <p className="text-sm text-gray-500 mt-1">Creado el 12 de Oct, 2025</p>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Miembros ({users.length})</h4>
                        <div className="space-y-3">
                            {users.map(u => (
                                <div key={u.id} className="flex items-center gap-3">
                                    <img src={u.avatar} className="w-8 h-8 rounded-full" />
                                    <span className="text-sm font-medium">{u.name}</span>
                                    {u.role === Role.SYSTEM_ADMIN && <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">Admin</span>}
                                </div>
                            ))}
                        </div>
                        
                        <h4 className="text-xs font-bold text-gray-400 uppercase mt-6 mb-3">Archivos Compartidos</h4>
                        <div className="space-y-2">
                             {/* Mock files */}
                             <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#2a2b36] rounded-lg">
                                 <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><FileText className="w-4 h-4"/></div>
                                 <div className="flex-1 min-w-0">
                                     <p className="text-xs font-bold truncate">Specs_v2.pdf</p>
                                     <p className="text-[10px] text-gray-400">2.4 MB</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamChat;
