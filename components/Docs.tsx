import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Folder, Plus, Trash2, Save, MoreHorizontal,
  Upload, Search, Home, ArrowLeft, File, Image as ImageIcon,
  FileSpreadsheet, FileType, FileCode, Film, Music, Download,
  Maximize2, ZoomIn, ZoomOut, X, RefreshCw, Grid, List,
  MoreVertical, CornerUpLeft, AlertCircle, BarChart2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import Modal from './common/Modal';
import { User } from '../types';

// --- Types ---

type DocType = 'text' | 'folder' | 'image' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'csv' | 'video' | 'audio' | 'other';

interface FileSystemItem {
  id: string;
  parentId: string | null; // null for root
  type: DocType;
  name: string;
  content?: string; // For editable text docs
  blob?: string; // Base64 data for uploaded files
  size?: number; // In bytes
  mimeType?: string;
  createdBy?: string; // User name
  ownerId?: string; // User ID
  createdAt: string;
  updatedAt: string;
  isTrashed: boolean;
}

// --- Icons Helper ---

const getFileColors = (type: DocType) => {
  switch (type) {
    case 'folder': return {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-700/30',
      text: 'text-amber-700 dark:text-amber-400',
      icon: 'text-amber-500',
      fill: 'fill-amber-500/20'
    };
    case 'pdf': return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700/30',
      text: 'text-red-700 dark:text-red-400',
      icon: 'text-red-500',
      fill: 'fill-red-500/10'
    };
    case 'word': return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700/30',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600',
      fill: 'fill-blue-600/10'
    };
    case 'excel': case 'csv': return {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-700/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: 'text-emerald-600',
      fill: 'fill-emerald-600/10'
    };
    case 'powerpoint': return {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-700/30',
      text: 'text-orange-700 dark:text-orange-400',
      icon: 'text-orange-500',
      fill: 'fill-orange-500/10'
    };
    case 'image': return {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-700/30',
      text: 'text-purple-700 dark:text-purple-400',
      icon: 'text-purple-500',
      fill: 'fill-purple-500/10'
    };
    case 'video': return {
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      border: 'border-pink-200 dark:border-pink-700/30',
      text: 'text-pink-700 dark:text-pink-400',
      icon: 'text-pink-500',
      fill: 'fill-pink-500/10'
    };
    case 'audio': return {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      border: 'border-cyan-200 dark:border-cyan-700/30',
      text: 'text-cyan-700 dark:text-cyan-400',
      icon: 'text-cyan-500',
      fill: 'fill-cyan-500/10'
    };
    case 'text': return {
      bg: 'bg-slate-50 dark:bg-slate-800',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-300',
      icon: 'text-slate-500',
      fill: 'fill-slate-500/10'
    };
    default: return {
      bg: 'bg-gray-50 dark:bg-gray-800',
      border: 'border-gray-200 dark:border-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      icon: 'text-gray-400',
      fill: 'fill-gray-400/10'
    };
  }
};

const getIconForType = (type: DocType, className?: string) => {
  const colors = getFileColors(type);
  const finalClass = className || `w-10 h-10 ${colors.icon} ${colors.fill}`;

  switch (type) {
    case 'folder': return <Folder className={finalClass} />;
    case 'image': return <ImageIcon className={finalClass} />;
    case 'pdf': return <FileType className={finalClass} />;
    case 'word': return <FileText className={finalClass} />;
    case 'excel': return <FileSpreadsheet className={finalClass} />;
    case 'csv': return <FileSpreadsheet className={finalClass} />;
    case 'powerpoint': return <FileType className={finalClass} />;
    case 'text': return <FileText className={finalClass} />;
    case 'video': return <Film className={finalClass} />;
    case 'audio': return <Music className={finalClass} />;
    default: return <File className={finalClass} />;
  }
};

