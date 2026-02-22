import React, { useState } from 'react';
import { Bell, Check, Filter, Search, Inbox as InboxIcon, MessageSquare, AtSign } from 'lucide-react';

export interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'alert' | 'warning';
}

interface InboxProps {
  notifications?: Notification[];
  onMarkAsRead?: () => void;
}

const Inbox: React.FC<InboxProps> = ({ notifications = [], onMarkAsRead }) => {
  const [activeTab, setActiveTab] = useState<'important' | 'other'>('important');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter logic (simulated)
  // In a real app, 'Important' would be mentions/assignments. 'Other' would be status updates.
  // For now, we'll split arbitrarily or put everything in Important if small.
  const filteredNotifications = notifications.filter(n => 
    n.text.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const importantNotifications = filteredNotifications;
  const otherNotifications = [];

  return (
    <div className="flex h-full">
      {/* Sidebar List */}
      <div className="w-80 border-r border-gray-200 dark:border-[#2a2b36] flex flex-col bg-white dark:bg-[#1e1e2d]">
        <div className="p-4 border-b border-gray-200 dark:border-[#2a2b36]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg dark:text-white">Inbox</h2>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2b36] rounded text-gray-500">
                <Filter className="w-4 h-4" />
              </button>
              <button 
                onClick={onMarkAsRead}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2b36] rounded text-gray-500" 
                title="Marcar todo como leído"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar notificaciones..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7b68ee] text-slate-700 dark:text-slate-200"
            />
          </div>
          
          <div className="flex gap-1 bg-gray-100 dark:bg-[#2a2b36] p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('important')}
              className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${
                activeTab === 'important' 
                  ? 'bg-white dark:bg-[#16171f] text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Importante
            </button>
            <button 
              onClick={() => setActiveTab('other')}
              className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${
                activeTab === 'other' 
                  ? 'bg-white dark:bg-[#16171f] text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Otros
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {importantNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <InboxIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Todo está limpio</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#2a2b36]">
              {importantNotifications.map(notification => (
                <div key={notification.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-[#2a2b36]/50 cursor-pointer group ${!notification.read ? 'bg-[#7b68ee]/5' : ''}`}>
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {notification.type === 'alert' ? (
                        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {notification.text}
                        </p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{notification.time}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                         <span className="text-xs text-gray-400">Hace un momento</span>
                         <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-[#2a2b36] rounded-full transition-all">
                            <Check className="w-3 h-3 text-gray-500" />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail View (Placeholder) */}
      <div className="flex-1 bg-[#f9f9f9] dark:bg-[#16171f] flex items-center justify-center text-gray-400">
        <div className="text-center">
           <InboxIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
           <p>Selecciona una notificación para ver los detalles</p>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
