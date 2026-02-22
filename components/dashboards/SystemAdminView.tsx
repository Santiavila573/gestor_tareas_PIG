import React, { useState } from 'react';
import {
    Activity, Shield, FileText, Settings,
    Search, Filter, Download, Plus, CheckCircle, Clock,
    MoreVertical, RefreshCw, Server, Database, Lock,
    AlertTriangle, AlertOctagon, XCircle, Trash2, Edit2, Key, X, Save,
    LayoutDashboard, Users, History, Menu, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Zap
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { User, IncidentSeverity, IncidentStatus, Incident } from '../../types';
import {
    MOCK_USERS, MOCK_INCIDENTS, MOCK_SYSTEM_METRICS, MOCK_AUDIT_LOGS,
    MOCK_COMPLIANCE_AUDITS, MOCK_ARCO_REQUESTS, MOCK_ADMIN_KPIS
} from '../../constants';

// Define the valid tab types that can be passed from App.tsx
export type AdminTab = 'overview' | 'users' | 'incidents' | 'monitoring' | 'compliance' | 'logs' | 'history';

interface Props {
    currentUser: User;
    users: User[];
    onAddUser: (user: Omit<User, 'id'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
}

const SystemAdminView: React.FC<Props> = ({ currentUser, users, onAddUser, onUpdateUser, onDeleteUser }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    
    // User Management State
    // const [users, setUsers] = useState<User[]>(MOCK_USERS); // Replaced by props
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({});
    const [showPasswordResetToast, setShowPasswordResetToast] = useState<string | null>(null);
    
    // Filters & Pagination
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
    const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Incident State & Filters
    const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
    const [incidentFilter, setIncidentFilter] = useState<'all' | 'open' | 'resolved'>('all');
    const [incidentPage, setIncidentPage] = useState(1);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [incidentFormData, setIncidentFormData] = useState<Partial<Incident>>({});
    const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);

    // UI States
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'delete_user' | 'delete_incident', id: string } | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanComplete, setScanComplete] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleReportIncident = () => {
        setEditingIncidentId(null);
        setIncidentFormData({
            status: IncidentStatus.OPEN,
            severity: IncidentSeverity.MEDIUM,
            createdAt: new Date().toISOString()
        });
        setIsIncidentModalOpen(true);
    };

    const handleEditIncident = (incident: Incident) => {
        setEditingIncidentId(incident.id);
        setIncidentFormData(incident);
        setIsIncidentModalOpen(true);
    };

    const handleSaveIncident = () => {
        if (!incidentFormData.title) return;
        
        if (editingIncidentId) {
            setIncidents(incidents.map(inc => inc.id === editingIncidentId ? { ...inc, ...incidentFormData } as Incident : inc));
        } else {
            const newIncident: Incident = {
                id: `inc-${Date.now()}`,
                title: incidentFormData.title!,
                description: incidentFormData.description || '',
                status: incidentFormData.status as IncidentStatus || IncidentStatus.OPEN,
                severity: incidentFormData.severity as IncidentSeverity || IncidentSeverity.MEDIUM,
                assignedTo: currentUser.id, 
                createdAt: new Date().toISOString()
            };
            setIncidents([newIncident, ...incidents]);
        }
        
        setIsIncidentModalOpen(false);
        setActiveTab('incidents');
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setFormData({
            status: 'active',
            role: 'Developer',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces'
        });
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setFormData(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = (userId: string) => {
        setConfirmAction({ type: 'delete_user', id: userId });
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (!confirmAction) return;

        if (confirmAction.type === 'delete_user') {
            onDeleteUser(confirmAction.id);
        } else if (confirmAction.type === 'delete_incident') {
            setIncidents(incidents.filter(inc => inc.id !== confirmAction.id));
        }
        
        setIsConfirmModalOpen(false);
        setConfirmAction(null);
    };

    const handleDeleteIncident = (incidentId: string) => {
        setConfirmAction({ type: 'delete_incident', id: incidentId });
        setIsConfirmModalOpen(true);
    };

    const handleSecurityScan = () => {
        setIsScanning(true);
        setScanComplete(false);
        // Simulate scan process
        setTimeout(() => {
            setIsScanning(false);
            setScanComplete(true);
            setTimeout(() => setScanComplete(false), 3000);
        }, 2000);
    };

    const handleResetPassword = (userId: string) => {
        setShowPasswordResetToast(userId);
        setTimeout(() => setShowPasswordResetToast(null), 3000);
    };

    const handleSaveUser = () => {
        if (!formData.name || !formData.email) return;

        if (editingUser) {
            onUpdateUser({ ...editingUser, ...formData } as User);
        } else {
            onAddUser({
                ...formData,
                status: formData.status as any || 'active',
                avatar: formData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces',
            } as Omit<User, 'id'>);
        }
        setIsUserModalOpen(false);
    };

    // Transform data for charts
    const metricsData = MOCK_SYSTEM_METRICS.map(m => ({
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cpu: m.cpuUsage,
        memory: m.memoryUsage,
        requests: m.requestsPerMinute
    }));

    const renderOverview = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2b36] transition-all hover:shadow-lg hover:border-[#7b68ee]/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiempo de Actividad</p>
                            <h3 className="text-3xl font-heading font-black text-gray-800 dark:text-white mt-1">{MOCK_ADMIN_KPIS.systemUptime}%</h3>
                        </div>
                        <div className="p-2 bg-[#10b981]/10 dark:bg-[#10b981]/20 rounded-lg text-[#10b981]">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-[#10b981]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        <span>Todos los sistemas operativos</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2b36] transition-all hover:shadow-lg hover:border-[#7b68ee]/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incidentes Activos</p>
                            <h3 className="text-3xl font-heading font-black text-gray-800 dark:text-white mt-1">{MOCK_ADMIN_KPIS.activeIncidents}</h3>
                        </div>
                        <div className="p-2 bg-[#f59e0b]/10 dark:bg-[#f59e0b]/20 rounded-lg text-[#f59e0b]">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-[#f59e0b]">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Resolución promedio: {MOCK_ADMIN_KPIS.incidentMTTR}m</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2b36] transition-all hover:shadow-lg hover:border-[#7b68ee]/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alertas de Seguridad</p>
                            <h3 className="text-3xl font-heading font-black text-gray-800 dark:text-white mt-1">{MOCK_ADMIN_KPIS.securityAlertsToday}</h3>
                        </div>
                        <div className="p-2 bg-[#3b82f6]/10 dark:bg-[#3b82f6]/20 rounded-lg text-[#3b82f6]">
                            <Shield className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-gray-500">
                        <span>Último escaneo: hace 10m</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2b36] transition-all hover:shadow-lg hover:border-[#7b68ee]/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Puntaje de Cumplimiento</p>
                            <h3 className="text-3xl font-heading font-black text-gray-800 dark:text-white mt-1">{MOCK_ADMIN_KPIS.complianceScore}%</h3>
                        </div>
                        <div className="p-2 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 rounded-lg text-[#7b68ee]">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                        <div className="bg-[#7b68ee] h-1.5 rounded-full" style={{ width: `${MOCK_ADMIN_KPIS.complianceScore}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#1e1e2d] p-4 md:p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-[#2a2b36]">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-[#f59e0b]" />
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Acciones Rápidas</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6">
                    <button 
                        onClick={handleAddUser}
                        className="p-4 bg-gray-50 dark:bg-[#2a2b36] rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#7b68ee] dark:hover:border-[#7b68ee] hover:shadow-md transition-all group text-left"
                    >
                        <div className="p-2 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 rounded-lg text-[#7b68ee] w-fit mb-3 group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                        </div>
                        <h4 className="font-medium text-gray-800 dark:text-white">Agregar Usuario</h4>
                        <p className="text-xs text-gray-500 mt-1">Crear nueva cuenta</p>
                    </button>

                    <button 
                        onClick={handleReportIncident}
                        className="p-4 bg-gray-50 dark:bg-[#2a2b36] rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:shadow-md transition-all group text-left"
                    >
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 w-fit mb-3 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h4 className="font-medium text-gray-800 dark:text-white">Reportar Incidente</h4>
                        <p className="text-xs text-gray-500 mt-1">Registrar problema</p>
                    </button>

                    <button 
                        onClick={() => setActiveTab('logs')}
                        className="p-4 bg-gray-50 dark:bg-[#2a2b36] rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#3b82f6] dark:hover:border-[#3b82f6] hover:shadow-md transition-all group text-left"
                    >
                        <div className="p-2 bg-[#3b82f6]/10 dark:bg-[#3b82f6]/20 rounded-lg text-[#3b82f6] w-fit mb-3 group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h4 className="font-medium text-gray-800 dark:text-white">Ver Logs</h4>
                        <p className="text-xs text-gray-500 mt-1">Auditoría del sistema</p>
                    </button>

                    <button 
                        onClick={handleSecurityScan}
                        disabled={isScanning}
                        className="p-4 bg-gray-50 dark:bg-[#2a2b36] rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#10b981] dark:hover:border-[#10b981] hover:shadow-md transition-all group text-left relative overflow-hidden"
                    >
                        {isScanning && (
                            <div className="absolute inset-0 bg-[#10b981]/5 dark:bg-[#10b981]/10 z-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10b981]/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                            </div>
                        )}
                        <div className="relative z-10">
                            <div className="p-2 bg-[#10b981]/10 dark:bg-[#10b981]/20 rounded-lg text-[#10b981] w-fit mb-3 group-hover:scale-110 transition-transform">
                                {isScanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                            </div>
                            <h4 className="font-medium text-gray-800 dark:text-white">
                                {isScanning ? 'Escaneando...' : 'Escaneo de Seguridad'}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                {isScanning ? 'Analizando vulnerabilidades' : 'Iniciar análisis'}
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36]">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Carga del Sistema (24h)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metricsData}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7b68ee" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#7b68ee" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e1e2d', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="cpu" stroke="#7b68ee" fillOpacity={1} fill="url(#colorCpu)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e1e2d] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36]">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Incidentes Recientes</h3>
                    <div className="space-y-4">
                        {MOCK_INCIDENTS.slice(0, 3).map(incident => (
                            <div key={incident.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#2a2b36] rounded-lg border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${incident.severity === IncidentSeverity.CRITICAL ? 'bg-red-100 text-red-600' :
                                        incident.severity === IncidentSeverity.HIGH ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-800 dark:text-white">{incident.title}</h4>
                                        <p className="text-xs text-gray-500">{incident.id} • {new Date(incident.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${incident.status === IncidentStatus.OPEN ? 'bg-red-100 text-red-700' :
                                    incident.status === IncidentStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                    }`}>
                                    {incident.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => {
        // Filter Logic
        const filteredUsers = users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                                  user.email.toLowerCase().includes(userSearch.toLowerCase());
            const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
            const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });

        // Pagination Logic
        const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

        return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={userSearch}
                            onChange={(e) => { setUserSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1e1e2d] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7b68ee] text-slate-700 dark:text-slate-200 shadow-sm transition-shadow"
                        />
                    </div>
                    <select
                        value={userRoleFilter}
                        onChange={(e) => { setUserRoleFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#7b68ee] outline-none"
                    >
                        <option value="all">Todos los Roles</option>
                        <option value="Admin">Admin</option>
                        <option value="ScrumMaster">Scrum Master</option>
                        <option value="ProductOwner">Product Owner</option>
                        <option value="Developer">Desarrollador</option>
                        <option value="Stakeholder">Stakeholder</option>
                    </select>
                    <select
                        value={userStatusFilter}
                        onChange={(e) => { setUserStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#7b68ee] outline-none"
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="active">Activo</option>
                        <option value="suspended">Suspendido</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                </div>
                <button 
                    onClick={handleAddUser}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#7b68ee] text-white rounded-lg text-sm font-medium hover:bg-[#6b58de] transition-colors shadow-lg shadow-[#7b68ee]/20"
                >
                    <Plus className="w-4 h-4" />
                    Agregar Usuario
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left min-w-[800px]">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Último Acceso</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {currentUsers.length > 0 ? (
                                currentUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 flex items-center justify-center text-[#7b68ee] dark:text-[#7b68ee] font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 dark:text-white">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                            {user.status === 'active' ? 'Activo' : 'Suspendido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleResetPassword(user.id)}
                                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                                title="Restablecer Credenciales"
                                            >
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleEditUser(user)}
                                                className="p-2 text-slate-400 hover:text-[#7b68ee] hover:bg-[#7b68ee]/10 dark:hover:bg-[#7b68ee]/20 rounded-lg transition-colors"
                                                title="Editar Usuario"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar Usuario"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No se encontraron usuarios que coincidan con los filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-sm text-slate-500">
                            Mostrando <span className="font-medium text-slate-900 dark:text-white">{startIndex + 1}</span> a <span className="font-medium text-slate-900 dark:text-white">{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> de <span className="font-medium text-slate-900 dark:text-white">{filteredUsers.length}</span> usuarios
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 px-2">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Reset Toast */}
            {showPasswordResetToast && (
                <div className="absolute bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                        <p className="font-medium text-sm">Credenciales Enviadas</p>
                        <p className="text-xs text-slate-400">Correo de recuperación enviado al usuario</p>
                    </div>
                </div>
            )}

            {/* User Modal moved to global scope */}
        </div>
    );
    };

    const renderIncidents = () => {
        const filteredIncidents = incidents.filter(incident => {
            if (incidentFilter === 'all') return true;
            if (incidentFilter === 'open') return incident.status === IncidentStatus.OPEN || incident.status === IncidentStatus.IN_PROGRESS;
            if (incidentFilter === 'resolved') return incident.status === IncidentStatus.RESOLVED || incident.status === IncidentStatus.CLOSED;
            return true;
        });

        // Pagination Logic
        const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
        const startIndex = (incidentPage - 1) * itemsPerPage;
        const currentIncidents = filteredIncidents.slice(startIndex, startIndex + itemsPerPage);

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => { setIncidentFilter('all'); setIncidentPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                incidentFilter === 'all' 
                                ? 'bg-[#7b68ee] text-white shadow-md' 
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => { setIncidentFilter('open'); setIncidentPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                incidentFilter === 'open' 
                                ? 'bg-[#7b68ee] text-white shadow-md' 
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            Activos
                        </button>
                        <button 
                            onClick={() => { setIncidentFilter('resolved'); setIncidentPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                incidentFilter === 'resolved' 
                                ? 'bg-[#7b68ee] text-white shadow-md' 
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            Resueltos
                        </button>
                    </div>
                    <button 
                        onClick={handleReportIncident}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Reportar Incidente
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left min-w-[800px]">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Título</th>
                                <th className="px-6 py-4">Severidad</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Asignado A</th>
                                <th className="px-6 py-4">Creado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {currentIncidents.length > 0 ? (
                                currentIncidents.map(incident => (
                                <tr key={incident.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        {incident.id}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                        {incident.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${incident.severity === IncidentSeverity.CRITICAL ? 'bg-red-100 text-red-700' :
                                            incident.severity === IncidentSeverity.HIGH ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {incident.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${incident.status === IncidentStatus.OPEN ? 'bg-red-50 text-red-700 border border-red-200' :
                                            incident.status === IncidentStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                'bg-green-50 text-green-700 border border-green-200'
                                            }`}>
                                            {incident.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {MOCK_USERS.find(u => u.id === incident.assignedTo)?.name || 'Sin Asignar'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(incident.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEditIncident(incident)}
                                                className="p-2 text-slate-400 hover:text-[#7b68ee] hover:bg-[#7b68ee]/10 dark:hover:bg-[#7b68ee]/20 rounded-lg transition-colors"
                                                title="Ver Detalles"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteIncident(incident.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Eliminar Incidente"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No se encontraron incidentes con los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredIncidents.length)} de {filteredIncidents.length} incidentes
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIncidentPage(prev => Math.max(prev - 1, 1))}
                                disabled={incidentPage === 1}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Página {incidentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setIncidentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={incidentPage === totalPages}
                                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>
                )}
                </div>
            </div>
        );
    };

    const renderMonitoring = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 rounded-lg text-[#7b68ee]">
                            <Server className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Uso de CPU</h3>
                    </div>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metricsData}>
                                <Line type="monotone" dataKey="cpu" stroke="#7b68ee" strokeWidth={2} dot={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">
                            {metricsData[metricsData.length - 1]?.cpu}%
                        </span>
                        <span className="text-xs text-slate-500 ml-2">Carga Actual</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600">
                            <Database className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Uso de Memoria</h3>
                    </div>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metricsData}>
                                <Line type="monotone" dataKey="memory" stroke="#ec4899" strokeWidth={2} dot={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">
                            {metricsData[metricsData.length - 1]?.memory}%
                        </span>
                        <span className="text-xs text-slate-500 ml-2">Uso Actual</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Peticiones/min</h3>
                    </div>
                    <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metricsData}>
                                <Bar dataKey="requests" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">
                            {metricsData[metricsData.length - 1]?.requests}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">RPM Actual</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCompliance = () => {
        const getArcoTypeLabel = (type: string) => {
            const types: Record<string, string> = {
                'Access': 'Acceso',
                'Deletion': 'Eliminación',
                'Rectification': 'Rectificación',
                'Opposition': 'Oposición'
            };
            return types[type] || type;
        };

        const getArcoStatusLabel = (status: string) => {
            const statuses: Record<string, string> = {
                'Pending': 'Pendiente',
                'Completed': 'Completado',
                'Rejected': 'Rechazado'
            };
            return statuses[status] || status;
        };

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {MOCK_COMPLIANCE_AUDITS.map((comp, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-800 dark:text-white">{comp.standard}</h3>
                                {comp.status === 'Passed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <AlertOctagon className="w-5 h-5 text-amber-500" />
                                )}
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Puntaje</span>
                                    <span className="font-medium text-slate-800 dark:text-white">{comp.score || 0}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${(comp.score || 0) >= 90 ? 'bg-green-500' : 'bg-amber-500'}`}
                                        style={{ width: `${comp.score || 0}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-slate-500">Próxima Auditoría</span>
                                    <span className="text-slate-800 dark:text-white">{new Date(comp.nextAuditDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Solicitudes ARCO</h3>
                    <div className="overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Solicitante</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Fecha Límite</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {MOCK_ARCO_REQUESTS.map(req => (
                                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{req.id}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{getArcoTypeLabel(req.type)}</td>
                                        <td className="px-6 py-4 text-slate-500">{req.requesterEmail}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                {getArcoStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(req.deadline).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                                Procesar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderHistory = () => {
        // Filter for Auth related logs
        const historyLogs = MOCK_AUDIT_LOGS.filter(log =>
            log.action === 'Inicio de Sesión' || log.action === 'Cierre de Sesión'
        );

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Historial de Accesos</h3>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left min-w-[800px]">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Fecha y Hora</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Acción</th>
                                <th className="px-6 py-4">IP / Dispositivo</th>
                                <th className="px-6 py-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {historyLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 flex items-center justify-center text-[#7b68ee] dark:text-[#7b68ee] text-xs font-bold">
                                                {(MOCK_USERS.find(u => u.id === log.userId)?.name || '?').charAt(0)}
                                            </div>
                                            <span className="font-medium text-slate-800 dark:text-white">
                                                {MOCK_USERS.find(u => u.id === log.userId)?.name || log.userId}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.action === 'Inicio de Sesión' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">
                                        {log.ipAddress} <span className="text-slate-300 mx-1">|</span> {log.userAgent}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.success ? (
                                            <span className="flex items-center text-green-600 text-xs font-medium">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Exitoso
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-red-600 text-xs font-medium">
                                                <XCircle className="w-3 h-3 mr-1" /> Fallido
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    };

    const renderLogs = () => {
        const getActionLabel = (action: string) => {
            const actions: Record<string, string> = {
                'Project Created': 'Proyecto Creado',
                'User Created': 'Usuario Creado',
                'User Updated': 'Usuario Actualizado',
                'User Deleted': 'Usuario Eliminado'
            };
            return actions[action] || action;
        };

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Registros de Auditoría</h3>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <Filter className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left min-w-[800px]">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Hora</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Acción</th>
                                <th className="px-6 py-4">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {MOCK_AUDIT_LOGS.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                        {MOCK_USERS.find(u => u.id === log.userId)?.name || log.userId}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                            {getActionLabel(log.action)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
    };

    const navItems = [
        { id: 'overview', label: 'Visión General', icon: LayoutDashboard },
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'incidents', label: 'Incidentes', icon: AlertTriangle },
        { id: 'monitoring', label: 'Monitoreo', icon: Server },
        { id: 'compliance', label: 'Cumplimiento', icon: Shield },
        { id: 'logs', label: 'Registros', icon: FileText },
        { id: 'history', label: 'Historial', icon: History },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans p-6 overflow-hidden">
            {/* Header & Navigation */}
            <div className="flex flex-col space-y-4 mb-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
                                <Shield className="w-8 h-8 text-[#7b68ee]" />
                                Administración del Sistema
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Gestiona usuarios, seguridad y monitoreo de la plataforma
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                         <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">Estado del Sistema:</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center inline-flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Operativo
                            </span>
                         </div>
                    </div>
                </div>

                {/* Scrollable Tabs Navigation */}
                <div className="relative">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as AdminTab)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                                        isActive 
                                            ? 'bg-[#7b68ee] text-white shadow-lg shadow-[#7b68ee]/20' 
                                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-[#7b68ee]/10 dark:hover:bg-[#7b68ee]/20 hover:text-[#7b68ee] dark:hover:text-[#7b68ee] border border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-[#7b68ee]'}`} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-2">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'incidents' && renderIncidents()}
                {activeTab === 'monitoring' && renderMonitoring()}
                {activeTab === 'compliance' && renderCompliance()}
                {activeTab === 'logs' && renderLogs()}
                {activeTab === 'history' && renderHistory()}
            </div>

            {/* Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="relative w-64 bg-white dark:bg-slate-900 h-full shadow-2xl p-6 animate-in slide-in-from-left duration-300 flex flex-col">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Shield className="w-6 h-6 text-[#7b68ee]" />
                                Menú
                            </h2>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-auto">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id as AdminTab);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                            isActive 
                                                ? 'bg-[#7b68ee] text-white shadow-lg shadow-[#7b68ee]/20' 
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#7b68ee]'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                             <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-full bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 flex items-center justify-center text-[#7b68ee] dark:text-[#7b68ee] font-bold">
                                    {currentUser.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-white">{currentUser.name}</p>
                                    <p className="text-xs text-slate-500 truncate max-w-[120px]">{currentUser.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
                            </h3>
                            <button 
                                onClick={() => setIsUserModalOpen(false)}
                                className="p-2 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo Electrónico</label>
                                <input 
                                    type="email" 
                                    value={formData.email || ''}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rol</label>
                                    <select 
                                        value={formData.role || 'Developer'}
                                        onChange={e => setFormData({...formData, role: e.target.value as any})}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="ScrumMaster">Scrum Master</option>
                                        <option value="ProductOwner">Product Owner</option>
                                        <option value="Developer">Desarrollador</option>
                                        <option value="Stakeholder">Stakeholder</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                                    <select 
                                        value={formData.status || 'active'}
                                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="active">Activo</option>
                                        <option value="suspended">Suspendido</option>
                                        <option value="inactive">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsUserModalOpen(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveUser}
                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                            >
                                <Save className="w-4 h-4" />
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Incident Modal */}
            {isIncidentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingIncidentId ? 'Editar Incidente' : 'Reportar Nuevo Incidente'}
                            </h3>
                            <button 
                                onClick={() => setIsIncidentModalOpen(false)}
                                className="p-2 rounded-full transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Título del Incidente</label>
                                <input 
                                    type="text" 
                                    value={incidentFormData.title || ''}
                                    onChange={e => setIncidentFormData({...incidentFormData, title: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7b68ee] outline-none"
                                    placeholder="Ej: Error en servidor de pagos"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Descripción</label>
                                <textarea 
                                    value={incidentFormData.description || ''}
                                    onChange={e => setIncidentFormData({...incidentFormData, description: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7b68ee] outline-none h-24 resize-none"
                                    placeholder="Describa el incidente en detalle..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Severidad</label>
                                    <select 
                                        value={incidentFormData.severity || IncidentSeverity.MEDIUM}
                                        onChange={e => setIncidentFormData({...incidentFormData, severity: e.target.value as IncidentSeverity})}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7b68ee] outline-none"
                                    >
                                        <option value={IncidentSeverity.LOW}>Baja</option>
                                        <option value={IncidentSeverity.MEDIUM}>Media</option>
                                        <option value={IncidentSeverity.HIGH}>Alta</option>
                                        <option value={IncidentSeverity.CRITICAL}>Crítica</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
                                    <select 
                                        value={incidentFormData.status || IncidentStatus.OPEN}
                                        onChange={e => setIncidentFormData({...incidentFormData, status: e.target.value as IncidentStatus})}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#7b68ee] outline-none"
                                    >
                                        <option value={IncidentStatus.OPEN}>Abierto</option>
                                        <option value={IncidentStatus.IN_PROGRESS}>En Progreso</option>
                                        <option value={IncidentStatus.RESOLVED}>Resuelto</option>
                                        <option value={IncidentStatus.CLOSED}>Cerrado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsIncidentModalOpen(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSaveIncident}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                {editingIncidentId ? 'Guardar Cambios' : 'Reportar Incidente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">¿Confirmar eliminación?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Esta acción no se puede deshacer. Se eliminará permanentemente el registro seleccionado.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scan Complete Toast */}
            {scanComplete && (
                <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                        <p className="font-medium text-sm">Escaneo Completado</p>
                        <p className="text-xs text-slate-400">No se encontraron vulnerabilidades críticas</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemAdminView;