const formatSize = (bytes?: number) => {
  if (bytes === undefined) return '--';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const Docs: React.FC<{ currentUser?: User | null }> = ({ currentUser }) => {
  // --- State ---
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'files' | 'trash'>('files');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<FileSystemItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isEditingText, setIsEditingText] = useState<string | null>(null); // ID of text doc being edited
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'folder' | 'doc'>('folder');
  const [newItemName, setNewItemName] = useState('');

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string, message: string, action: () => void } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('pig_docs_v2');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing docs", e);
      }
    } else {
      // Migrate old docs if any
      const oldDocs = localStorage.getItem('pig_docs');
      if (oldDocs) {
        try {
          const parsedOld = JSON.parse(oldDocs);
          const migrated: FileSystemItem[] = parsedOld.map((d: any) => ({
            id: d.id,
            parentId: null,
            type: 'text',
            name: d.title,
            content: d.content,
            createdAt: d.updatedAt,
            updatedAt: d.updatedAt,
            isTrashed: false
          }));
          setItems(migrated);
        } catch (e) { }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('pig_docs_v2', JSON.stringify(items));
    }
  }, [items, loading]);

  // --- Process Office Files ---
  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64.split(',')[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  useEffect(() => {
    if (!previewItem) {
      setPreviewHtml(null);
      return;
    }

    const processFile = async () => {
      setPreviewHtml(null); // Reset

      if (previewItem.type === 'word' && previewItem.blob) {
        try {
          const arrayBuffer = base64ToArrayBuffer(previewItem.blob);
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewHtml(result.value);
        } catch (e) {
          console.error("Error processing Word file", e);
          setPreviewHtml('<div class="text-red-500 p-4">Error al leer el archivo Word. Asegúrate de que es un archivo .docx válido.</div>');
        }
      } else if (previewItem.type === 'excel' && previewItem.blob) {
        try {
          const arrayBuffer = base64ToArrayBuffer(previewItem.blob);
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const html = XLSX.utils.sheet_to_html(worksheet, { id: 'excel-preview', editable: false });
          setPreviewHtml(html);
        } catch (e) {
          console.error("Error processing Excel file", e);
          setPreviewHtml('<div class="text-red-500 p-4">Error al leer el archivo Excel.</div>');
        }
      }
    };

    processFile();
  }, [previewItem]);


  // --- Actions ---

  const handleCreateFolder = () => {
    setCreateModalType('folder');
    setNewItemName('Nueva Carpeta');
    setIsCreateModalOpen(true);
  };

  const handleCreateTextDoc = () => {
    setCreateModalType('doc');
    setNewItemName('Nuevo Documento');
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = () => {
    if (!newItemName.trim()) return;

    if (createModalType === 'folder') {
      const newFolder: FileSystemItem = {
        id: Date.now().toString(),
        parentId: currentFolderId,
        type: 'folder',
        name: newItemName,
        createdBy: currentUser?.name || 'Sistema',
        ownerId: currentUser?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTrashed: false
      };
      setItems([...items, newFolder]);
    } else {
      const newDoc: FileSystemItem = {
        id: Date.now().toString(),
        parentId: currentFolderId,
        type: 'text',
        name: newItemName,
        content: '',
        createdBy: currentUser?.name || 'Sistema',
        ownerId: currentUser?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTrashed: false
      };
      setItems([...items, newDoc]);
      setIsEditingText(newDoc.id); // Open editor immediately
    }
    setIsCreateModalOpen(false);
  };

  const processAndAddFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      // Limit size to 2MB to prevent localStorage quotas issues
      if (file.size > 2 * 1024 * 1024) {
        alert(`El archivo ${file.name} es demasiado grande para el almacenamiento local (Máx 2MB).`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;

        let type: DocType = 'other';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) type = 'word';
        else if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) type = 'excel';
        else if (file.type.includes('powerpoint') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx')) type = 'powerpoint';
        else if (file.type === 'text/csv' || file.name.endsWith('.csv')) type = 'csv';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        const newItem: FileSystemItem = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          parentId: currentFolderId,
          type,
          name: file.name,
          blob: result,
          size: file.size,
          mimeType: file.type,
          createdBy: currentUser?.name || 'Sistema',
          ownerId: currentUser?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isTrashed: false
        };

        setItems(prev => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processAndAddFiles(files);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleMoveToTrash = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, isTrashed: true, updatedAt: new Date().toISOString() } : i));
  };

  const handleRestore = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, isTrashed: false, updatedAt: new Date().toISOString() } : i));
  };

  const handlePermanentDelete = (id: string) => {
    setConfirmConfig({
      title: 'Eliminar permanentemente',
      message: '¿Estás seguro? Esta acción no se puede deshacer.',
      action: () => {
        // Also delete children if folder
        const deleteRecursive = (itemId: string, currentItems: FileSystemItem[]): FileSystemItem[] => {
          const children = currentItems.filter(i => i.parentId === itemId);
          let remaining = currentItems.filter(i => i.id !== itemId);
          children.forEach(child => {
            remaining = deleteRecursive(child.id, remaining);
          });
          return remaining;
        };
        setItems(deleteRecursive(id, items));
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleEmptyTrash = () => {
    setConfirmConfig({
      title: 'Vaciar papelera',
      message: '¿Vaciar papelera? Se eliminarán permanentemente todos los elementos.',
      action: () => {
        setItems(items.filter(i => !i.isTrashed));
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleUpdateTextContent = (id: string, content: string) => {
    setItems(items.map(i => i.id === id ? { ...i, content, updatedAt: new Date().toISOString() } : i));
  };

  // --- Navigation Helpers ---

  const getBreadcrumbs = () => {
    const path = [];
    let currentId = currentFolderId;
    while (currentId) {
      const folder = items.find(i => i.id === currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  };

  const filteredItems = items.filter(item => {
    if (viewMode === 'trash') return item.isTrashed;

    const matchesParent = item.parentId === currentFolderId;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return !item.isTrashed && (searchQuery ? matchesSearch : matchesParent);
  });

  // --- Renderers ---

  const renderPreviewContent = () => {
    if (!previewItem) return null;

    const zoomStyle = { transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.2s' };

    switch (previewItem.type) {
      case 'image':
        return <img src={previewItem.blob} alt={previewItem.name} style={zoomStyle} className="max-w-full h-auto shadow-lg" />;

      case 'text':
        return (
          <div className="bg-white p-8 shadow-lg min-h-[500px] w-full max-w-3xl text-gray-800 whitespace-pre-wrap" style={zoomStyle}>
            {previewItem.content}
          </div>
        );

      case 'pdf':
        return (
          <iframe
            src={previewItem.blob}
            className="w-full h-[80vh] bg-white shadow-lg"
            title={previewItem.name}
            style={zoomStyle}
          />
        );

      case 'word':
        return (
          <div
            className="bg-white p-6 md:p-12 shadow-2xl min-h-[50vh] w-full max-w-4xl text-gray-900 prose prose-sm md:prose-lg prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 max-h-full overflow-auto mx-auto rounded-lg"
            style={zoomStyle}
            dangerouslySetInnerHTML={{ __html: previewHtml || '<div class="flex items-center justify-center h-full"><span class="text-gray-400">Cargando documento...</span></div>' }}
          />
        );

      case 'excel':
        return (
          <div
            className="bg-white shadow-2xl w-full max-w-full overflow-auto rounded-lg border border-gray-200"
            style={zoomStyle}
          >
            <style>{`
                #excel-preview-container table { border-collapse: collapse; width: 100%; font-family: 'Inter', system-ui, sans-serif; font-size: 13px; color: #1e293b; }
                #excel-preview-container td, #excel-preview-container th { border: 1px solid #e2e8f0; padding: 10px 14px; white-space: nowrap; }
                #excel-preview-container tr:nth-child(even){background-color: #f8fafc;}
                #excel-preview-container tr:hover {background-color: #f1f5f9; transition: background-color 0.1s;}
                #excel-preview-container th { 
                  padding-top: 12px; 
                  padding-bottom: 12px; 
                  text-align: left; 
                  background-color: #10b981; 
                  color: white; 
                  font-weight: 700;
                  position: sticky;
                  top: 0;
                  z-index: 10;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
              `}</style>
            <div id="excel-preview-container" dangerouslySetInnerHTML={{ __html: previewHtml || '<div class="p-8 text-gray-500 flex flex-col items-center"><RefreshCw class="w-8 h-8 animate-spin mb-2" /> Cargando hoja de cálculo...</div>' }} />
          </div>
        );

      case 'csv':
        try {
          const content = atob((previewItem.blob || '').split(',')[1]);
          const lines = content.split('\n').filter(l => l.trim());
          const rows = lines.map(row => {
            // Handle quotes in CSV
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < row.length; i++) {
              if (row[i] === '"') inQuotes = !inQuotes;
              else if (row[i] === ',' && !inQuotes) {
                result.push(current);
                current = '';
              } else current += row[i];
            }
            result.push(current);
            return result;
          });

          const headers = rows[0];
          const dataRows = rows.slice(1, 101); // Limit for preview performance

          // Smart Numeric Detection for Charts
          const numericColumns: number[] = [];
          headers.forEach((_, index) => {
            const sample = dataRows.slice(0, 5).map(r => r[index]);
            const isNumeric = sample.every(val => !isNaN(parseFloat(val?.trim())) && isFinite(Number(val?.trim())));
            if (isNumeric && sample.length > 0) numericColumns.push(index);
          });

          return (
            <div className="bg-white p-6 md:p-10 overflow-auto max-w-full shadow-2xl rounded-2xl border border-gray-100" style={zoomStyle}>
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-2xl">
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-2xl tracking-tight">Análisis de Datos CSV</h3>
                    <p className="text-sm text-gray-500 font-medium">Visualización profesional • {rows.length} registros</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Columnas</span>
                    <span className="text-lg font-bold text-gray-700">{headers.length}</span>
                  </div>
                  <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Numéricas</span>
                    <span className="text-lg font-bold text-emerald-600">{numericColumns.length}</span>
                  </div>
                </div>
              </div>

              {/* Automatic Bar Chart Section */}
              {numericColumns.length > 0 && rows.length > 1 && (
                <div className="mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart2 className="w-5 h-5 text-[#7b68ee]" />
                    <h4 className="font-bold text-gray-800">Visualización Automática de Tendencias</h4>
                  </div>

                  <div className="flex items-end gap-2 h-48 overflow-x-auto pb-6 scrollbar-hide">
                    {dataRows.slice(0, 20).map((row, i) => {
                      const value = parseFloat(row[numericColumns[0]] || '0');
                      const max = Math.max(...dataRows.slice(0, 20).map(r => parseFloat(r[numericColumns[0]] || '0'))) || 1;
                      const height = (value / max) * 100;
                      const label = row[0]?.toString().substring(0, 8);

                      return (
                        <div key={i} className="flex flex-col items-center flex-1 min-w-[30px] group">
                          <div className="relative w-full flex flex-col items-center">
                            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] py-0.5 px-2 rounded mb-1 transition-opacity z-10 whitespace-nowrap">
                              {value}
                            </div>
                            <div
                              className="w-full rounded-t-lg transition-all duration-500 ease-out group-hover:brightness-110"
                              style={{
                                height: `${Math.max(5, height)}%`,
                                backgroundColor: i % 2 === 0 ? '#7b68ee' : '#10b981',
                                boxShadow: '0 4px 12px rgba(123, 104, 238, 0.2)'
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 mt-2 font-bold rotate-45 origin-left truncate w-full">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-center text-gray-400 mt-6 font-medium italic">Gráfico generado automáticamente basado en la columna "{headers[numericColumns[0]]}"</p>
                </div>
              )}

              <div className="relative border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="min-w-full border-separate border-spacing-0 bg-white">
                    <thead className="bg-[#1e1e2d] sticky top-0 z-20">
                      <tr>
                        {headers.map((header, j) => (
                          <th key={j} className="px-6 py-4 text-left text-[11px] font-bold text-gray-300 uppercase letter-spacing-wider border-b border-gray-800 last:border-r-0">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dataRows.map((row, i) => (
                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                          {row.map((cell, j) => (
                            <td key={j} className={`px-6 py-3 text-sm text-gray-700 border-r border-gray-50 last:border-r-0 ${!isNaN(parseFloat(cell)) ? 'font-mono text-emerald-600 font-semibold' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {rows.length > 101 && (
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Mostrando las primeras 100 de {rows.length - 1} filas. Descargue el archivo para auditoría completa.
                </div>
              )}
            </div>
          );
        } catch (e) {
          return <div className="text-white p-8 bg-red-500/20 rounded-xl border border-red-500/50 flex flex-col items-center">
            <AlertCircle className="w-12 h-12 mb-4" />
            <span className="font-bold text-xl">Error de Procesamiento</span>
            <p className="mt-2 text-sm opacity-80 text-center">No pudimos interpretar la estructura del archivo CSV.</p>
          </div>;
        }

      case 'video':
        return (
          <div className="flex items-center justify-center bg-black rounded-lg overflow-hidden shadow-lg p-2" style={zoomStyle}>
            <video src={previewItem.blob} controls className="max-w-full max-h-[80vh]" />
          </div>
        );

      case 'audio':
        return (
          <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center gap-4 min-w-[300px]" style={zoomStyle}>
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <Music className="w-12 h-12 text-[#7b68ee]" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center">{previewItem.name}</h3>
            <audio src={previewItem.blob} controls className="w-full" />
          </div>
        );

      default:
        return (
          <div className="text-center text-white">
            <div className="bg-white/10 p-8 rounded-xl backdrop-blur-sm inline-block">
              {getIconForType(previewItem.type)}
              <h3 className="mt-4 text-xl font-bold">{previewItem.name}</h3>
              <p className="text-white/70 mt-2">Vista previa no disponible para este formato.</p>
              <a
                href={previewItem.blob}
                download={previewItem.name}
                className="mt-6 inline-flex items-center gap-2 bg-[#7b68ee] text-white px-4 py-2 rounded-lg hover:bg-[#6a5acd] transition-colors"
              >
                <Download className="w-4 h-4" /> Descargar
              </a>
            </div>
          </div>
        );
    }
  };

  // --- Text Editor Mode ---
  if (isEditingText) {
    const doc = items.find(i => i.id === isEditingText);
    if (!doc) {
      setIsEditingText(null);
      return null;
    }

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#1e1e2d]">
        <div className="h-14 border-b border-gray-200 dark:border-[#2a2b36] flex items-center justify-between px-4 bg-gray-50 dark:bg-[#16171f]">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsEditingText(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2b36] rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <input
              value={doc.name}
              onChange={(e) => setItems(items.map(i => i.id === doc.id ? { ...i, name: e.target.value } : i))}
              className="bg-transparent font-bold text-gray-700 dark:text-white focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <span className="text-xs text-gray-400 self-center">Guardado automático</span>
            <button onClick={() => setIsEditingText(null)} className="flex items-center gap-2 bg-[#7b68ee] text-white px-3 py-1.5 rounded-md text-sm">
              <Save className="w-4 h-4" /> Listo
            </button>
          </div>
        </div>
        <textarea
          value={doc.content || ''}
          onChange={(e) => handleUpdateTextContent(doc.id, e.target.value)}
          className="flex-1 p-8 resize-none focus:outline-none dark:bg-[#1e1e2d] dark:text-gray-200 text-lg leading-relaxed"
          placeholder="Escribe aquí..."
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-full bg-[#f9f9f9] dark:bg-[#16171f] relative animate-in fade-in duration-500"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#7b68ee]/10 backdrop-blur-sm border-4 border-dashed border-[#7b68ee] m-4 rounded-2xl flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-[#1e1e2d] p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce">
            <Upload className="w-16 h-16 text-[#7b68ee] mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Suelta los archivos aquí</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Se subirán automáticamente a esta carpeta</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-60 lg:w-64 xl:w-72 bg-white dark:bg-[#1e1e2d] border-r border-gray-200 dark:border-[#2a2b36] flex flex-col">
        <div className="p-4 xl:p-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-[#7b68ee] text-white py-2 px-4 rounded-lg hover:bg-[#6a5acd] transition-colors shadow-sm mb-4"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Archivo</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            multiple={false}
          />

          <div className="space-y-1">
            <button
              onClick={() => { setViewMode('files'); setCurrentFolderId(null); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${viewMode === 'files' ? 'bg-gray-100 dark:bg-[#2a2b36] text-[#7b68ee] font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2b36]'}`}
            >
              <Home className="w-4 h-4" /> Mis Documentos
            </button>
            <button
              onClick={() => { setViewMode('trash'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${viewMode === 'trash' ? 'bg-red-50 dark:bg-red-900/20 text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2b36]'}`}
            >
              <Trash2 className="w-4 h-4" /> Papelera
            </button>
          </div>
        </div>

        {/* Storage Info */}
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-[#2a2b36]">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <AlertCircle className="w-3 h-3" />
            <span>Almacenamiento Local</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#7b68ee] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((JSON.stringify(items).length / (5 * 1024 * 1024)) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-right">
            {(JSON.stringify(items).length / 1024 / 1024).toFixed(2)} MB usados
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-[#2a2b36] bg-white dark:bg-[#1e1e2d] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {viewMode === 'files' && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <button
                  onClick={() => setCurrentFolderId(null)}
                  className="hover:text-[#7b68ee] transition-colors flex items-center gap-1"
                >
                  <Home className="w-3.5 h-3.5" />
                </button>
                {getBreadcrumbs().map(folder => (
                  <React.Fragment key={folder.id}>
                    <span className="mx-2 text-gray-300">/</span>
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="hover:text-[#7b68ee] transition-colors"
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}
            {viewMode === 'trash' && <h2 className="text-lg font-bold text-gray-800 dark:text-white">Papelera de Reciclaje</h2>}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar archivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-48 md:w-64 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7b68ee] text-slate-700 dark:text-slate-200 shadow-sm"
              />
            </div>
            <div className="h-6 w-px bg-gray-200 dark:bg-[#2a2b36] mx-2" />
            {viewMode === 'files' ? (
              <>
                <button onClick={handleCreateFolder} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2b36] rounded-md text-gray-500" title="Nueva Carpeta">
                  <Folder className="w-5 h-5" />
                </button>
                <button onClick={handleCreateTextDoc} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2b36] rounded-md text-gray-500" title="Nuevo Documento">
                  <FileText className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button onClick={handleEmptyTrash} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-bold transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Vaciar Papelera
              </button>
            )}
            <div className="flex bg-gray-100 dark:bg-[#2a2b36] rounded-md p-1 ml-2">
              <button onClick={() => setLayout('grid')} className={`p-1 rounded ${layout === 'grid' ? 'bg-white dark:bg-[#16171f] shadow-sm text-[#7b68ee]' : 'text-gray-400'}`}>
                <Grid className="w-4 h-4" />
              </button>
              <button onClick={() => setLayout('list')} className={`p-1 rounded ${layout === 'list' ? 'bg-white dark:bg-[#16171f] shadow-sm text-[#7b68ee]' : 'text-gray-400'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 xl:p-10">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Folder className="w-16 h-16 mb-4 opacity-10" />
              <p>No hay elementos aquí</p>
              {viewMode === 'files' && !searchQuery && (
                <button onClick={handleCreateTextDoc} className="mt-4 text-[#7b68ee] hover:underline text-sm">
                  Crear un documento nuevo
                </button>
              )}
            </div>
          ) : (
            <div className={layout === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 xl:gap-6 pb-20" : "flex flex-col gap-2 pb-20"}>
              {filteredItems.map((item, index) => {
                const colors = getFileColors(item.type);
                return (
                  <div
                    key={item.id}
                    onDoubleClick={() => {
                      if (item.type === 'folder') setCurrentFolderId(item.id);
                      else if (item.type === 'text') setIsEditingText(item.id);
                      else setPreviewItem(item);
                    }}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={`group relative ${colors.bg} border ${colors.border} rounded-xl transition-all cursor-pointer animate-in fade-in-up duration-500 fill-mode-backwards ${layout === 'grid'
                      ? 'p-4 flex flex-col items-center text-center aspect-square justify-between hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]'
                      : 'p-3 flex items-center gap-4 hover:shadow-md hover:translate-x-1'
                      }`}
                  >
                    {/* Icon Area */}
                    <div className={layout === 'grid' ? "flex-1 flex items-center justify-center w-full" : ""}>
                      {getIconForType(item.type)}
                    </div>

                    {/* Info Area */}
                    <div className={layout === 'grid' ? "w-full mt-3" : "flex-1 min-w-0"}>
                      <p className={`text-sm font-bold truncate w-full ${colors.text}`} title={item.name}>
                        {item.name}
                      </p>
                      <div className={`flex ${layout === 'grid' ? 'justify-center' : 'justify-start'} items-center gap-2 mt-1 text-[10px] opacity-70 ${colors.text}`}>
                        <span>{format(new Date(item.updatedAt), 'd MMM yyyy', { locale: es })}</span>
                        {item.size && <span>• {formatSize(item.size)}</span>}
                        {item.createdBy && <span>• {item.createdBy}</span>}
                      </div>
                    </div>

                    {/* Actions Overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {viewMode === 'trash' ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(item.id); }}
                            className="p-1.5 bg-green-100 text-green-600 rounded-md hover:bg-green-200"
                            title="Restaurar"
                          >
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePermanentDelete(item.id); }}
                            className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMoveToTrash(item.id); }}
                          className="p-1.5 bg-white/50 hover:bg-white text-red-500 rounded-md shadow-sm backdrop-blur-sm"
                          title="Mover a papelera"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={createModalType === 'folder' ? 'Nueva Carpeta' : 'Nuevo Documento'}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-[#7b68ee] hover:bg-[#6a5acd] rounded-lg shadow-lg shadow-[#7b68ee]/20 transition-all active:scale-95"
            >
              Crear
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent outline-none transition-all"
              autoFocus
            />
          </div>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={confirmConfig?.title || 'Confirmar'}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmConfig?.action}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              Eliminar
            </button>
          </>
        }
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            {confirmConfig?.message}
          </p>
        </div>
      </Modal>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 lg:p-8 xl:p-12">
          <div className="relative w-full h-full max-w-6xl xl:max-w-7xl flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between text-white mb-4">
              <div className="flex items-center gap-3">
                {getIconForType(previewItem.type)}
                <div>
                  <h3 className="font-bold text-lg">{previewItem.name}</h3>
                  <p className="text-xs opacity-70">{formatSize(previewItem.size)} • {format(new Date(previewItem.createdAt), 'PP pp', { locale: es })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="p-2 hover:bg-white/10 rounded-md">
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="p-2 hover:bg-white/10 rounded-md">
                  <ZoomIn className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button onClick={() => { setPreviewItem(null); setZoomLevel(1); }} className="p-2 hover:bg-red-500/80 rounded-md">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center rounded-xl bg-[#1e1e2d]/50 border border-white/10 p-4 relative" onClick={(e) => e.target === e.currentTarget && setPreviewItem(null)}>
              {renderPreviewContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Docs;
