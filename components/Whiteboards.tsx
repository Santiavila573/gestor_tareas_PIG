import React, { useState, useEffect } from 'react';
import { MousePointer2, Type, Square, StickyNote, Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react';

interface WhiteboardElement {
  id: string;
  type: 'note' | 'shape' | 'text';
  x: number;
  y: number;
  content?: string;
  color?: string;
}

const Whiteboards: React.FC = () => {
  const [elements, setElements] = useState<WhiteboardElement[]>(() => {
    const saved = localStorage.getItem('pig_whiteboard_elements');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTool, setSelectedTool] = useState<'cursor' | 'note' | 'shape' | 'text'>('cursor');

  useEffect(() => {
    localStorage.setItem('pig_whiteboard_elements', JSON.stringify(elements));
  }, [elements]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (selectedTool === 'cursor') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement: WhiteboardElement = {
      id: Date.now().toString(),
      type: selectedTool,
      x,
      y,
      content: selectedTool === 'note' ? 'Nueva Nota' : (selectedTool === 'text' ? 'Texto' : ''),
      color: selectedTool === 'note' ? '#fff9c4' : (selectedTool === 'text' ? 'transparent' : '#e0e0e0')
    };

    setElements([...elements, newElement]);
    setSelectedTool('cursor'); // Reset tool
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f5f7] dark:bg-[#1e1e2d] relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-[#2a2b36] rounded-lg shadow-lg p-1.5 flex gap-2 z-10 border border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setSelectedTool('cursor')}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-[#16171f] ${selectedTool === 'cursor' ? 'bg-[#7b68ee]/10 text-[#7b68ee]' : 'text-gray-500'}`}
        >
          <MousePointer2 className="w-5 h-5" />
        </button>
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <button 
          onClick={() => setSelectedTool('note')}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-[#16171f] ${selectedTool === 'note' ? 'bg-[#7b68ee]/10 text-[#7b68ee]' : 'text-gray-500'}`}
        >
          <StickyNote className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setSelectedTool('shape')}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-[#16171f] ${selectedTool === 'shape' ? 'bg-[#7b68ee]/10 text-[#7b68ee]' : 'text-gray-500'}`}
        >
          <Square className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setSelectedTool('text')}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-[#16171f] ${selectedTool === 'text' ? 'bg-[#7b68ee]/10 text-[#7b68ee]' : 'text-gray-500'}`}
        >
          <Type className="w-5 h-5" />
        </button>
        <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-[#16171f] text-gray-500">
          <Undo className="w-5 h-5" />
        </button>
        <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-[#16171f] text-gray-500">
          <Redo className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas */}
      <div 
        className="flex-1 cursor-crosshair relative" 
        onClick={handleCanvasClick}
        style={{
            backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}
      >
        {elements.map(el => (
          <div
            key={el.id}
            className={`absolute ${el.type !== 'text' ? 'shadow-md' : ''} rounded flex items-center justify-center p-2 text-sm text-gray-800`}
            style={{
              left: el.x,
              top: el.y,
              backgroundColor: el.color,
              width: el.type === 'note' ? 120 : (el.type === 'text' ? 150 : 80),
              height: el.type === 'note' ? 120 : (el.type === 'text' ? 40 : 80),
              transform: 'translate(-50%, -50%)',
              border: el.type === 'shape' ? '2px solid #999' : 'none'
            }}
          >
            {el.type === 'note' || el.type === 'text' ? (
                <textarea 
                    className={`w-full h-full bg-transparent border-none resize-none focus:outline-none ${el.type === 'text' ? 'text-left overflow-hidden' : 'text-center'}`}
                    defaultValue={el.content}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : null}
          </div>
        ))}

        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <p className="mb-2">Haz clic en una herramienta y luego en el lienzo</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <div className="bg-white dark:bg-[#2a2b36] rounded-lg shadow-lg p-1 flex items-center border border-gray-200 dark:border-gray-700">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#16171f] rounded text-gray-500">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono w-12 text-center text-gray-600 dark:text-gray-300">100%</span>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#16171f] rounded text-gray-500">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Whiteboards;
