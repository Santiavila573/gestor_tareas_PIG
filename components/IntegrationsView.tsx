import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  MessageSquare, 
  Trello, 
  Layout, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Settings,
  Loader2,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  status: 'connected' | 'disconnected';
  lastSync?: string;
  url: string;
}

const IntegrationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Sincroniza tus tareas y reportes automáticamente con hojas de cálculo.',
      icon: FileSpreadsheet,
      color: 'bg-green-500',
      status: 'disconnected',
      url: 'https://sheets.google.com'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Recibe notificaciones de actualizaciones y comentarios en tus canales.',
      icon: MessageSquare,
      color: 'bg-purple-500',
      status: 'disconnected',
      url: 'https://slack.com'
    },
    {
      id: 'jira',
      name: 'Jira Software',
      description: 'Importa y exporta incidencias para mantener sincronizados los equipos.',
      icon: Layout,
      color: 'bg-blue-500',
      status: 'disconnected',
      url: 'https://www.atlassian.com/software/jira'
    },
    {
      id: 'trello',
      name: 'Trello',
      description: 'Vincula tableros y tarjetas para visualizar el flujo de trabajo.',
      icon: Trello,
      color: 'bg-blue-400',
      status: 'disconnected',
      url: 'https://trello.com'
    }
  ]);

  const [loadingState, setLoadingState] = useState<{id: string, step: number, message: string} | null>(null);

  const handleToggleConnection = (integration: Integration) => {
    if (integration.status === 'connected') {
      // Desconectar
      if (confirm(`¿Estás seguro de que deseas desconectar ${integration.name}?`)) {
        setIntegrations(prev => prev.map(i => i.id === integration.id ? {
          ...i,
          status: 'disconnected',
          lastSync: undefined
        } : i));
      }
      return;
    }

    // Conectar - Iniciar Simulación
    window.open(integration.url, '_blank');
    
    setLoadingState({
      id: integration.id,
      step: 1,
      message: `Conectando con ${integration.name}...`
    });

    // Secuencia de simulación
    setTimeout(() => {
      setLoadingState({
        id: integration.id,
        step: 2,
        message: 'Autenticando y verificando permisos...'
      });
    }, 2000);

    setTimeout(() => {
      setLoadingState({
        id: integration.id,
        step: 3,
        message: 'Importando datos de proyectos y tareas...'
      });
    }, 4500);

    setTimeout(() => {
      setLoadingState({
        id: integration.id,
        step: 4,
        message: 'Sincronizando configuraciones...'
      });
    }, 7000);

    setTimeout(() => {
      setIntegrations(prev => prev.map(i => i.id === integration.id ? {
        ...i,
        status: 'connected',
        lastSync: new Date().toLocaleString()
      } : i));
      setLoadingState(null);
    }, 9000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#1e1e2d] overflow-hidden relative">
      {/* Header */}
      <div className="flex-none p-4 md:p-6 bg-white dark:bg-[#1e1e2d] border-b border-gray-200 dark:border-[#2a2b36] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Settings className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            Integraciones
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Conecta tus herramientas favoritas para potenciar tu flujo de trabajo
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div 
              key={integration.id} 
              className="bg-white dark:bg-[#2a2b36] rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group"
            >
              <div className={`h-2 w-full ${integration.color} opacity-80`} />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${integration.color} bg-opacity-10 dark:bg-opacity-20`}>
                    <integration.icon className={`w-8 h-8 ${integration.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    integration.status === 'connected' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {integration.status === 'connected' ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Desconectado
                      </>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {integration.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex-1">
                  {integration.description}
                </p>

                {integration.status === 'connected' && integration.lastSync && (
                  <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Sincronizado: {integration.lastSync}
                  </p>
                )}

                <button
                  onClick={() => handleToggleConnection(integration)}
                  disabled={loadingState !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    loadingState?.id === integration.id 
                      ? 'bg-gray-100 text-gray-400 cursor-wait'
                      : integration.status === 'connected'
                        ? 'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95'
                  }`}
                >
                  {loadingState?.id === integration.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : integration.status === 'connected' ? (
                    'Desconectar'
                  ) : (
                    'Conectar'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="max-w-7xl mx-auto mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl flex items-start gap-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
            <ExternalLink className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">¿Necesitas más integraciones?</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Estamos trabajando continuamente para añadir más herramientas a nuestra plataforma. 
              Si necesitas una integración específica, por favor contacta con el soporte técnico o revisa nuestra documentación de API.
            </p>
          </div>
        </div>
      </div>

      {/* Loading Modal Overlay */}
      {loadingState && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#2a2b36] rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 relative">
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin"></div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Conectando Servicio
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Por favor espera mientras establecemos la conexión segura
            </p>

            <div className="w-full space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500 ${
                  loadingState.step > 1 ? 'bg-green-100 text-green-600' : loadingState.step === 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {loadingState.step > 1 ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">1</span>}
                </div>
                <span className={`${loadingState.step >= 1 ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                  Iniciando conexión
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500 ${
                  loadingState.step > 2 ? 'bg-green-100 text-green-600' : loadingState.step === 2 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {loadingState.step > 2 ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">2</span>}
                </div>
                <span className={`${loadingState.step >= 2 ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                  Autenticación
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500 ${
                  loadingState.step > 3 ? 'bg-green-100 text-green-600' : loadingState.step === 3 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {loadingState.step > 3 ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">3</span>}
                </div>
                <span className={`${loadingState.step >= 3 ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                  Importación de datos
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500 ${
                  loadingState.step > 4 ? 'bg-green-100 text-green-600' : loadingState.step === 4 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {loadingState.step > 4 ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">4</span>}
                </div>
                <span className={`${loadingState.step >= 4 ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                  Finalizando
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-8 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${loadingState.step * 25}%` }}
              ></div>
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium animate-pulse">
              {loadingState.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsView;