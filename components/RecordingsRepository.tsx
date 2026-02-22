import React, { useState, useEffect } from 'react';
import { Film, Calendar, Clock, HardDrive, Play, Download, Trash2, FileText, Bot, X, MessageSquare, FolderPlus, Edit2, Folder as FolderIcon, Check, XCircle } from 'lucide-react';
import { RecordingMetadata, getAllRecordingsMeta, getRecordingBlob, deleteRecording, getFolders, createFolder, renameFolder, moveRecordingToFolder, setActiveFolder, getActiveFolder, RecordingFolder, deleteFolder } from '../services/recordingService';

interface RecordingsRepositoryProps {
    onSummarize: (recordingName: string) => void;
}

const RecordingsRepository: React.FC<RecordingsRepositoryProps> = ({ onSummarize }) => {
    const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<{url: string, name: string} | null>(null);
    const [folders, setFolders] = useState<RecordingFolder[]>([]);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [currentFolderFilter, setCurrentFolderFilter] = useState<'ALL' | 'UNFILED' | string>('ALL');
    
    // UI States for Folder Management
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        loadRecordings();
        setFolders(getFolders());
        setActiveFolderId(getActiveFolder());
    }, []);

    const loadRecordings = () => {
        setRecordings(getAllRecordingsMeta());
    };

    const handlePlay = async (id: string, name: string) => {
        const blob = await getRecordingBlob(id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            setSelectedVideo({ url, name });
        }
    };

    const handleCloseVideo = () => {
        if (selectedVideo) {
            URL.revokeObjectURL(selectedVideo.url);
            setSelectedVideo(null);
        }
    };

    const handleDownload = async (id: string, name: string) => {
        const blob = await getRecordingBlob(id);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${name}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta grabación?')) {
            await deleteRecording(id);
            loadRecordings();
        }
    };

    const startCreateFolder = () => {
        setIsCreatingFolder(true);
        setNewFolderName('');
    };

    const confirmCreateFolder = () => {
        if (!newFolderName.trim()) {
            setIsCreatingFolder(false);
            return;
        }
        const folder = createFolder(newFolderName.trim());
        setFolders([folder, ...folders]);
        setIsCreatingFolder(false);
        setNewFolderName('');
    };

    const cancelCreateFolder = () => {
        setIsCreatingFolder(false);
        setNewFolderName('');
    };

    const startEditFolder = (folder: RecordingFolder) => {
        setEditingFolderId(folder.id);
        setEditingName(folder.name);
    };

    const confirmEditFolder = () => {
        if (editingFolderId && editingName.trim()) {
            renameFolder(editingFolderId, editingName.trim());
            setFolders(folders.map(f => f.id === editingFolderId ? { ...f, name: editingName.trim() } : f));
        }
        setEditingFolderId(null);
        setEditingName('');
    };

    const cancelEditFolder = () => {
        setEditingFolderId(null);
        setEditingName('');
    };

    const handleDeleteFolder = (folderId: string) => {
        if (confirm('¿Estás seguro de eliminar esta carpeta? Las grabaciones dentro de ella no se eliminarán, pero quedarán "Sin carpeta".')) {
            deleteFolder(folderId);
            setFolders(folders.filter(f => f.id !== folderId));
            if (currentFolderFilter === folderId) {
                setCurrentFolderFilter('ALL');
            }
            // Refresh recordings to update folderId to null
            loadRecordings();
        }
    };

    const handleSetActiveFolder = (folderId: string | null) => {
        setActiveFolder(folderId);
        setActiveFolderId(folderId);
    };

    const handleMoveRecording = (recordingId: string, folderId: string | null) => {
        moveRecordingToFolder(recordingId, folderId);
        setRecordings(getAllRecordingsMeta());
    };

    const filteredRecordings = recordings.filter(r => {
        if (currentFolderFilter === 'ALL') return true;
        if (currentFolderFilter === 'UNFILED') return !r.folderId;
        return r.folderId === currentFolderFilter;
    });

    return (
        <div className="p-4 lg:p-6 2xl:p-8 max-w-7xl mx-auto h-full overflow-hidden">
            <div className="flex items-center gap-4 mb-6 lg:mb-8">
                <div className="p-3 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 rounded-xl text-[#7b68ee] dark:text-[#7b68ee]">
                    <Film className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white">Repositorio de Grabaciones</h1>
                    <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400">Gestiona y revisa todas las sesiones de Daily Scrum grabadas</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100%-80px)] lg:h-[calc(100%-96px)]">
                <div className="w-full lg:w-64 lg:min-w-60 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 flex flex-col h-auto lg:h-full max-h-48 lg:max-h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Carpetas</span>
                        <button onClick={startCreateFolder} className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" title="Nueva carpeta">
                            <FolderPlus className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {isCreatingFolder && (
                        <div className="flex items-center gap-1 mb-2 px-1 animate-in slide-in-from-left-2 flex-shrink-0">
                            <input 
                                autoFocus
                                type="text" 
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Nombre..."
                                className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs px-2 py-1 outline-none focus:border-[#7b68ee]"
                                onKeyDown={(e) => e.key === 'Enter' && confirmCreateFolder()}
                            />
                            <button onClick={confirmCreateFolder} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                <Check className="w-3 h-3" />
                            </button>
                            <button onClick={cancelCreateFolder} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                <XCircle className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="flex-shrink-0 space-y-1">
                        <button
                            onClick={() => setCurrentFolderFilter('ALL')}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left ${currentFolderFilter === 'ALL' ? 'bg-[#7b68ee]/10 text-[#7b68ee]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            <FolderIcon className="w-4 h-4" /> Todas
                        </button>
                        <button
                            onClick={() => setCurrentFolderFilter('UNFILED')}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left ${currentFolderFilter === 'UNFILED' ? 'bg-[#7b68ee]/10 text-[#7b68ee]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            <FolderIcon className="w-4 h-4" /> Sin carpeta
                        </button>
                    </div>
                    
                    <div className="mt-2 space-y-1 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                        {folders.map(f => (
                            <div key={f.id} className="flex items-center gap-1 group">
                                {editingFolderId === f.id ? (
                                    <div className="flex-1 flex items-center gap-1 px-1">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs px-2 py-1 outline-none focus:border-[#7b68ee]"
                                            onKeyDown={(e) => e.key === 'Enter' && confirmEditFolder()}
                                        />
                                        <button onClick={confirmEditFolder} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                                            <Check className="w-3 h-3" />
                                        </button>
                                        <button onClick={cancelEditFolder} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setCurrentFolderFilter(f.id)}
                                            className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left truncate ${currentFolderFilter === f.id ? 'bg-[#7b68ee]/10 text-[#7b68ee]' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                            title={f.name}
                                        >
                                            <FolderIcon className="w-4 h-4 shrink-0" /> 
                                            <span className="truncate">{f.name}</span>
                                        </button>
                                        <div className="hidden group-hover:flex items-center gap-0.5">
                                            <button
                                                onClick={() => startEditFolder(f)}
                                                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                title="Renombrar"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFolder(f.id)}
                                                className="p-1 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                                                title="Eliminar carpeta"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleSetActiveFolder(activeFolderId === f.id ? null : f.id)}
                                                className={`p-1 rounded-lg ${activeFolderId === f.id ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-400 hover:text-amber-500'}`}
                                                title={activeFolderId === f.id ? "Carpeta predeterminada (Click para quitar)" : "Hacer predeterminada"}
                                            >
                                                <Bot className={`w-3 h-3 ${activeFolderId === f.id ? 'fill-current' : ''}`} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => handleSetActiveFolder(null)}
                            className="w-full px-2 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            Quitar predeterminada
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-2 md:p-4 font-semibold text-slate-600 dark:text-slate-300">Nombre</th>
                                <th className="p-2 md:p-4 font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">Carpeta</th>
                                <th className="p-2 md:p-4 font-semibold text-slate-600 dark:text-slate-300 hidden lg:table-cell">Fecha</th>
                                <th className="p-2 md:p-4 font-semibold text-slate-600 dark:text-slate-300">Duración</th>
                                <th className="p-2 md:p-4 font-semibold text-slate-600 dark:text-slate-300 hidden xl:table-cell">Tamaño</th>
                                <th className="p-2 md:p-4 font-semibold text-slate-600 dark:text-slate-300 hidden xl:table-cell">Transcripción</th>
                                <th className="p-2 md:p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredRecordings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 md:p-12 text-center text-slate-400">
                                        No hay grabaciones disponibles
                                    </td>
                                </tr>
                            ) : (
                                filteredRecordings.map((rec) => (
                                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-2 md:p-4 font-medium text-slate-800 dark:text-slate-200 min-w-[140px]">
                                            <div className="truncate" title={rec.name}>{rec.name}</div>
                                            <div className="md:hidden flex flex-col gap-1.5 mt-1.5">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(rec.date).toLocaleDateString()}
                                                </div>
                                                <select
                                                    value={rec.folderId ?? ''}
                                                    onChange={(e) => handleMoveRecording(rec.id, e.target.value || null)}
                                                    className="w-full text-xs py-1 px-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 focus:ring-1 focus:ring-[#7b68ee] outline-none"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="">Sin carpeta</option>
                                                    {folders.map(f => (
                                                        <option key={f.id} value={f.id}>{f.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-2 md:p-4 hidden md:table-cell">
                                            <select
                                                value={rec.folderId ?? ''}
                                                onChange={(e) => handleMoveRecording(rec.id, e.target.value || null)}
                                                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300"
                                            >
                                                <option value="">Sin carpeta</option>
                                                {folders.map(f => (
                                                    <option key={f.id} value={f.id}>{f.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2 md:p-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(rec.date).toLocaleDateString()} {new Date(rec.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                        <td className="p-2 md:p-4 text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {rec.duration}
                                            </div>
                                        </td>
                                        <td className="p-2 md:p-4 text-slate-500 dark:text-slate-400 hidden xl:table-cell">
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="w-4 h-4" />
                                                {rec.size}
                                            </div>
                                        </td>
                                        <td className="p-2 md:p-4 hidden xl:table-cell">
                                            {rec.hasTranscript ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <FileText className="w-3 h-3" /> Disponible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                    No disponible
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2 md:p-4">
                                            <div className="flex items-center justify-end gap-1 md:gap-2">
                                                <button 
                                                    onClick={() => handlePlay(rec.id, rec.name)}
                                                    className="p-1.5 md:p-2 text-[#7b68ee] hover:bg-[#7b68ee]/10 dark:text-[#7b68ee] dark:hover:bg-[#7b68ee]/20 rounded-lg transition-colors"
                                                    title="Reproducir"
                                                >
                                                    <Play className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDownload(rec.id, rec.name)}
                                                    className="p-1.5 md:p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="Descargar"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => onSummarize(rec.name)}
                                                    className="p-1.5 md:p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30 rounded-lg transition-colors flex items-center gap-1"
                                                    title="Resumir con IA"
                                                >
                                                    <Bot className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(rec.id)}
                                                    className="p-1.5 md:p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>

            {/* Video Modal */ }
            {selectedVideo && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="absolute top-4 right-4 z-20">
                            <button 
                                onClick={handleCloseVideo}
                                className="p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
                            <h3 className="text-white font-medium drop-shadow-md">{selectedVideo.name}</h3>
                        </div>
                        <video 
                            src={selectedVideo.url} 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain bg-black"
                        />
                    </div>
            )}
        </div>
    );
};

export default RecordingsRepository;
