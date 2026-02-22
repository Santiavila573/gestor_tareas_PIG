import React from 'react';

const More: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Más Herramientas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-[#1e1e2d] border-gray-200 dark:border-gray-700">
           <h3 className="font-bold mb-2">Configuración Avanzada</h3>
           <p className="text-sm text-gray-500">Gestión de roles y permisos.</p>
        </div>
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-[#1e1e2d] border-gray-200 dark:border-gray-700">
           <h3 className="font-bold mb-2">Integraciones</h3>
           <p className="text-sm text-gray-500">Conectar con Slack, GitHub, etc.</p>
        </div>
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-[#1e1e2d] border-gray-200 dark:border-gray-700">
           <h3 className="font-bold mb-2">Papelera</h3>
           <p className="text-sm text-gray-500">Elementos eliminados recientemente.</p>
        </div>
      </div>
    </div>
  );
};

export default More;
