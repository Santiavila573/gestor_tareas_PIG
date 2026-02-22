import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Task, TaskStatus, Sprint, User, Role, Project } from '../types';
import { Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ScrumMasterView from './dashboards/ScrumMasterView';
import ProductOwnerView from './dashboards/ProductOwnerView';
import DeveloperView from './dashboards/DeveloperView';
import SystemAdminView from './dashboards/SystemAdminView';

interface DashboardProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
  sprints: Sprint[];
  activeSprint: Sprint;
  currentUser: User | null;
  onTaskUpdate?: (taskId: string, newStatus: string) => void;
  onNavigateTo?: (view: string) => void;
  onAddUser?: (user: Omit<User, 'id'>) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
}

const COLORS = ['#7b68ee', '#f59e0b', '#10b981', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({
  tasks, users, projects, sprints, activeSprint, currentUser,
  onTaskUpdate, onNavigateTo,
  onAddUser, onUpdateUser, onDeleteUser
}) => {

  // Action Handlers
  const handleStartRetro = () => {
    if (onNavigateTo) {
      onNavigateTo('retrospective');
    } else {
      alert('Iniciando retrospectiva del sprint...');
    }
  };

  const handleCreateStory = () => {
    if (onNavigateTo) {
      onNavigateTo('backlog');
    } else {
      const title = prompt("Título de la nueva historia:");
      if (title) alert(`Historia "${title}" creada en el backlog.`);
    }
  };

  const handleMoveToReview = (taskId: string) => {
    // Call the parent handler to actually update state
    if (onTaskUpdate) {
      onTaskUpdate(taskId, TaskStatus.REVIEW);
    } else {
      alert(`Simulación: Tarea ${taskId} movida a revisión.`);
    }
  };

  const handleAddComment = (taskId: string, comment: string) => {
    alert(`Comentario añadido a tarea ${taskId}: "${comment}"`);
  };

  const handleDailyUpdate = (taskId: string, status: string, blockers: string) => {
    const message = `Daily enviado:\nActividad: ${status}\nBloqueos: ${blockers || 'Ninguno'}`;
    alert(message);
    // Here we could also update the task status if needed
  };

  // Role Based Rendering
  if (currentUser?.role === Role.SYSTEM_ADMIN) {
    return (
      <SystemAdminView
        currentUser={currentUser}
        users={users}
        onAddUser={onAddUser || (() => console.warn('onAddUser not provided'))}
        onUpdateUser={onUpdateUser || (() => console.warn('onUpdateUser not provided'))}
        onDeleteUser={onDeleteUser || (() => console.warn('onDeleteUser not provided'))}
      />
    );
  }

  if (currentUser?.role === Role.SCRUM_MASTER) {
    return <ScrumMasterView tasks={tasks} activeSprint={activeSprint} users={users} onStartRetro={handleStartRetro} />;
  }

  if (currentUser?.role === Role.PRODUCT_OWNER) {
    return <ProductOwnerView tasks={tasks} projects={projects} onCreateStory={handleCreateStory} />;
  }

  if (currentUser?.role === Role.DEVELOPER) {
    return <DeveloperView
      tasks={tasks}
      currentUser={currentUser}
      onMoveToReview={handleMoveToReview}
      onAddComment={handleAddComment}
      onDailyUpdate={handleDailyUpdate}
    />;
  }

  // Fallback / Default View (Previous General Dashboard)
  // Metric Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const statusData = [
    { name: 'Por Hacer', value: tasks.filter(t => t.status === TaskStatus.TODO).length },
    { name: 'En Progreso', value: inProgressTasks },
    { name: 'Revisión', value: tasks.filter(t => t.status === TaskStatus.REVIEW).length },
    { name: 'Hecho', value: completedTasks },
  ];

  // Velocity Data Calculation
  const velocityData = React.useMemo(() => {
    // Sort sprints by date
    const sortedSprints = [...sprints].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Get last 4 sprints including current
    // We filter to find the index of activeSprint or just take the last ones
    const recentSprints = sortedSprints.slice(-4);

    return recentSprints.map(sprint => {
      const sprintTasks = tasks.filter(t => t.sprintId === sprint.id);
      const planned = sprintTasks.reduce((acc, t) => acc + (t.points || 0), 0);
      const completed = sprintTasks
        .filter(t => t.status === TaskStatus.DONE)
        .reduce((acc, t) => acc + (t.points || 0), 0);

      return {
        name: sprint.name,
        planned,
        completed
      };
    });
  }, [sprints, tasks]);

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white dark:bg-[#1e1e2d] p-6 3xl:p-10 4xl:p-14 rounded-xl 3xl:rounded-[2rem] 4xl:rounded-[3rem] shadow-sm border border-gray-200 dark:border-[#2a2b36] flex items-start justify-between transition-colors hover:shadow-md duration-200 group">
      <div>
        <p className="text-[10px] 2xl:text-xs 3xl:text-xl 4xl:text-2xl font-bold text-gray-500 dark:text-gray-400 mb-1 3xl:mb-3 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl 2xl:text-3xl 3xl:text-6xl 4xl:text-7xl font-bold text-gray-900 dark:text-white">{value}</h3>
        <p className="text-xs 2xl:text-sm 3xl:text-xl 4xl:text-2xl text-gray-400 dark:text-gray-500 mt-1 3xl:mt-4">{sub}</p>
      </div>
      <div className={`p-3 2xl:p-4 3xl:p-8 4xl:p-10 rounded-lg 3xl:rounded-2xl 4xl:rounded-3xl ${color} shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 2xl:w-6 2xl:h-6 3xl:w-12 3xl:h-12 4xl:w-16 4xl:h-16 text-white" />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 lg:space-y-8 3xl:space-y-12 min-h-full transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl 2xl:text-3xl 3xl:text-6xl 4xl:text-7xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
          <p className="text-gray-500 dark:text-gray-400 2xl:text-base 3xl:text-2xl 4xl:text-3xl">Métricas en tiempo real para {activeSprint.name}</p>
        </div>
        <div className="bg-white dark:bg-[#1e1e2d] px-4 py-2 2xl:px-4 2xl:py-2 rounded-lg border border-gray-200 dark:border-[#2a2b36] shadow-sm text-sm 2xl:text-sm text-gray-700 dark:text-gray-300 transition-colors">
          Meta del Sprint: <span className="font-bold text-[#7b68ee]">{activeSprint.goal}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 3xl:gap-12 4xl:gap-16">
        <StatCard title="Tasa Completada" value={`${completionRate}%`} sub="Tareas completadas" icon={CheckCircle} color="bg-emerald-500" />
        <StatCard title="Tareas Activas" value={inProgressTasks} sub="Actualmente en desarrollo" icon={Activity} color="bg-[#7b68ee]" />
        <StatCard title="Días Restantes" value="4 Días" sub="Hasta fin del sprint" icon={Clock} color="bg-amber-500" />
        <StatCard title="Puntos Totales" value={tasks.reduce((acc, t) => acc + (t.points || 0), 0)} sub="Puntos de historia en sprint" icon={AlertCircle} color="bg-rose-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Chart */}
        <div className="bg-white dark:bg-[#1e1e2d] p-6 3xl:p-10 4xl:p-14 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] flex flex-col transition-colors">
          <h3 className="text-lg 3xl:text-3xl 4xl:text-4xl font-semibold text-gray-800 dark:text-white mb-6 3xl:mb-10">Velocidad del Equipo</h3>
          <div className="h-64 w-full flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e1e2d',
                    color: '#fff'
                  }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="planned" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Puntos Planeados" />
                <Bar dataKey="completed" fill="#7b68ee" radius={[4, 4, 0, 0]} name="Puntos Completados" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="bg-white dark:bg-[#1e1e2d] p-6 3xl:p-10 4xl:p-14 rounded-xl shadow-sm border border-gray-200 dark:border-[#2a2b36] flex flex-col transition-colors">
          <h3 className="text-lg 3xl:text-3xl 4xl:text-4xl font-semibold text-gray-800 dark:text-white mb-6 3xl:mb-10">Distribución de Tareas</h3>
          {/* Removed flex items-center justify-center to fix ResponsiveContainer height issue */}
          <div className="h-64 w-full flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e1e2d',
                    color: '#fff'
                  }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;