import React, { useState, useEffect } from 'react';
import { Video, Plus, Play, MoreHorizontal, Share2, Download } from 'lucide-react';

interface Clip {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  createdAt: string;
  views: number;
}

const MOCK_CLIPS: Clip[] = [
  {
    id: '1',
    title: 'Demo de nueva funcionalidad',
    duration: '02:15',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80',
    createdAt: 'Hace 2 horas',
    views: 12
  },
  {
    id: '2',
    title: 'Bug Report #452',
    duration: '00:45',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&q=80',
    createdAt: 'Ayer',
    views: 5
  }
];

const Clips: React.FC = () => {
  const [clips, setClips] = useState<Clip[]>(() => {
    const saved = localStorage.getItem('pig_clips');
    return saved ? JSON.parse(saved) : MOCK_CLIPS;
  });

  useEffect(() => {
    localStorage.setItem('pig_clips', JSON.stringify(clips));
  }, [clips]);

  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording start
    setTimeout(() => {
        setIsRecording(false);
        const newClip: Clip = {
            id: Date.now().toString(),
            title: `Grabación de pantalla ${clips.length + 1}`,
            duration: '00:10',
            thumbnail: 'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=400&q=80',
            createdAt: 'Ahora mismo',
            views: 0
        };
        setClips([newClip, ...clips]);
    }, 2000); // Fake 2 sec recording
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clips</h1>
           <p className="text-gray-500">Graba y comparte videos de tu pantalla.</p>
        </div>
        <button 
          onClick={handleStartRecording}
          disabled={isRecording}
          className={`bg-[#f01d4f] hover:bg-[#d01944] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${isRecording ? 'animate-pulse' : ''}`}
        >
          {isRecording ? (
            <>
              <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              Grabando...
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-white rounded-full border-2 border-[#f01d4f]" />
              Nuevo Clip
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {clips.map(clip => (
            <div key={clip.id} className="group bg-white dark:bg-[#1e1e2d] rounded-xl overflow-hidden border border-gray-200 dark:border-[#2a2b36] hover:shadow-lg transition-shadow cursor-pointer">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-900">
                    <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-current" />
                        </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                        {clip.duration}
                    </div>
                </div>

                {/* Info */}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2">{clip.title}</h3>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{clip.views} vistas • {clip.createdAt}</span>
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-4 flex gap-2 border-t border-gray-100 dark:border-[#2a2b36] pt-3">
                        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2b36] py-1.5 rounded transition-colors">
                            <Share2 className="w-3.5 h-3.5" />
                            Compartir
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2a2b36] py-1.5 rounded transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            Descargar
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Clips;
