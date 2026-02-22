import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MousePointer, Square, Circle, Diamond, FileText, Grid, ArrowRight, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize2, Minimize2, Trash2, Save, Hexagon, Octagon, Star, MessageSquare, ChevronRight, Sparkles, Bot, Zap, Loader2, X } from 'lucide-react';
import { generateUmlDiagram } from '../services/geminiService';

type Tool = 'select' | 'connector' | 'class' | 'interface' | 'abstract' | 'actor' | 'usecase' | 'package' | 'component' | 'database' | 'note' | 'decision' | 'activity' | 'startEnd'
  | 'parallelogram' | 'trapezoid' | 'hexagon' | 'octagon' | 'star' | 'callout' | 'chevron' | 'pill';

type ElementType = 'class' | 'interface' | 'abstract' | 'actor' | 'usecase' | 'package' | 'component' | 'database' | 'note' | 'decision' | 'activity' | 'startEnd'
  | 'parallelogram' | 'trapezoid' | 'hexagon' | 'octagon' | 'star' | 'callout' | 'chevron' | 'pill';

type ConnectorType = 'association' | 'dependency' | 'inheritance' | 'realization' | 'aggregation' | 'composition';

interface DiagramElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

interface DiagramConnector {
  id: string;
  fromId: string;
  toId: string;
  type: ConnectorType;
}

interface DiagramSnapshot {
  elements: DiagramElement[];
  connectors: DiagramConnector[];
  selectedIds: string[];
}

const GRID_SIZE = 24;

