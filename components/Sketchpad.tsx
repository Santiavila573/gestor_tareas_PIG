import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Trash2, Download, Palette, Moon, Sun, Undo, Redo, Save, FolderOpen, X, Grid, StickyNote, Plus, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User } from '../types';

interface SketchpadProps {
  currentUser?: User | null;
  isSidebarOpen?: boolean;
}

// ... rest of interfaces ...

interface Point {
  x: number;
  y: number;
}

interface DrawAction {
  points: Point[];
  color: string;
  width: number;
  colorId?: string;
}

interface SavedDrawing {
  id: string;
  name: string;
  date: number;
  history: DrawAction[];
  thumbnail?: string; // Optional: dataURL thumbnail
}

interface Note {
  id: string;
  content: string;
  color: string;
  createdAt: number;
}

const NOTE_COLORS = [
  '#fef3c7', // amber-100
  '#dcfce7', // emerald-100
  '#dbeafe', // blue-100
  '#f3e8ff', // purple-100
  '#fee2e2', // red-100
];

const COLORS = [
  { id: 'black', light: '#000000', dark: '#ffffff', label: 'Texto' }, // Adaptive
  { id: 'red', light: '#ef4444', dark: '#f87171', label: 'Rojo' },
  { id: 'blue', light: '#3b82f6', dark: '#60a5fa', label: 'Azul' },
  { id: 'green', light: '#22c55e', dark: '#4ade80', label: 'Verde' },
  { id: 'yellow', light: '#eab308', dark: '#facc15', label: 'Amarillo' },
  { id: 'purple', light: '#a855f7', dark: '#c084fc', label: 'Morado' },
];

const STROKE_SIZES = [1, 2, 3];
const GRID_SIZE = 24;

