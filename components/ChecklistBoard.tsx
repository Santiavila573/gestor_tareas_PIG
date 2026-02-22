import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, CheckCircle2, Circle, ArrowLeftRight, Palette, Bot, Wand2, Save } from 'lucide-react';
import { generateScrumAdvice } from '../services/geminiService';

type Section = string;

interface ChecklistTask {
  id: string;
  title: string;
  color: string;
  section: Section;
}

const COLORS = ['#7b68ee', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#3b82f6', '#e11d48', '#84cc16'];

const SECTION_META: Record<Section, { label: string; accent: string; lightAccent: string; desc: string }> = {
  todo: { label: 'Por Hacer', accent: 'from-[#7b68ee] to-purple-600', lightAccent: 'from-indigo-500 to-indigo-600', desc: 'Ideas y pendientes por iniciar' },
  inprogress: { label: 'En Progreso', accent: 'from-cyan-500 to-blue-600', lightAccent: 'from-sky-500 to-blue-600', desc: 'Tareas en curso y a mitad' },
  done: { label: 'Hechas', accent: 'from-emerald-500 to-green-600', lightAccent: 'from-emerald-500 to-green-600', desc: 'Entregas completadas y verificadas' }
};

const storageKey = 'pig_checklist_board_v1';
const customSectionsKey = 'pig_checklist_custom_sections_v1';

const ChecklistBoard: React.FC = () => {
  const [tasks, setTasks] = useState<ChecklistTask[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [inputs, setInputs] = useState<Record<Section, string>>({
    todo: '',
    inprogress: '',
    done: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [paletteForId, setPaletteForId] = useState<string | null>(null);
  const [customSections, setCustomSections] = useState<{ id: string; label: string; accent: string; lightAccent: string; desc: string }[]>(() => {
    const saved = localStorage.getItem(customSectionsKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [newSectionName, setNewSectionName] = useState<string>('');
  const [aiIsLoading, setAiIsLoading] = useState<boolean>(false);
  const [aiOutput, setAiOutput] = useState<string>('');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    setLastSavedAt(Date.now());
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem(customSectionsKey, JSON.stringify(customSections));
  }, [customSections]);

  const bySection = useMemo(() => {
    const base = {
      todo: tasks.filter(t => t.section === 'todo'),
      inprogress: tasks.filter(t => t.section === 'inprogress'),
      done: tasks.filter(t => t.section === 'done')
    } as Record<string, ChecklistTask[]>;
    customSections.forEach(cs => {
      base[cs.id] = tasks.filter(t => t.section === cs.id);
    });
    return base;
  }, [tasks, customSections]);

  const addTask = (section: Section) => {
    const title = inputs[section].trim();
    if (!title) return;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newTask: ChecklistTask = { id: Date.now().toString(), title, color, section };
    setTasks(prev => [newTask, ...prev]);
    setInputs(prev => ({ ...prev, [section]: '' }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const startEdit = (task: ChecklistTask) => {
    setEditingId(task.id);
    setEditingText(task.title);
  };

  const confirmEdit = () => {
    if (!editingId) return;
    setTasks(prev => prev.map(t => t.id === editingId ? { ...t, title: editingText.trim() || t.title } : t));
    setEditingId(null);
    setEditingText('');
  };

  const moveTask = (id: string, dir: 'left' | 'right') => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const order: Section[] = ['todo', 'inprogress', 'done', ...customSections.map(s => s.id)];
      const idx = order.indexOf(t.section);
      const nextIdx = dir === 'left' ? Math.max(0, idx - 1) : Math.min(order.length - 1, idx + 1);
      return { ...t, section: order[nextIdx] };
    }));
  };

  const setColor = (id: string, color: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, color } : t));
    setPaletteForId(null);
  };

  const addSection = () => {
    const label = newSectionName.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, '-');
    if (['todo', 'inprogress', 'done', ...customSections.map(s => s.id)].includes(id)) return;
    const accents = ['from-pink-500 to-rose-600', 'from-amber-500 to-orange-600', 'from-violet-500 to-fuchsia-600', 'from-teal-500 to-emerald-600', 'from-gray-500 to-slate-600'];
    const accent = accents[Math.floor(Math.random() * accents.length)];
    const newSection = { id, label, accent, lightAccent: accent, desc: 'Categoría personalizada' };
    setCustomSections(prev => [...prev, newSection]);
    setNewSectionName('');
  };

  const askAIForSuggestions = async () => {
    try {
      setAiIsLoading(true);
      const overviewParts = [
        `Por Hacer: ${bySection.todo.length}`,
        `En Progreso: ${bySection.inprogress.length}`,
        `Hechas: ${bySection.done.length}`,
        ...customSections.map(cs => `${cs.label}: ${bySection[cs.id]?.length || 0}`)
      ];
      const overview = overviewParts.join(' | ');
      const list = tasks.slice(0, 50).map(t => `- [${(SECTION_META[t.section as 'todo' | 'inprogress' | 'done']?.label || customSections.find(cs => cs.id === t.section)?.label || t.section)}] ${t.title}`).join('\n');
      const query = `Sugiere 6 tareas cortas y accionables para este tablero y clasifícalas en categorías existentes por su naturaleza.\nResumen: ${overview}\nListado actual:\n${list}\nDevuelve solo una lista con el formato "[Categoría] Tarea".`;
      const response = await generateScrumAdvice(query, {
        tasks: [],
        sprints: [],
        users: [],
        userRole: 'Product Owner',
        userName: 'Usuario'
      } as any);
      setAiOutput(response);
      const lines = response.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('```'));
      const additions: ChecklistTask[] = [];
      lines.forEach(line => {
        const match = line.match(/^\[([^\]]+)\]\s*(.+)$/);
        let targetLabel = '';
        let title = '';
        if (match) {
          targetLabel = match[1];
          title = match[2];
        } else {
          title = line.replace(/^[-•]\s*/, '');
        }
        const targetId =
          (Object.entries(SECTION_META).find(([, m]) => m.label.toLowerCase() === targetLabel.toLowerCase())?.[0]) ||
          (customSections.find(cs => cs.label.toLowerCase() === targetLabel.toLowerCase())?.id) ||
          'todo';
        additions.push({
          id: (Date.now() + Math.random()).toString(),
          title,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          section: targetId
        });
      });
      if (additions.length) {
        setTasks(prev => [...additions, ...prev]);
      }
    } catch (e) {
      setAiOutput('No se pudo obtener sugerencias de la IA. Verifica tu API Key.');
    } finally {
      setAiIsLoading(false);
    }
  };

  const saveBoard = () => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
    setLastSavedAt(Date.now());
  };

  const TaskItem: React.FC<{ task: ChecklistTask }> = ({ task }) => {
    const isEditing = editingId === task.id;
    return (
      <div className="group relative flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/70 shadow-sm dark:bg-white/5 dark:border-white/10 hover:border-[#7b68ee]/30 hover:shadow-md transition-all">
        <button
          className="flex-shrink-0 w-6 h-6 rounded-full grid place-items-center ring-2 ring-white/40"
          style={{ background: task.color }}
          onClick={() => setPaletteForId(paletteForId === task.id ? null : task.id)}
          title="Cambiar color"
        >
          <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
        </button>
        {isEditing ? (
          <input
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') confirmEdit(); }}
            className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-slate-200"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</span>
        )}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button onClick={confirmEdit} className="px-2 py-1 rounded-lg bg-[#7b68ee] text-white text-xs font-bold hover:opacity-90 active:scale-95">Guardar</button>
          ) : (
            <button onClick={() => startEdit(task)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-[#7b68ee] active:scale-95" title="Editar">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => moveTask(task.id, 'left')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-blue-500 active:scale-95" title="Mover izquierda">
            <ArrowLeftRight className="w-4 h-4 rotate-180" />
          </button>
          <button onClick={() => moveTask(task.id, 'right')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-blue-500 active:scale-95" title="Mover derecha">
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <button onClick={() => deleteTask(task.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 active:scale-95" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {paletteForId === task.id && (
          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl p-2 flex items-center gap-2 z-50">
            {COLORS.map(c => (
              <button key={c} className="w-6 h-6 rounded-full ring-1 ring-black/10" style={{ background: c }} onClick={() => setColor(task.id, c)} title={c} />
            ))}
            <Palette className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
    );
  };

  const SectionColumn: React.FC<{ section: Section }> = ({ section }) => {
    const meta = SECTION_META[section as 'todo' | 'inprogress' | 'done'] || {
      label: customSections.find(cs => cs.id === section)?.label || section,
      accent: customSections.find(cs => cs.id === section)?.accent || 'from-violet-500 to-fuchsia-600',
      lightAccent: customSections.find(cs => cs.id === section)?.lightAccent || 'from-violet-500 to-fuchsia-600',
      desc: customSections.find(cs => cs.id === section)?.desc || 'Categoría personalizada'
    };
    const list = bySection[section] || [];
    return (
      <div className="flex flex-col gap-3 bg-white/30 dark:bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <div className={`px-3 py-1.5 rounded-xl text-white font-black text-xs bg-gradient-to-r ${meta.lightAccent} dark:${meta.accent} shadow-lg`}>
            {meta.label}
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{list.length}</span>
          </div>
        </div>
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-2">{meta.desc}</p>
        <div className="flex items-center gap-2">
          <input
            value={inputs[section] ?? ''}
            onChange={(e) => setInputs(prev => ({ ...prev, [section]: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') addTask(section); }}
            placeholder="Nueva tarea..."
            className="flex-1 bg-white border border-slate-200/70 dark:bg-white/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:text-slate-200 outline-none focus:border-[#7b68ee]/40 shadow-sm"
          />
          <button onClick={() => addTask(section)} className="px-3 py-2 rounded-xl bg-[#7b68ee] text-white text-xs font-bold flex items-center gap-1 active:scale-95">
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>
        <div className="space-y-2">
          {list.map(t => <TaskItem key={t.id} task={t} />)}
          {list.length === 0 && (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-xs">Sin tareas</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-6 md:p-8 bg-gradient-to-br from-slate-50 via-slate-100 to-white dark:from-[#0a0a0f] dark:via-[#1a1a2e] dark:to-[#0f0f1a]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Pizarra Checklist</h1>
              <p className="text-[12px] font-medium text-slate-600 dark:text-slate-400">Organiza tareas con colores, secciones y estados rápidos.</p>
            </div>
            <button
              onClick={askAIForSuggestions}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 active:scale-95"
              title="Asistencia IA: sugerir tareas y clasificaciones"
            >
              {aiIsLoading ? <Wand2 className="w-4 h-4 animate-spin text-[#7b68ee]" /> : <Bot className="w-4 h-4 text-[#7b68ee]" />}
              Asistencia IA
            </button>
            <button
              onClick={saveBoard}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-2 active:scale-95"
              title="Guardar cambios"
            >
              <Save className="w-4 h-4 text-[#7b68ee]" />
              Guardar
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span>Total:</span>
            <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:text-white dark:border-white/10 shadow-sm">{tasks.length}</span>
            {lastSavedAt && (
              <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400">
                Guardado a las {new Date(lastSavedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        {aiOutput && (
          <div className="mb-4 p-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm shadow-sm dark:bg-white/10 dark:text-white/90 dark:border-white/10">
            {aiOutput}
          </div>
        )}
        <div className="mb-4 flex items-center gap-2">
          <input
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addSection(); }}
            placeholder="Nueva categoría (ej. Bloqueados, Ideas)"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#7b68ee]/40 shadow-sm"
          />
          <button onClick={addSection} className="px-3 py-2 rounded-xl bg-[#7b68ee] text-white text-xs font-bold flex items-center gap-1 active:scale-95">
            <Plus className="w-4 h-4" />
            Añadir categoría
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SectionColumn section="todo" />
          <SectionColumn section="inprogress" />
          <SectionColumn section="done" />
          {customSections.map(cs => (
            <SectionColumn key={cs.id} section={cs.id} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChecklistBoard;
