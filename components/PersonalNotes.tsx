import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CheckSquare, Clock, Plus, Trash2, Save, X, Calendar, Edit2, Search } from 'lucide-react';
import { notesService, PersonalNote } from '../services/firebaseData';
import { FIREBASE_ENABLED } from '../services/firebase';

interface Note {
    id: string;
    text: string;
    completed: boolean;
    timeEstimate?: string; // e.g., "30m", "1h"
    createdAt: number;
}

// Helper to convert PersonalNote to Note format
const convertToNote = (pNote: PersonalNote): Note => ({
    id: pNote.id,
    text: pNote.content || pNote.title || '',
    completed: pNote.isCompleted || false,
    timeEstimate: pNote.timeEstimate,
    createdAt: pNote.createdAt ? new Date(pNote.createdAt).getTime() : Date.now()
});

// Helper to convert Note to PersonalNote format
const convertToPersonalNote = (note: Note, userId: string): Omit<PersonalNote, 'id'> => ({
    userId,
    title: note.text.substring(0, 50), // First 50 chars as title
    content: note.text,
    timeEstimate: note.timeEstimate,
    isCompleted: note.completed,
    createdAt: new Date(note.createdAt).toISOString(),
    updatedAt: new Date().toISOString()
});

interface PersonalNotesProps {
    currentUser: User | null;
}