const Sketchpad: React.FC<SketchpadProps> = ({ currentUser, isSidebarOpen }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [colorId, setColorId] = useState<string>('black');
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawAction[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isSavedDrawingsOpen, setIsSavedDrawingsOpen] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  // Helper to detect dark mode from html class or system preference if needed
  // Since the app uses 'dark' class on html element, we can check that.
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Observer for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    // Load saved drawings
    const loaded = localStorage.getItem('pig_sketchpad_drawings');
    if (loaded) {
      try {
        setSavedDrawings(JSON.parse(loaded));
      } catch (e) {
        console.error('Failed to load drawings', e);
      }
    }

    const loadedNotes = localStorage.getItem('pig_sketchpad_notes');
    if (loadedNotes) {
      try {
        setNotes(JSON.parse(loadedNotes));
      } catch (e) {
        console.error('Failed to load notes', e);
      }
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Recalculate size when sidebar changes
  useEffect(() => {
    // Small delay to allow sidebar animation to finish
    const timer = setTimeout(() => {
      handleResize();
    }, 350);

    // Also call immediately for instant feedback if no animation
    handleResize();

    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  // Re-draw canvas when history or theme changes
  useEffect(() => {
    drawCanvas();
  }, [history, isDarkMode, colorId, showGrid]);

  useEffect(() => {
    localStorage.setItem('pig_sketchpad_notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      createdAt: Date.now()
    };
    setNotes([newNote, ...notes]);
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, content } : n));
  };

  const deleteNote = (id: string) => {
    if (window.confirm('¿Eliminar esta nota?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const exportNoteToGlobal = (note: Note) => {
    if (!currentUser) {
      alert('Debes iniciar sesión para exportar notas');
      return;
    }

    const key = `personal_notes_${currentUser.id}`;
    const pNotesRaw = localStorage.getItem(key);
    let pNotes = [];
    try {
      if (pNotesRaw) pNotes = JSON.parse(pNotesRaw);
    } catch (e) { }

    const newGlobalNote = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text: note.content || 'Nota de Pizarra',
      completed: false,
      createdAt: Date.now()
    };

    localStorage.setItem(key, JSON.stringify([newGlobalNote, ...pNotes]));
    alert('Nota exportada a "Mis Notas Personales"');
  };

  const handleResize = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        drawCanvas();
      }
    }
  };

  const getColorValue = (id: string) => {
    const colorDef = COLORS.find(c => c.id === id);
    if (!colorDef) return '#000000';
    return isDarkMode ? colorDef.dark : colorDef.light;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Set line styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw history
    history.forEach(action => {
      if (action.points.length < 2) return;

      const actionColor = action.colorId
        ? COLORS.find(c => c.id === action.colorId)
        : { light: action.color, dark: action.color };

      const strokeColor = action.colorId
        ? (isDarkMode ? actionColor?.dark : actionColor?.light)
        : action.color;

      ctx.beginPath();
      ctx.strokeStyle = strokeColor || '#000';
      ctx.lineWidth = action.width;

      ctx.moveTo(action.points[0].x, action.points[0].y);
      for (let i = 1; i < action.points.length; i++) {
        ctx.lineTo(action.points[i].x, action.points[i].y);
      }
      ctx.stroke();
    });
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ((e as any).shiftKey) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    setCurrentPoints([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const newPoints = [...currentPoints, { x, y }];
    setCurrentPoints(newPoints);

    // Live render current stroke
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getColorValue(colorId);

    ctx.beginPath();
    ctx.moveTo(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.length > 0) {
      // Save to history with ID for theme adaptability
      const newAction: DrawAction = {
        points: currentPoints,
        color: getColorValue(colorId),
        colorId: colorId,
        width: strokeWidth
      };
      setHistory([...history, newAction]);
      setRedoStack([]);
    }
    setCurrentPoints([]);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(current => [last, ...current]);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      setHistory(current => [...current, first]);
      return rest;
    });
  };

  const handleClear = () => {
    if (window.confirm('¿Borrar todo el dibujo?')) {
      setHistory([]);
      setRedoStack([]);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to draw with background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tCtx = tempCanvas.getContext('2d');
    if (!tCtx) return;

    // Fill background
    tCtx.fillStyle = isDarkMode ? '#1e1e2d' : '#ffffff';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw original canvas
    tCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `sketch-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  const handleSave = () => {
    if (history.length === 0) {
      alert('Dibuja algo antes de guardar');
      return;
    }

    const name = window.prompt('Nombre del dibujo:', `Dibujo ${savedDrawings.length + 1}`);
    if (!name) return;

    // Generate thumbnail
    const canvas = canvasRef.current;
    let thumbnail = '';
    if (canvas) {
      // Create small thumbnail
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 150;
      thumbCanvas.height = 100;
      const tCtx = thumbCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = isDarkMode ? '#1e1e2d' : '#ffffff';
        tCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
        tCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.5);
      }
    }

    const newDrawing: SavedDrawing = {
      id: Date.now().toString(),
      name,
      date: Date.now(),
      history: [...history], // Clone
      thumbnail
    };

    const updatedDrawings = [newDrawing, ...savedDrawings];
    setSavedDrawings(updatedDrawings);
    localStorage.setItem('pig_sketchpad_drawings', JSON.stringify(updatedDrawings));
    alert('Dibujo guardado exitosamente');
  };

  const loadDrawing = (drawing: SavedDrawing) => {
    if (history.length > 0) {
      if (!window.confirm('¿Cargar dibujo reemplazará el actual. Continuar?')) return;
    }
    setHistory(drawing.history);
    setRedoStack([]);
    setIsSavedDrawingsOpen(false);
  };

  const deleteDrawing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Eliminar este dibujo guardado?')) {
      const updated = savedDrawings.filter(d => d.id !== id);
      setSavedDrawings(updated);
      localStorage.setItem('pig_sketchpad_drawings', JSON.stringify(updated));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#1e1e2d] relative overflow-hidden transition-colors duration-300">



      {/* Header / Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#2a2b36]/90 rounded-[2rem] shadow-2xl p-3 2xl:p-5 flex items-center gap-4 z-10 border border-white/20 dark:border-white/5 backdrop-blur-xl animate-in slide-in-from-top duration-500 shadow-indigo-500/10">

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 px-2 border-r border-slate-200 dark:border-slate-700 relative">
          {COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => setColorId(c.id)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${colorId === c.id ? 'border-slate-900 dark:border-white scale-110 shadow-sm' : 'border-transparent'}`}
              style={{ backgroundColor: isDarkMode ? c.dark : c.light }}
              title={c.label}
            />
          ))}
        </div>

        {/* Stroke Size Selector */}
        <div className="flex items-center gap-1.5 px-2 border-r border-slate-200 dark:border-slate-700">
          {STROKE_SIZES.map(size => (
            <button
              key={size}
              onClick={() => setStrokeWidth(size)}
              className={`px-2 py-1 rounded-lg transition-colors ${strokeWidth === size ? 'bg-[#7b68ee] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={`Grosor ${size}`}
            >
              <span
                className="block rounded-full"
                style={{
                  width: 22,
                  height: size,
                  backgroundColor: strokeWidth === size ? 'currentColor' : (isDarkMode ? '#e5e7eb' : '#334155')
                }}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Deshacer"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Rehacer"
          >
            <Redo className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={history.length === 0}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
            title="Exportar PNG"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowGrid(value => !value)}
            className={`p-2 rounded-xl ${showGrid ? 'text-[#7b68ee]' : 'text-slate-600 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-slate-800`}
            title={showGrid ? 'Ocultar cuadrícula' : 'Mostrar cuadrícula'}
          >
            <Grid className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-xl ${showNotes ? 'text-[#7b68ee] bg-[#7b68ee]/10' : 'text-slate-600 dark:text-slate-300'} hover:bg-slate-100 dark:hover:bg-slate-800 transition-all`}
            title={showNotes ? 'Ocultar Notas' : 'Mostrar Notas'}
          >
            <StickyNote className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          <button
            onClick={handleSave}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Guardar Dibujo"
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSavedDrawingsOpen(true)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Mis Dibujos"
          >
            <FolderOpen className="w-5 h-5" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Limpiar Todo"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Notes Sidebar */}
      <div
        className={`absolute top-24 right-6 bottom-6 w-80 bg-white/95 dark:bg-[#1e1e2d]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 transform transition-transform duration-300 z-20 flex flex-col ${showNotes ? 'translate-x-0' : 'translate-x-[120%]'}`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-[#7b68ee]" />
            Notas de Proyecto
          </h3>
          <button
            onClick={addNote}
            className="p-2 bg-[#7b68ee] text-white rounded-lg hover:bg-[#6a5acd] transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
            title="Nueva nota"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {notes.length === 0 ? (
            <div className="text-center text-slate-400 mt-10 flex flex-col items-center">
              <StickyNote className="w-12 h-12 opacity-20 mb-2" />
              <p>No hay notas</p>
              <p className="text-xs">Crea una para comenzar</p>
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                className="relative group rounded-xl p-3 shadow-sm transition-all hover:shadow-md animate-in slide-in-from-right-5 duration-300"
                style={{ backgroundColor: note.color }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-slate-600/70 font-bold">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => exportNoteToGlobal(note)}
                      className="text-slate-500 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded"
                      title="Exportar a Notas Personales"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <textarea
                  value={note.content}
                  onChange={(e) => updateNote(note.id, e.target.value)}
                  placeholder="Escribe aquí..."
                  className="w-full bg-transparent border-none resize-none text-sm text-slate-900 placeholder:text-slate-600/50 focus:outline-none min-h-[80px] font-medium"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative cursor-crosshair touch-none m-4 bg-white dark:bg-[#151521] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Saved Drawings Modal */}
      {isSavedDrawingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e2d] rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-slate-800 dark:text-white flex items-center gap-3 tracking-tighter uppercase">
                  <FolderOpen className="w-6 h-6 text-[#7b68ee]" />
                  Mis Dibujos Guardados
                </h3>
                <p className="text-xs text-slate-500 font-medium">Gestiona y recupera tus bocetos anteriores</p>
              </div>
              <button
                onClick={() => setIsSavedDrawingsOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 custom-scrollbar">
              {savedDrawings.length === 0 ? (
                <div className="col-span-full py-20 text-center flex flex-col items-center opacity-40">
                  <Pencil className="w-16 h-16 mb-4" />
                  <p className="font-bold">No tienes dibujos guardados</p>
                  <p className="text-sm">Tus creaciones aparecerán aquí</p>
                </div>
              ) : (
                savedDrawings.map(drawing => (
                  <div
                    key={drawing.id}
                    onClick={() => loadDrawing(drawing)}
                    className="group relative bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl hover:border-[#7b68ee]/30"
                  >
                    <div className="aspect-[3/2] relative overflow-hidden bg-white dark:bg-[#151521]">
                      {drawing.thumbnail ? (
                        <img src={drawing.thumbnail} alt={drawing.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                          <Pencil className="w-8 h-8" />
                        </div>
                      )}

                      {/* Delete Overlay */}
                      <button
                        onClick={(e) => deleteDrawing(drawing.id, e)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg active:scale-90"
                        title="Eliminar dibujo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900">
                      <h4 className="font-bold text-slate-800 dark:text-white truncate text-sm">{drawing.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">{format(drawing.date, 'dd MMM, HH:mm', { locale: es })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                onClick={() => setIsSavedDrawingsOpen(false)}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sketchpad;
