import React, { useState, useEffect, useRef } from 'react';
import {
    Mic, MicOff, Video, VideoOff, MonitorUp, MessageSquare,
    Users, PhoneOff, Settings, MoreHorizontal, Smile,
    LayoutGrid, Maximize2, Share2, Hand, Phone, Copy,
    Circle, StopCircle, Download, Trash2, Play, Film, X
} from 'lucide-react';
import { User } from '../types';
import { saveRecording, getRecordingBlob, getAllRecordingsMeta, deleteRecording, RecordingMetadata } from '../services/recordingService';

interface MeetingRoomProps {
    currentUser: User;
    users: User[]; // List of all users to simulate/show potential participants
    onLeave: () => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ currentUser, users, onLeave }) => {
    const [joined, setJoined] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [meetingTimeLeft, setMeetingTimeLeft] = useState(15 * 60); // 15 minutes in seconds
    const [callingUsers, setCallingUsers] = useState<Set<string>>(new Set());
    
    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showRecordings, setShowRecordings] = useState(false);
    const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const transcriptRef = useRef<string>('');
    const recognitionRef = useRef<any>(null);

    // Participants: Only currentUser initially
    const [participants, setParticipants] = useState<User[]>([currentUser]);

    // Derived state for other users not in meeting
    const suggestedUsers = users.filter(u => !participants.find(p => p.id === u.id));

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
        // Load recordings on mount
        setRecordings(getAllRecordingsMeta());
        return () => clearInterval(timer);
    }, []);

    // Recording Timer
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' } as any,
                audio: true
            });

            // If user cancels screen share selection
            stream.getVideoTracks()[0].onended = () => {
                stopRecordingInternal();
            };

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            transcriptRef.current = '';

            // Start Speech Recognition if supported
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'es-ES';

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript + ' ';
                        }
                    }
                    transcriptRef.current += finalTranscript;
                };

                recognition.start();
                recognitionRef.current = recognition;
            }

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const id = Date.now().toString();
                const metadata: RecordingMetadata = {
                    id,
                    date: new Date().toISOString(),
                    duration: formatTimeLeft(recordingTime),
                    size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
                    name: `Daily Scrum - ${new Date().toLocaleDateString()}`
                };

                await saveRecording(blob, metadata, transcriptRef.current);
                setRecordings(getAllRecordingsMeta());
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());

                // Stop recognition
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
        }
    };

    const stopRecordingInternal = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleStopRecording = () => {
        stopRecordingInternal();
    };

    const handleDownloadRecording = async (id: string, name: string) => {
        const blob = await getRecordingBlob(id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${name}.webm`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        }
    };

    const handleDeleteRecording = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta grabación?')) {
            await deleteRecording(id);
            setRecordings(getAllRecordingsMeta());
        }
    };

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    const handleCallUser = (userId: string) => {
        setCallingUsers(prev => new Set(prev).add(userId));
        
        // Play calling sound
        if (!audioRef.current) {
            audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-telephone-ring-1357.mp3');
            audioRef.current.loop = true;
        }
        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
        
        // Simulación: Solo mostramos estado de "Llamando" por un momento
        // En producción, esto emitiría un evento de socket
        setTimeout(() => {
            setCallingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            
            // Stop sound
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            // No añadimos participantes automáticamente para mantener el realismo
        }, 15000);
    };

    const [viewMode, setViewMode] = useState<'grid' | 'speaker'>('grid');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [reactions, setReactions] = useState<{id: number, emoji: string, x: number, y: number}[]>([]);

    const handleScreenShare = async () => {
        if (screenSharing) {
            stopScreenShare();
            return;
        }

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            const screenTrack = displayStream.getVideoTracks()[0];

            screenTrack.onended = () => stopScreenShare();

            if (localStream) {
                const audioTrack = localStream.getAudioTracks()[0];
                const newStream = new MediaStream([screenTrack]);
                if (audioTrack) newStream.addTrack(audioTrack);
                setLocalStream(newStream);
            } else {
                setLocalStream(displayStream);
            }
            setScreenSharing(true);
        } catch (err) {
            console.error("Error sharing screen", err);
        }
    };

    const stopScreenShare = async () => {
        setScreenSharing(false);
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.stop());
        }
        if (cameraOn) {
            startCamera();
        } else {
            // Keep audio only if mic was on, otherwise stop all
             if (localStream) {
                // If we just stop video tracks, we might still have audio
                // But startCamera will create a fresh stream with both if possible
                startCamera(); // Simplest way to reset to camera state
                if (!micOn) {
                     // small timeout to ensure stream is ready before muting
                     setTimeout(() => {
                         setMicOn(false); // Re-apply mute state if needed
                     }, 100);
                }
            }
        }
    };

    const addReaction = (emoji: string) => {
        const id = Date.now();
        // Random position for "floating" effect
        const x = Math.random() * 80 + 10; // 10% to 90%
        setReactions(prev => [...prev, { id, emoji, x, y: 100 }]);
        setShowEmojiPicker(false);

        // Remove after animation
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);
    };

    // Meeting Timer Logic
    useEffect(() => {
        let interval: any;
        if (joined && meetingTimeLeft > 0) {
            interval = setInterval(() => {
                setMeetingTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        onLeave(); // Auto close when time is up
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [joined, meetingTimeLeft, onLeave]);

    const formatTimeLeft = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (cameraOn) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [cameraOn]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing media devices:", err);
            setCameraOn(false);
        }
    };

    const stopCamera = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
    };

    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !micOn);
        }
        setMicOn(!micOn);
    };

    const toggleCamera = () => {
        setCameraOn(!cameraOn);
    };

    // Pre-join screen
    if (!joined) {
        return (
            <div className="fixed inset-0 bg-[#1e1e2d] flex flex-col items-center justify-center z-50 text-white animate-in fade-in duration-500">
                <div className="w-full max-w-2xl bg-[#2a2b36] rounded-xl overflow-hidden shadow-2xl border border-[#7b68ee]/20 animate-in zoom-in-95 duration-500 slide-in-from-bottom-8">
                    <div className="h-96 bg-black relative flex items-center justify-center">
                        {cameraOn ? (
                            <video
                                ref={(ref) => {
                                    if (ref && localStream) ref.srcObject = localStream;
                                }}
                                autoPlay
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-24 h-24 rounded-full bg-[#7b68ee] flex items-center justify-center text-3xl font-bold">
                                    {currentUser.name.charAt(0)}
                                </div>
                                <p className="text-gray-400">La cámara está desactivada</p>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                            <button
                                onClick={toggleMic}
                                className={`p-3 rounded-full transition-all ${micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={toggleCamera}
                                className={`p-3 rounded-full transition-all ${cameraOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                    <div className="p-8 flex flex-col items-center gap-6">
                        <h2 className="text-2xl font-semibold">Daily Scrum - {new Date().toLocaleDateString()}</h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setJoined(true)}
                                className="px-8 py-3 bg-[#7b68ee] hover:bg-[#6a5acd] rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/20"
                            >
                                Unirse ahora
                            </button>
                            <button
                                onClick={onLeave}
                                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#1e1e2d] z-50 flex flex-col text-white animate-in fade-in duration-500">
            {/* Top Bar */}
            <div className="h-14 flex items-center justify-between px-4 bg-[#2a2b36] border-b border-[#7b68ee]/20 animate-in slide-in-from-top duration-500 delay-100 fill-mode-backwards">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium text-green-400">En vivo</span>
                    </div>
                    {/* Timer Display */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${meetingTimeLeft < 60 ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' : 'bg-[#7b68ee]/10 border-[#7b68ee]/20 text-[#7b68ee]'}`}>
                        <span className="text-xs font-bold font-mono">{formatTimeLeft(meetingTimeLeft)}</span>
                    </div>

                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs font-medium text-red-400 font-mono">{formatTimeLeft(recordingTime)}</span>
                        </div>
                    )}

                    <span className="font-medium text-gray-200">Daily Scrum Meeting</span>
                    <span className="text-gray-500 text-sm">| {currentTime}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')}
                        className={`p-2 rounded-lg transition-colors ${viewMode === 'speaker' ? 'bg-[#7b68ee] text-white' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                        title={viewMode === 'grid' ? "Cambiar a Vista del Hablante" : "Cambiar a Vista de Cuadrícula"}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <Maximize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Grid */}
                <div className={`flex-1 p-4 grid gap-4 ${
                    viewMode === 'speaker' 
                    ? 'grid-cols-1' 
                    : (showChat || showParticipants ? 'grid-cols-2' : 'grid-cols-3')
                } auto-rows-fr overflow-y-auto relative`}>
                    <style>{`
                        @keyframes floatUp {
                            0% { transform: translateY(0) scale(0.5); opacity: 0; }
                            10% { opacity: 1; transform: translateY(-20px) scale(1.2); }
                            100% { transform: translateY(-300px) scale(1); opacity: 0; }
                        }
                    `}</style>
                    {/* Reactions Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                        {reactions.map(r => (
                            <div 
                                key={r.id}
                                className="absolute text-4xl"
                                style={{ 
                                    left: `${r.x}%`, 
                                    bottom: '10%',
                                    animation: 'floatUp 2s ease-out forwards'
                                }}
                            >
                                {r.emoji}
                            </div>
                        ))}
                    </div>
                    {/* Local User */}
                    <div className="relative bg-[#242424] rounded-xl overflow-hidden ring-1 ring-white/10 group">
                        {cameraOn ? (
                            <video
                                ref={(ref) => {
                                    if (ref && localStream) ref.srcObject = localStream;
                                }}
                                autoPlay
                                muted
                                className="w-full h-full object-cover transform scale-x-[-1]"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-[#7b68ee] flex items-center justify-center text-3xl font-bold">
                                    {currentUser.name.charAt(0)}
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
                            {currentUser.name} (Tú)
                            {!micOn && <MicOff className="w-3 h-3 text-red-500" />}
                        </div>
                        <div className="absolute inset-0 ring-2 ring-[#7b68ee]/0 group-hover:ring-[#7b68ee]/50 transition-all rounded-xl pointer-events-none" />
                    </div>

                    {/* Placeholder Participants - REMOVED per user request to not simulate connected users */}
                    {/* Only show actual participants */}
                    {participants.filter(u => u.id !== currentUser.id).map(user => (
                        <div key={user.id} className="relative bg-[#242424] rounded-xl overflow-hidden ring-1 ring-white/10">
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300">
                                    {user.name.charAt(0)}
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-medium">
                                {user.name}
                            </div>
                        </div>
                    ))}
                    
                    {/* Calling Users placeholders */}
                    {Array.from(callingUsers).map(userId => {
                        const user = users.find(u => u.id === userId);
                        if (!user) return null;
                        return (
                            <div key={`calling-${userId}`} className="relative bg-[#242424] rounded-xl overflow-hidden ring-1 ring-white/10 flex flex-col items-center justify-center">
                                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-4 relative">
                                    <span className="text-3xl font-bold text-slate-400">{user.name.charAt(0)}</span>
                                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7b68ee] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-6 w-6 bg-[#7b68ee] items-center justify-center">
                                            <Phone className="w-3 h-3 text-white" />
                                        </span>
                                    </span>
                                </div>
                                <p className="text-white font-medium mb-1">Llamando a {user.name}...</p>
                                <p className="text-slate-400 text-sm">Esperando respuesta</p>
                            </div>
                        );
                    })}
                    
                    {/* Empty State when alone */}
                    {participants.length === 1 && (
                        <div className="col-span-2 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/5 rounded-xl">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 opacity-50" />
                            </div>
                            <p className="text-lg font-medium">Estás solo en la reunión</p>
                            <p className="text-sm">Invita a otros miembros para comenzar</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (Chat/Participants) */}
                {(showChat || showParticipants) && (
                    <div className="w-80 bg-[#2a2b36] border-l border-white/5 flex flex-col">
                        <div className="h-12 flex items-center border-b border-white/5">
                            <button
                                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                                className={`flex-1 h-full text-sm font-medium ${showChat ? 'text-[#7b68ee] border-b-2 border-[#7b68ee]' : 'text-gray-400 hover:text-white'}`}
                            >
                                Chat
                            </button>
                            <button
                                onClick={() => { setShowParticipants(true); setShowChat(false); }}
                                className={`flex-1 h-full text-sm font-medium ${showParticipants ? 'text-[#7b68ee] border-b-2 border-[#7b68ee]' : 'text-gray-400 hover:text-white'}`}
                            >
                                Participantes
                            </button>
                        </div>
                        
                        {showChat && (
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                                    <div className="text-center text-xs text-gray-500 my-4">Hoy, {new Date().toLocaleTimeString()}</div>
                                    <div className="bg-[#1e1e2d] p-3 rounded-lg rounded-tl-none border border-[#7b68ee]/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-[#7b68ee]">System</span>
                                            <span className="text-[10px] text-gray-500">Just now</span>
                                        </div>
                                        <p className="text-sm text-gray-300">Bienvenido al Daily Scrum.</p>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-white/5">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Escribe un mensaje..."
                                            className="w-full bg-[#1e1e2d] border border-white/10 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:border-[#7b68ee]/50"
                                        />
                                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#7b68ee] rounded-full hover:bg-[#6a5acd]">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {showParticipants && (
                            <div className="flex-1 p-2 overflow-y-auto">
                                <div className="space-y-4">
                                    {/* Copy Link Section */}
                                    <div className="p-2">
                                        <button className="w-full flex items-center justify-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white py-2 rounded-lg text-sm font-medium transition-colors">
                                            <Copy className="w-4 h-4" />
                                            Copiar enlace de reunión
                                        </button>
                                    </div>

                                    {/* Active Participants */}
                                    <div>
                                        <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            En la reunión ({participants.length})
                                        </div>
                                        <div className="space-y-1">
                                            {participants.map(user => (
                                                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold relative">
                                                        {user.name.charAt(0)}
                                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{user.name} {user.id === currentUser.id && '(Tú)'}</div>
                                                        <div className="text-xs text-gray-500">{user.role}</div>
                                                    </div>
                                                    {user.id === currentUser.id && (
                                                        <div className="flex gap-1">
                                                            {!micOn && <MicOff className="w-3.5 h-3.5 text-red-500" />}
                                                            {!cameraOn && <VideoOff className="w-3.5 h-3.5 text-red-500" />}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Suggested / Offline Users */}
                                    <div>
                                        <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                            Sugerencias ({suggestedUsers.length})
                                        </div>
                                        <div className="space-y-1">
                                            {suggestedUsers.map(user => (
                                                <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg group">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold grayscale opacity-70">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0 opacity-70">
                                                        <div className="text-sm font-medium truncate">{user.name}</div>
                                                        <div className="text-xs text-gray-500">{user.role}</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleCallUser(user.id)}
                                                        disabled={callingUsers.has(user.id)}
                                                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                            callingUsers.has(user.id) 
                                                            ? 'bg-transparent text-[#7b68ee] cursor-default'
                                                            : 'bg-[#7b68ee] hover:bg-[#6a5acd] text-white opacity-0 group-hover:opacity-100'
                                                        }`}
                                                    >
                                                        {callingUsers.has(user.id) ? 'Llamando...' : 'Llamar'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="h-24 bg-gradient-to-t from-black via-[#0a0a0a] to-transparent border-t border-white/5 px-6 flex items-center justify-center gap-4 relative z-40">
                {/* Floating Island Container */}
                <div className="flex items-center gap-3 bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
                    <div className="flex flex-col items-center gap-1 group cursor-pointer">
                        <button 
                            onClick={() => setMicOn(!micOn)} 
                            className={`p-3.5 rounded-xl transition-all duration-300 ${micOn ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-1 ring-red-500/50'}`}
                        >
                            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-1 group cursor-pointer">
                        <button 
                            onClick={() => setCameraOn(!cameraOn)} 
                            className={`p-3.5 rounded-xl transition-all duration-300 ${cameraOn ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-1 ring-red-500/50'}`}
                        >
                            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    {/* Recording Button */}
                    <div className="flex flex-col items-center gap-1 group cursor-pointer relative">
                        <button 
                            onClick={isRecording ? handleStopRecording : handleStartRecording} 
                            className={`p-3.5 rounded-xl transition-all duration-300 ${
                                isRecording 
                                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-1 ring-red-500/50' 
                                : 'bg-white/5 text-white hover:bg-white/10'
                            }`}
                        >
                            {isRecording ? <StopCircle className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5 text-red-500" />}
                        </button>
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                            {isRecording ? 'Detener Grabación' : 'Grabar Reunión'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group cursor-pointer relative">
                        <button 
                            onClick={() => setShowRecordings(true)}
                            className="p-3.5 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
                        >
                            <Film className="w-5 h-5" />
                        </button>
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                            Ver Grabaciones
                        </span>
                    </div>

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    <div className="flex flex-col items-center gap-1 group cursor-pointer relative">
                        <button 
                            onClick={handleScreenShare}
                            className={`p-3.5 rounded-xl transition-all duration-300 ${screenSharing ? 'bg-[#7b68ee] text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
                        >
                            {screenSharing ? <MonitorUp className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        </button>
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                            {screenSharing ? 'Dejar de Compartir' : 'Compartir Pantalla'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group cursor-pointer relative">
                        <button 
                            onClick={() => setShowChat(!showChat)}
                            className={`p-3.5 rounded-xl transition-all duration-300 ${showChat ? 'bg-[#7b68ee] text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
                        >
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        {/* Notification Dot */}
                        <span className="absolute top-2 right-2 w-2 h-2 bg-[#7b68ee] rounded-full border border-[#2a2b36]"></span>
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                            Chat
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group cursor-pointer relative">
                        <button 
                            onClick={() => setShowParticipants(!showParticipants)}
                            className={`p-3.5 rounded-xl transition-all duration-300 ${showParticipants ? 'bg-[#7b68ee] text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}
                        >
                            <Users className="w-5 h-5" />
                        </button>
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                            Participantes
                        </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 group cursor-pointer relative">
                        {showEmojiPicker && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-[#242424] p-2 rounded-xl shadow-xl border border-white/10 flex gap-2 animate-in fade-in zoom-in duration-200 min-w-max">
                                {['👍', '👏', '❤️', '🎉', '😂', '😮'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => addReaction(emoji)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-2xl transition-transform hover:scale-125 active:scale-95"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-3.5 rounded-xl transition-all duration-300 ${showEmojiPicker ? 'bg-white/20' : 'bg-white/5'} text-yellow-400 hover:bg-white/10`}
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                            Reacciones
                        </span>
                    </div>
                    
                    <div className="w-px h-8 bg-white/10 mx-1" />

                    <div className="flex flex-col items-center gap-1">
                        <button 
                            onClick={onLeave}
                            className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-red-600/20 px-6 flex items-center gap-2"
                        >
                            <PhoneOff className="w-5 h-5" />
                            <span className="font-medium text-sm">Salir</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recordings Modal */}
            {showRecordings && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1e1e2d] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#7b68ee]/20 flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-[#7b68ee]/10 flex items-center justify-between bg-[#2a2b36]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-[#7b68ee]/10 rounded-xl border border-[#7b68ee]/20">
                                    <Film className="w-6 h-6 text-[#7b68ee]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Grabaciones de Reuniones</h2>
                                    <p className="text-sm text-gray-400">Almacenadas localmente en este dispositivo</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowRecordings(false)} 
                                className="p-2 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {recordings.length === 0 ? (
                                <div className="text-center py-16 text-gray-500 flex flex-col items-center border-2 border-dashed border-white/5 rounded-2xl m-4">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <Film className="w-10 h-10 opacity-30" />
                                    </div>
                                    <p className="text-xl font-semibold mb-2 text-gray-300">No hay grabaciones</p>
                                    <p className="text-sm text-gray-500 max-w-xs">Inicia una grabación durante la reunión para verla aquí. Las grabaciones se guardan localmente.</p>
                                </div>
                            ) : (
                                recordings.map((rec) => (
                                    <div key={rec.id} className="bg-[#252525] p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-[#7b68ee]/30 transition-all group hover:bg-[#2a2a2a]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center text-[#7b68ee] group-hover:text-[#9b8bf4] group-hover:scale-110 transition-all">
                                                <Play className="w-6 h-6 fill-current" />
                                            </div>
                                            <div>
                                                <h3 className="font-medium text-white group-hover:text-[#7b68ee] transition-colors">{rec.name}</h3>
                                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                                    <span className="bg-white/5 px-2 py-0.5 rounded">{new Date(rec.date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{rec.duration}</span>
                                                    <span>•</span>
                                                    <span>{rec.size}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleDownloadRecording(rec.id, rec.name)}
                                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-2 group/btn"
                                                title="Descargar"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span className="text-xs font-medium hidden sm:block">Descargar</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteRecording(rec.id)}
                                                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingRoom;