const PersonalNotes: React.FC<PersonalNotesProps> = ({ currentUser }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newNote, setNewNote] = useState({ text: '', time: '' });
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ text: '', time: '' });
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredNotes = notes.filter(note => 
        note.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Load notes from Firebase or localStorage
    useEffect(() => {
        setIsLoaded(false);
        if (currentUser) {
            if (FIREBASE_ENABLED) {
                // Check for localStorage migration
                const savedNotes = localStorage.getItem(`personal_notes_${currentUser.id}`);
                if (savedNotes) {
                    const localNotes: Note[] = JSON.parse(savedNotes);
                    // Migrate to Firebase
                    Promise.all(
                        localNotes.map(note => 
                            notesService.add(convertToPersonalNote(note, currentUser.id))
                        )
                    ).then(() => {
                        localStorage.removeItem(`personal_notes_${currentUser.id}`);
                    }).catch(console.error);
                }

                // Load from Firebase
                notesService.getByUserId(currentUser.id)
                    .then(pNotes => {
                        setNotes(pNotes.map(convertToNote));
                        setIsLoaded(true);
                    })
                    .catch(error => {
                        console.error('Error loading notes:', error);
                        setIsLoaded(true);
                    });
            } else {
                // Load from localStorage
                const savedNotes = localStorage.getItem(`personal_notes_${currentUser.id}`);
                if (savedNotes) {
                    setNotes(JSON.parse(savedNotes));
                } else {
                    setNotes([]);
                }
                setIsLoaded(true);
            }
        }
    }, [currentUser]);

    // Real-time listener for notes (Firebase only)
    useEffect(() => {
        if (!currentUser || !FIREBASE_ENABLED) return;

        const unsubscribe = notesService.onNotesChange(currentUser.id, (pNotes) => {
            setNotes(pNotes.map(convertToNote));
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Save notes to localStorage (localStorage mode only)
    useEffect(() => {
        if (currentUser && isLoaded && !FIREBASE_ENABLED) {
            localStorage.setItem(`personal_notes_${currentUser.id}`, JSON.stringify(notes));
        }
    }, [notes, currentUser, isLoaded]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.text.trim() || !currentUser) return;

        const note: Note = {
            id: Date.now().toString(),
            text: newNote.text,
            timeEstimate: newNote.time,
            completed: false,
            createdAt: Date.now()
        };

        if (FIREBASE_ENABLED) {
            try {
                await notesService.add(convertToPersonalNote(note, currentUser.id));
                setNewNote({ text: '', time: '' });
                setIsAdding(false);
            } catch (error) {
                console.error('Error adding note:', error);
            }
        } else {
            setNotes([note, ...notes]);
            setNewNote({ text: '', time: '' });
            setIsAdding(false);
        }
    };

    const startEditing = (note: Note) => {
        setEditingNoteId(note.id);
        setEditForm({ text: note.text, time: note.timeEstimate || '' });
    };

    const handleUpdateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editForm.text.trim() || !editingNoteId) return;

        if (FIREBASE_ENABLED) {
            try {
                await notesService.update(editingNoteId, {
                    content: editForm.text,
                    title: editForm.text.substring(0, 50),
                    timeEstimate: editForm.time
                });
                setEditingNoteId(null);
            } catch (error) {
                console.error('Error updating note:', error);
            }
        } else {
            setNotes(notes.map(n => n.id === editingNoteId ? { ...n, text: editForm.text, timeEstimate: editForm.time } : n));
            setEditingNoteId(null);
        }
    };

    const toggleComplete = async (id: string) => {
        const note = notes.find(n => n.id === id);
        if (!note) return;

        const newCompleted = !note.completed;
        
        // Optimistic update
        setNotes(notes.map(n => n.id === id ? { ...n, completed: newCompleted } : n));

        if (FIREBASE_ENABLED) {
            try {
                await notesService.update(id, { isCompleted: newCompleted });
            } catch (error) {
                console.error('Error toggling complete:', error);
                // Revert on error
                setNotes(notes.map(n => n.id === id ? { ...n, completed: !newCompleted } : n));
            }
        }
    };

    const deleteNote = async (id: string) => {
        if (FIREBASE_ENABLED) {
            try {
                await notesService.delete(id);
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        } else {
            setNotes(notes.filter(n => n.id !== id));
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="text-3xl">📝</span> Mis Notas Personales
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {getGreeting()}, {currentUser?.name.split(' ')[0]}. Aquí tienes tu espacio para micro-tareas y recordatorios.
                        </p>
                    </div>
                    <div className="relative w-full md:w-64">
                         <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                         <input 
                            type="text" 
                            placeholder="Buscar nota..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7b68ee] focus:outline-none shadow-sm placeholder-slate-400"
                         />
                    </div>
                </div>

                {/* Add New Note Section */}
                <div className="mb-8">
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-[#7b68ee] hover:border-[#7b68ee] hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group"
                        >
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="font-medium">Añadir nueva nota rápida</span>
                        </button>
                    ) : (
                        <form onSubmit={handleAddNote} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-lg border border-[#7b68ee]/20 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tarea / Nota</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newNote.text}
                                        onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
                                        placeholder="Ej. Ajustar padding en el header..."
                                        className="w-full text-lg font-medium bg-transparent border-b-2 border-slate-100 dark:border-slate-800 focus:border-[#7b68ee] focus:outline-none pb-2 placeholder-slate-300 dark:placeholder-slate-600 dark:text-white transition-colors"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tiempo Estimado (Opcional)</label>
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={newNote.time}
                                                onChange={(e) => setNewNote({ ...newNote, time: e.target.value })}
                                                placeholder="Ej. 15m"
                                                className="bg-transparent text-sm w-full focus:outline-none dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsAdding(false); setNewNote({ text: '', time: '' }); }}
                                        className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newNote.text.trim()}
                                        className="bg-[#7b68ee] text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#7b68ee]/20 hover:bg-[#6b58de] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Guardar Nota
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Notes List */}
                <div className="space-y-4">
                    {filteredNotes.length === 0 && !isAdding && (
                        <div className="text-center py-12 opacity-50">
                            <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckSquare className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500">
                                {searchTerm ? 'No se encontraron notas con ese criterio.' : 'No tienes notas personales aún.'}
                            </p>
                        </div>
                    )}

                    {filteredNotes.map(note => (
                        <div
                            key={note.id}
                            className={`group relative flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 border ${note.completed
                                ? 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-60'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                }`}
                        >
                            {editingNoteId === note.id ? (
                                /* Editing Mode */
                                <form onSubmit={handleUpdateNote} className="flex-1 w-full flex flex-col gap-3">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editForm.text}
                                        onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                                        className="w-full text-base font-medium bg-transparent border-b border-[#7b68ee] focus:outline-none pb-1 dark:text-white"
                                    />
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 flex-1 max-w-[120px]">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <input
                                                type="text"
                                                value={editForm.time}
                                                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                                className="bg-transparent text-xs w-full focus:outline-none dark:text-white"
                                            />
                                        </div>
                                        <div className="flex gap-2 ml-auto">
                                            <button
                                                type="button"
                                                onClick={() => setEditingNoteId(null)}
                                                className="text-xs text-slate-500 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="text-xs bg-[#7b68ee] text-white px-3 py-1 rounded hover:bg-[#6b58de]"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                /* View Mode */
                                <>
                                    <button
                                        onClick={() => toggleComplete(note.id)}
                                        className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${note.completed
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-[#7b68ee] text-transparent'
                                            }`}
                                    >
                                        <CheckSquare className="w-3.5 h-3.5 fill-current" />
                                    </button>

                                    <div 
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => toggleComplete(note.id)}
                                    >
                                        <p className={`text-base font-medium mb-1 break-words ${note.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {note.text}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                            {note.timeEstimate && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full font-medium">
                                                    <Clock className="w-3 h-3" /> {note.timeEstimate}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEditing(note)}
                                            className="p-2 text-slate-300 hover:text-[#7b68ee] hover:bg-[#7b68ee]/10 dark:hover:bg-[#7b68ee]/20 rounded-lg transition-all"
                                            title="Editar nota"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                            title="Eliminar nota"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PersonalNotes;