const EnhancedUML: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [elements, setElements] = useState<DiagramElement[]>([]);
  const [connectors, setConnectors] = useState<DiagramConnector[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dragState, setDragState] = useState<{ ids: string[]; startX: number; startY: number; origin: Map<string, { x: number; y: number }> } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [connectorType, setConnectorType] = useState<ConnectorType>('association');
  const [connectorStartId, setConnectorStartId] = useState<string | null>(null);
  const [history, setHistory] = useState<DiagramSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<DiagramSnapshot[]>([]);
  const dragSnapshotRef = useRef<DiagramSnapshot | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [resizeStep, setResizeStep] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; x: number; y: number; width: number; height: number; additive: boolean } | null>(null);
  const primarySelectedId = selectedIds.length > 0 ? selectedIds[0] : null;
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{ diagramType?: string; explanation?: string } | null>(null);

  const storageKey = 'uml_diagram_v1';

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setAiResult(null);
    try {
      const result = await generateUmlDiagram(aiPrompt);
      if (result && !result.error) {
        setElements(result.elements || []);
        setConnectors(result.connectors || []);
        setAiResult({ diagramType: result.diagramType, explanation: result.explanation });
        pushHistory(result.elements || [], result.connectors || [], []);
      } else {
        alert(result.error || "No se pudo generar el diagrama.");
      }
    } catch (err) {
      console.error("AI Error:", err);
      alert("Error al conectar con la IA.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const saveDiagram = () => {
    const payload = {
      elements,
      connectors,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    setLastSavedAt(payload.savedAt);
  };

  const loadDiagram = () => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { elements?: DiagramElement[]; connectors?: DiagramConnector[]; savedAt?: string };
      if (!parsed.elements || !parsed.connectors) return;
      setElements(parsed.elements);
      setConnectors(parsed.connectors);
      setSelectedIds([]);
      setLastSavedAt(parsed.savedAt ?? null);
    } catch {
      return;
    }
  };

  useEffect(() => {
    loadDiagram();
  }, []);

  const toolOptions = useMemo(
    () => [
      { id: 'select', label: 'Seleccionar', icon: MousePointer },
      { id: 'connector', label: 'Conector', icon: ArrowRight },
      { id: 'class', label: 'Clase', icon: Square },
      { id: 'interface', label: 'Interfaz', icon: Square },
      { id: 'abstract', label: 'Abstracta', icon: Square },
      { id: 'actor', label: 'Actor', icon: Circle },
      { id: 'usecase', label: 'Caso de uso', icon: Circle },
      { id: 'package', label: 'Paquete', icon: FileText },
      { id: 'component', label: 'Componente', icon: Square },
      { id: 'database', label: 'Base de datos', icon: Circle },
      { id: 'note', label: 'Nota', icon: FileText },
      { id: 'decision', label: 'Decisión', icon: Diamond },
      { id: 'activity', label: 'Actividad', icon: Square },
      { id: 'startEnd', label: 'Inicio/Fin', icon: Circle },
      // Organizadores
      { id: 'parallelogram', label: 'Paralelogramo', icon: Square },
      { id: 'trapezoid', label: 'Trapezoide', icon: Square },
      { id: 'hexagon', label: 'Hexágono', icon: Hexagon },
      { id: 'octagon', label: 'Octágono', icon: Octagon },
      { id: 'star', label: 'Estrella', icon: Star },
      { id: 'callout', label: 'Bocadillo', icon: MessageSquare },
      { id: 'chevron', label: 'Chevron', icon: ChevronRight },
      { id: 'pill', label: 'Píldora', icon: Circle }
    ],
    []
  );

  const getPoint = (event: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const getDefaults = (type: ElementType) => {
    switch (type) {
      case 'interface':
        return { width: 170, height: 110, text: '<<interface>>\nInterfaz' };
      case 'abstract':
        return { width: 170, height: 110, text: '<<abstract>>\nClaseAbstracta' };
      case 'actor':
        return { width: 80, height: 80, text: 'Actor' };
      case 'usecase':
        return { width: 140, height: 80, text: 'Caso de uso' };
      case 'package':
        return { width: 170, height: 110, text: 'Paquete' };
      case 'component':
        return { width: 170, height: 100, text: 'Componente' };
      case 'database':
        return { width: 140, height: 90, text: 'Base de datos' };
      case 'decision':
        return { width: 90, height: 90, text: 'Decisión' };
      case 'note':
        return { width: 140, height: 90, text: 'Nota' };
      case 'activity':
        return { width: 160, height: 80, text: 'Actividad' };
      case 'startEnd':
        return { width: 140, height: 70, text: 'Inicio/Fin' };
      case 'parallelogram':
        return { width: 170, height: 90, text: 'Paralelogramo' };
      case 'trapezoid':
        return { width: 170, height: 90, text: 'Trapezoide' };
      case 'hexagon':
        return { width: 170, height: 100, text: 'Hexágono' };
      case 'octagon':
        return { width: 170, height: 100, text: 'Octágono' };
      case 'star':
        return { width: 140, height: 120, text: 'Estrella' };
      case 'callout':
        return { width: 170, height: 100, text: 'Bocadillo' };
      case 'chevron':
        return { width: 170, height: 90, text: 'Chevron' };
      case 'pill':
        return { width: 180, height: 60, text: 'Etiqueta' };
      default:
        return { width: 160, height: 100, text: 'Clase' };
    }
  };

  const pushHistory = (nextElements: DiagramElement[], nextConnectors: DiagramConnector[], nextSelectedIds: string[]) => {
    setHistory(prev => [...prev, { elements, connectors, selectedIds }]);
    setRedoStack([]);
    setElements(nextElements);
    setConnectors(nextConnectors);
    setSelectedIds(nextSelectedIds);
  };

  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack(current => [{ elements, connectors, selectedIds }, ...current]);
      setElements(last.elements);
      setConnectors(last.connectors);
      setSelectedIds(last.selectedIds);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      setHistory(current => [...current, { elements, connectors, selectedIds }]);
      setElements(first.elements);
      setConnectors(first.connectors);
      setSelectedIds(first.selectedIds);
      return rest;
    });
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (tool === 'select') {
      if (event.currentTarget === event.target) {
        const point = getPoint(event);
        setSelectionBox({
          startX: point.x,
          startY: point.y,
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          additive: event.shiftKey
        });
      }
      return;
    }
    if (tool === 'connector') {
      if (event.currentTarget === event.target) {
        setConnectorStartId(null);
        setSelectedIds([]);
      }
      return;
    }
    const point = getPoint(event);
    const defaults = getDefaults(tool);
    const newElement: DiagramElement = {
      id: `${tool}-${Date.now()}`,
      type: tool,
      x: point.x - defaults.width / 2,
      y: point.y - defaults.height / 2,
      width: defaults.width,
      height: defaults.height,
      text: defaults.text
    };
    pushHistory([...elements, newElement], connectors, [newElement.id]);
  };

  const handleElementMouseDown = (event: React.MouseEvent<HTMLDivElement>, element: DiagramElement) => {
    event.stopPropagation();
    if (tool === 'connector') {
      if (!connectorStartId) {
        setConnectorStartId(element.id);
        setSelectedIds([element.id]);
        return;
      }
      if (connectorStartId !== element.id) {
        const newConnector: DiagramConnector = {
          id: `connector-${Date.now()}`,
          fromId: connectorStartId,
          toId: element.id,
          type: connectorType
        };
        pushHistory(elements, [...connectors, newConnector], [element.id]);
      }
      setConnectorStartId(null);
      return;
    }
    const point = getPoint(event);
    let nextSelectedIds = selectedIds;
    if (event.shiftKey) {
      nextSelectedIds = selectedIds.includes(element.id)
        ? selectedIds.filter(id => id !== element.id)
        : [...selectedIds, element.id];
    } else if (!selectedIds.includes(element.id)) {
      nextSelectedIds = [element.id];
    }
    setSelectedIds(nextSelectedIds);
    const origin = new Map<string, { x: number; y: number }>();
    nextSelectedIds.forEach(id => {
      const target = elements.find(el => el.id === id);
      if (target) origin.set(id, { x: target.x, y: target.y });
    });
    dragSnapshotRef.current = { elements, connectors, selectedIds: nextSelectedIds };
    setDragState({ ids: nextSelectedIds, startX: point.x, startY: point.y, origin });
  };

  const handleElementDoubleClick = (event: React.MouseEvent<HTMLDivElement>, element: DiagramElement) => {
    event.stopPropagation();
    setSelectedIds([element.id]);
    setEditingId(element.id);
    setEditingText(element.text);
  };

  const commitEditing = () => {
    if (!editingId) return;
    const trimmed = editingText.trim();
    const nextElements = elements.map(el => (el.id === editingId ? { ...el, text: trimmed || el.text } : el));
    pushHistory(nextElements, connectors, [editingId]);
    setEditingId(null);
    setEditingText('');
  };

  const resizeSelected = (direction: 'increase' | 'decrease') => {
    if (!primarySelectedId) return;
    const step = Math.max(2, resizeStep);
    const delta = direction === 'increase' ? step : -step;
    const nextElements = elements.map(el => {
      if (el.id !== primarySelectedId) return el;
      const nextWidth = Math.max(40, el.width + delta);
      const nextHeight = Math.max(30, el.height + delta);
      const centerX = el.x + el.width / 2;
      const centerY = el.y + el.height / 2;
      return {
        ...el,
        width: nextWidth,
        height: nextHeight,
        x: centerX - nextWidth / 2,
        y: centerY - nextHeight / 2
      };
    });
    pushHistory(nextElements, connectors, [primarySelectedId]);
  };

  const removeSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    const nextElements = elements.filter(el => !selectedSet.has(el.id));
    const nextConnectors = connectors.filter(connector => !selectedSet.has(connector.fromId) && !selectedSet.has(connector.toId));
    pushHistory(nextElements, nextConnectors, []);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    if (!primarySelectedId) return;
    resizeSelected(event.deltaY < 0 ? 'increase' : 'decrease');
  };

  const toggleFullscreen = async () => {
    const frame = frameRef.current;
    if (!frame) return;
    if (!document.fullscreenElement) {
      await frame.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (editingId) return;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.length > 0) {
        event.preventDefault();
        removeSelected();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setSelectedIds(elements.map(el => el.id));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingId, selectedIds, elements, connectors]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectionBox) {
      const point = getPoint(event);
      const width = point.x - selectionBox.startX;
      const height = point.y - selectionBox.startY;
      setSelectionBox(prev => prev ? { ...prev, x: Math.min(point.x, prev.startX), y: Math.min(point.y, prev.startY), width: Math.abs(width), height: Math.abs(height) } : null);
      return;
    }
    if (!dragState) return;
    const point = getPoint(event);
    const deltaX = point.x - dragState.startX;
    const deltaY = point.y - dragState.startY;
    setElements(prev =>
      prev.map(el => {
        const origin = dragState.origin.get(el.id);
        if (!origin) return el;
        return { ...el, x: origin.x + deltaX, y: origin.y + deltaY };
      })
    );
  };

  const handleMouseUp = () => {
    if (selectionBox) {
      const rect = selectionBox;
      const selectedInBox = elements.filter(el => {
        const withinX = el.x >= rect.x && el.x + el.width <= rect.x + rect.width;
        const withinY = el.y >= rect.y && el.y + el.height <= rect.y + rect.height;
        return withinX && withinY;
      }).map(el => el.id);
      const nextSelectedIds = rect.additive ? Array.from(new Set([...selectedIds, ...selectedInBox])) : selectedInBox;
      setSelectedIds(nextSelectedIds);
      setSelectionBox(null);
      return;
    }
    if (dragState && dragSnapshotRef.current) {
      const before = dragSnapshotRef.current;
      const moved = dragState.ids.some(id => {
        const beforeElement = before.elements.find(el => el.id === id);
        const afterElement = elements.find(el => el.id === id);
        return beforeElement && afterElement && (beforeElement.x !== afterElement.x || beforeElement.y !== afterElement.y);
      });
      if (moved) {
        setHistory(prev => [...prev, before]);
        setRedoStack([]);
      }
    }
    dragSnapshotRef.current = null;
    setDragState(null);
  };

  return (
    <div ref={frameRef} className="flex flex-col h-full bg-slate-50 dark:bg-[#1e1e2d] relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-[#2a2b36]/90 rounded-[2rem] shadow-2xl p-2 2xl:p-3 flex items-center gap-2 z-10 border border-white/20 dark:border-white/5 backdrop-blur-xl animate-in slide-in-from-top duration-500 shadow-indigo-500/10 max-w-[85%] overflow-x-auto">
        {toolOptions.map(option => {
          const Icon = option.icon;
          const isActive = tool === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setTool(option.id as Tool)}
              className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#7b68ee] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              title={option.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
        {tool === 'connector' && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
            {[
              { id: 'association', label: 'Asociación' },
              { id: 'dependency', label: 'Dependencia' },
              { id: 'inheritance', label: 'Herencia' },
              { id: 'realization', label: 'Realización' },
              { id: 'aggregation', label: 'Agregación' },
              { id: 'composition', label: 'Composición' }
            ].map(option => (
              <button
                key={option.id}
                onClick={() => setConnectorType(option.id as ConnectorType)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-lg transition-all ${connectorType === option.id ? 'bg-[#7b68ee] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/10'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          className={`p-1.5 rounded-xl transition-all ${history.length === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Deshacer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className={`p-1.5 rounded-xl transition-all ${redoStack.length === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Rehacer"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
          <button
            onClick={() => resizeSelected('decrease')}
            disabled={!primarySelectedId}
            className={`p-1.5 rounded-lg transition-all ${primarySelectedId ? 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/10' : 'text-slate-300 dark:text-slate-600'}`}
            title="Reducir tamaño"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="number"
            min={2}
            max={80}
            value={resizeStep}
            onChange={(event) => setResizeStep(Number(event.target.value) || 10)}
            className="w-10 text-[10px] font-semibold text-slate-600 dark:text-slate-200 bg-transparent text-center outline-none"
          />
          <button
            onClick={() => resizeSelected('increase')}
            disabled={!primarySelectedId}
            className={`p-1.5 rounded-lg transition-all ${primarySelectedId ? 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/10' : 'text-slate-300 dark:text-slate-600'}`}
            title="Aumentar tamaño"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setShowGrid(value => !value)}
          className={`p-1.5 rounded-xl transition-all ${showGrid ? 'bg-[#7b68ee] text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title={showGrid ? 'Ocultar cuadrícula' : 'Mostrar cuadrícula'}
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={removeSelected}
          disabled={selectedIds.length === 0}
          className={`p-1.5 rounded-xl transition-all ${selectedIds.length > 0 ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-slate-300 dark:text-slate-600'}`}
          title="Eliminar forma"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowAiAssistant(!showAiAssistant)}
          className={`p-1.5 rounded-xl transition-all shadow-sm ${showAiAssistant ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20'}`}
          title="Asistente de Diseño IA"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={saveDiagram}
          className="p-1.5 rounded-xl transition-all text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Guardar diagrama"
        >
          <Save className="w-4 h-4" />
        </button>
        {lastSavedAt && (
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">
            Guardado
          </span>
        )}
        <button
          onClick={() => setSelectedIds(elements.map(el => el.id))}
          className="px-2 py-1.5 text-[10px] font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Seleccionar todo"
        >
          Todo
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-xl transition-all text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {showAiAssistant && (
        <div className="absolute bottom-6 right-6 w-96 z-20 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-white dark:bg-[#20212e] rounded-3xl shadow-2xl border border-indigo-100 dark:border-indigo-500/20 overflow-hidden backdrop-blur-xl">
            <div className="bg-indigo-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bot className="w-5 h-5" />
                <h3 className="font-bold text-sm">Arquitecto UML IA</h3>
              </div>
              <button
                onClick={() => setShowAiAssistant(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Indicación de Diseño</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ej: Diseña un sistema de biblioteca con clases para Libro y Usuario..."
                  className="w-full h-32 bg-slate-50 dark:bg-[#1a1b26] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                />
              </div>

              {aiResult && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3 text-indigo-500" />
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 capitalize">{aiResult.diagramType} Detectado</span>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{aiResult.explanation}"
                  </p>
                </div>
              )}

              <button
                onClick={handleAiGenerate}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl py-3 text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 group"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Optimizando Arquitectura...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                    Generar Diagrama Inteligente
                  </>
                )}
              </button>

              <p className="text-[9px] text-center text-slate-400">
                La IA seleccionará automáticamente el estándar UML más apropiado.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden m-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151521]">
        <div
          ref={containerRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="absolute inset-0"
          style={{
            backgroundImage: showGrid
              ? `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`
              : undefined,
            backgroundSize: showGrid ? `${GRID_SIZE}px ${GRID_SIZE}px` : undefined
          }}
        >
          {selectionBox && (
            <div
              className="absolute border border-[#7b68ee] bg-[#7b68ee]/10 pointer-events-none"
              style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }}
            />
          )}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8" fill="currentColor" />
              </marker>
              <marker id="triangle" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </marker>
              <marker id="diamond-outline" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                <path d="M0,6 L6,0 L12,6 L6,12 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </marker>
              <marker id="diamond-filled" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                <path d="M0,6 L6,0 L12,6 L6,12 Z" fill="currentColor" />
              </marker>
            </defs>
            {connectors.map(connector => {
              const from = elements.find(el => el.id === connector.fromId);
              const to = elements.find(el => el.id === connector.toId);
              if (!from || !to) return null;
              const x1 = from.x + from.width / 2;
              const y1 = from.y + from.height / 2;
              const x2 = to.x + to.width / 2;
              const y2 = to.y + to.height / 2;
              const isDashed = connector.type === 'dependency' || connector.type === 'realization';
              const markerEnd =
                connector.type === 'inheritance' || connector.type === 'realization'
                  ? 'url(#triangle)'
                  : connector.type === 'aggregation'
                    ? 'url(#diamond-outline)'
                    : connector.type === 'composition'
                      ? 'url(#diamond-filled)'
                      : 'url(#arrow)';
              return (
                <line
                  key={connector.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth={2}
                  markerEnd={markerEnd}
                  strokeDasharray={isDashed ? '6 4' : 'none'}
                  className="text-slate-500 dark:text-slate-300"
                />
              );
            })}
          </svg>
          {elements.map(element => {
            const isSelected = selectedIds.includes(element.id);
            if (element.type === 'decision') {
              return (
                <div
                  key={element.id}
                  onMouseDown={(event) => handleElementMouseDown(event, element)}
                  onDoubleClick={(event) => handleElementDoubleClick(event, element)}
                  className="absolute"
                  style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
                >
                  <div className={`w-full h-full rotate-45 border-2 ${isSelected ? 'border-[#7b68ee]' : 'border-slate-400'} bg-white dark:bg-[#1f2030] flex items-center justify-center`}>
                    {editingId === element.id ? (
                      <textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        onBlur={commitEditing}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            commitEditing();
                          }
                        }}
                        className="text-xs text-slate-700 dark:text-slate-800 -rotate-45 whitespace-pre-line text-center bg-transparent resize-none outline-none w-full h-full"
                      />
                    ) : (
                      <span className="text-xs text-slate-700 dark:text-slate-800 -rotate-45 whitespace-pre-line text-center">{element.text}</span>
                    )}
                  </div>
                </div>
              );
            }
            if (element.type === 'database') {
              return (
                <div
                  key={element.id}
                  onMouseDown={(event) => handleElementMouseDown(event, element)}
                  onDoubleClick={(event) => handleElementDoubleClick(event, element)}
                  className={`absolute flex items-center justify-center text-xs text-slate-700 dark:text-slate-800 select-none ${isSelected ? 'ring-2 ring-[#7b68ee]' : ''}`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    borderRadius: '9999px',
                    border: '2px solid',
                    borderColor: isSelected ? '#7b68ee' : '#94a3b8',
                    backgroundColor: 'rgba(255,255,255,0.9)'
                  }}
                >
                  {editingId === element.id ? (
                    <textarea
                      value={editingText}
                      onChange={(event) => setEditingText(event.target.value)}
                      onBlur={commitEditing}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          commitEditing();
                        }
                      }}
                      className="text-xs text-slate-700 dark:text-slate-800 whitespace-pre-line text-center bg-transparent resize-none outline-none w-full h-full"
                    />
                  ) : (
                    <span className="whitespace-pre-line text-center">{element.text}</span>
                  )}
                </div>
              );
            }
            if (element.type === 'parallelogram') {
              return (
                <div
                  key={element.id}
                  onMouseDown={(event) => handleElementMouseDown(event, element)}
                  onDoubleClick={(event) => handleElementDoubleClick(event, element)}
                  className={`absolute select-none ${isSelected ? 'ring-2 ring-[#7b68ee]' : ''}`}
                  style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
                >
                  <div
                    className="w-full h-full border-2 bg-white dark:bg-[#1f2030] flex items-center justify-center"
                    style={{ borderColor: isSelected ? '#7b68ee' : '#94a3b8', transform: 'skewX(-15deg)' }}
                  >
                    {editingId === element.id ? (
                      <textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        onBlur={commitEditing}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            commitEditing();
                          }
                        }}
                        className="text-xs text-slate-700 dark:text-slate-800 whitespace-pre-line text-center bg-transparent resize-none outline-none w-[90%]"
                        style={{ transform: 'skewX(15deg)' }}
                      />
                    ) : (
                      <span className="text-xs text-slate-700 dark:text-slate-800 whitespace-pre-line text-center" style={{ transform: 'skewX(15deg)' }}>{element.text}</span>
                    )}
                  </div>
                </div>
              );
            }
            if (element.type === 'trapezoid' || element.type === 'hexagon' || element.type === 'octagon' || element.type === 'star' || element.type === 'chevron' || element.type === 'callout') {
              const clip =
                element.type === 'trapezoid'
                  ? 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)'
                  : element.type === 'hexagon'
                    ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                    : element.type === 'octagon'
                      ? 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                      : element.type === 'star'
                        ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                        : element.type === 'chevron'
                          ? 'polygon(0 0, 60% 0, 100% 50%, 60% 100%, 0 100%, 40% 50%)'
                          : 'none';
              return (
                <div
                  key={element.id}
                  onMouseDown={(event) => handleElementMouseDown(event, element)}
                  onDoubleClick={(event) => handleElementDoubleClick(event, element)}
                  className={`absolute select-none ${isSelected ? 'ring-2 ring-[#7b68ee]' : ''}`}
                  style={{ left: element.x, top: element.y, width: element.width, height: element.height }}
                >
                  <div
                    className="w-full h-full border-2 bg-white dark:bg-[#1f2030] flex items-center justify-center relative"
                    style={{ borderColor: isSelected ? '#7b68ee' : '#94a3b8', clipPath: element.type === 'callout' ? undefined : clip }}
                  >
                    {/* Tail for callout */}
                    {element.type === 'callout' && (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
                        />
                        <div
                          className="absolute"
                          style={{
                            width: 12,
                            height: 12,
                            left: 10,
                            bottom: -6,
                            transform: 'rotate(45deg)',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            borderLeft: `2px solid ${isSelected ? '#7b68ee' : '#94a3b8'}`,
                            borderBottom: `2px solid ${isSelected ? '#7b68ee' : '#94a3b8'}`
                          }}
                        />
                      </>
                    )}
                    {editingId === element.id ? (
                      <textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        onBlur={commitEditing}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            commitEditing();
                          }
                        }}
                        className="text-xs text-slate-700 dark:text-slate-800 whitespace-pre-line text-center bg-transparent resize-none outline-none w-[90%] h-[85%]"
                      />
                    ) : (
                      <span className="text-xs text-slate-700 dark:text-slate-800 whitespace-pre-line text-center">{element.text}</span>
                    )}
                  </div>
                </div>
              );
            }
            const radius = element.type === 'usecase' || element.type === 'startEnd' || element.type === 'pill' ? '9999px' : element.type === 'activity' ? '20px' : element.type === 'actor' ? '9999px' : '12px';
            return (
              <div
                key={element.id}
                onMouseDown={(event) => handleElementMouseDown(event, element)}
                onDoubleClick={(event) => handleElementDoubleClick(event, element)}
                className={`absolute flex items-center justify-center text-xs text-slate-700 dark:text-slate-800 select-none ${isSelected ? 'ring-2 ring-[#7b68ee]' : ''}`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  borderRadius: radius,
                  border: '2px solid',
                  borderColor: isSelected ? '#7b68ee' : '#94a3b8',
                  backgroundColor: 'rgba(255,255,255,0.9)'
                }}
              >
                {editingId === element.id ? (
                  <textarea
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    onBlur={commitEditing}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        commitEditing();
                      }
                    }}
                    className="text-xs text-slate-700 dark:text-slate-800 whitespace-pre-line text-center bg-transparent resize-none outline-none w-full h-full"
                  />
                ) : (
                  <span className="whitespace-pre-line text-center">{element.text}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EnhancedUML;
