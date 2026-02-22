import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Settings,
  Menu,
  Bell,
  Search,
  LogOut,
  FolderKanban,
  Moon,
  Sun,
  X,
  Check,
  Mail,
  User as UserIcon,
  Shield,
  Globe,
  Save,
  ClipboardList,
  Calendar,
  MessageSquare,
  Video,
  Film,
  Home,
  Inbox,
  Clock,
  MoreHorizontal,
  FileText,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Map,
  RefreshCw,
  Pencil,
  FileCode,
  Zap,
  ChevronLeft,
  ChevronRight,
  Share2,
  Plus,
  Link
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ScrumBoard from './components/ScrumBoard';
import BacklogView from './components/BacklogView';
import RoadmapView from './components/RoadmapView';
import RetrospectiveView from './components/RetrospectiveView';
import IntegrationsView from './components/IntegrationsView';
import DailyStandup from './components/DailyStandup';
import AIChatbot from './components/AIChatbot';
import Projects from './components/Projects';
import Team from './components/Team';
import TeamChat from './components/TeamChat';
import MeetingRoom from './components/MeetingRoom';
import RecordingsRepository from './components/RecordingsRepository';
import PersonalNotes from './components/PersonalNotes';
import CalendarView from './components/CalendarView';
import HomeView from './components/Home';
import InboxView from './components/Inbox';
import TimesheetsView from './components/Timesheets';
import ArtifactRepository from './components/ArtifactRepository';
import Whiteboards from './components/Whiteboards';
import Sketchpad from './components/Sketchpad';
import EnhancedUML from './components/EnhancedUML';
import GestorGPT from './components/GestorGPT';
import RequirementBoard from './components/RequirementBoard';
import Clips from './components/Clips';
import More from './components/More';
import TaskWizard from './components/TaskWizard';
import Login from './components/Login';
import Register from './components/Register';
import ChecklistBoard from './components/ChecklistBoard';
import { authService } from './services/auth';
import { firebaseAuthService } from './services/firebaseAuth';
import { tasksService, sprintsService, projectsService, usersService, migrationService } from './services/firebaseData';
import { FIREBASE_ENABLED } from './services/firebase';
import { MOCK_TASKS, MOCK_USERS, MOCK_SPRINTS, MOCK_PROJECTS } from './constants';
import { Task, TaskStatus, Project, User, Role, Sprint, RoadmapItem, RetroItem } from './types';

// Simple Hash Router Implementation for Navigation
type View = 'home' | 'inbox' | 'chat' | 'team' | 'docs' | 'dashboards' | 'whiteboards' | 'sketchpad' | 'uml' | 'ide' | 'requirements' | 'clips' | 'timesheets' | 'more' | 'calendar' | 'projects' | 'meeting' | 'board' | 'backlog' | 'roadmap' | 'retrospective' | 'standup' | 'checklist' | 'recordings' | 'integrations';

interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: 'info' | 'alert' | 'success';
}

const SidebarItem: React.FC<{ icon: any; label: string; isActive: boolean; onClick: () => void; isChild?: boolean; delay?: number }> = ({ icon: Icon, label, isActive, onClick, isChild, delay = 0 }) => (
  <button
    onClick={onClick}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    className={`w-full flex items-center gap-4 px-4 py-3.5 lg:py-4 2xl:py-5 3xl:py-8 4xl:py-12 rounded-2xl text-sm 2xl:text-xl 3xl:text-3xl 4xl:text-[2.5rem] font-black transition-all duration-300 group animate-in slide-in-from-left ${isActive
      ? 'sidebar-item-active text-white'
      : 'text-gray-400 sidebar-item-hover hover:text-white'
      } ${isChild ? 'ml-6 w-[calc(100%-1.5rem)] text-xs 2xl:text-lg 3xl:text-2xl 4xl:text-4xl' : ''}`}
  >
    <Icon className={`w-6 h-6 2xl:w-8 2xl:h-8 3xl:w-12 3xl:h-12 4xl:w-16 4xl:h-16 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${isActive ? 'text-white sidebar-icon-glow' : 'text-gray-400 group-hover:text-[#7b68ee]'}`} />
    <span className={`transition-all duration-300 font-jakarta whitespace-nowrap ${isActive ? 'font-black tracking-tighter' : 'font-bold'}`}>{label}</span>
    {isActive && <div className="ml-auto w-2 h-2 2xl:w-3 2xl:h-3 3xl:w-5 3xl:h-5 4xl:w-7 4xl:h-7 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)] animate-pulse" />}
  </button>
);

const App: React.FC = () => {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const [currentView, setCurrentView] = useState<View>('home');
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isSearchMobileOpen, setIsSearchMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // UI States for Popovers/Modals
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTaskWizardOpen, setTaskWizardOpen] = useState(false);
  const [showAIPrompt, setShowAIPrompt] = useState(true);



  // App State - Firebase or localStorage based on configuration
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!FIREBASE_ENABLED) {
      const saved = localStorage.getItem('scrum_tasks_v2');
      return saved ? JSON.parse(saved) : MOCK_TASKS;
    }
    return [];
  });

  const [sprints, setSprints] = useState<Sprint[]>(() => {
    if (!FIREBASE_ENABLED) {
      const saved = localStorage.getItem('scrum_sprints_v2');
      return saved ? JSON.parse(saved) : MOCK_SPRINTS;
    }
    return [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    if (!FIREBASE_ENABLED) {
      const saved = localStorage.getItem('scrum_projects_v2');
      return saved ? JSON.parse(saved) : MOCK_PROJECTS;
    }
    return [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    if (!FIREBASE_ENABLED) {
      const saved = localStorage.getItem('scrum_users_v3');
      return saved ? JSON.parse(saved) : MOCK_USERS;
    }
    return [];
  });

  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>(() => {
    if (!FIREBASE_ENABLED) {
      const saved = localStorage.getItem('scrum_roadmap_v2');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [retroItems, setRetroItems] = useState<RetroItem[]>(() => {
    if (!FIREBASE_ENABLED) {
      const saved = localStorage.getItem('scrum_retro_v2');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Persistence Effects for Roadmap and Retro (Local Storage only for now)
  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      localStorage.setItem('scrum_roadmap_v2', JSON.stringify(roadmapItems));
    }
  }, [roadmapItems]);

  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      localStorage.setItem('scrum_retro_v2', JSON.stringify(retroItems));
    }
  }, [retroItems]);

  // Roadmap Handlers
  const handleAddRoadmapItem = (item: Omit<RoadmapItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setRoadmapItems([...roadmapItems, newItem]);
  };

  const handleUpdateRoadmapItem = (item: RoadmapItem) => {
    setRoadmapItems(roadmapItems.map(i => i.id === item.id ? item : i));
  };

  const handleDeleteRoadmapItem = (id: string) => {
    setRoadmapItems(roadmapItems.filter(i => i.id !== id));
  };

  // Retro Handlers
  const handleAddRetroItem = (item: Omit<RetroItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setRetroItems([...retroItems, newItem]);
  };

  const handleUpdateRetroItem = (item: RetroItem) => {
    setRetroItems(retroItems.map(i => i.id === item.id ? item : i));
  };

  const handleDeleteRetroItem = (id: string) => {
    setRetroItems(retroItems.filter(i => i.id !== id));
  };

  const handleClearRetroItems = () => {
    setRetroItems([]);
  };

  const [isLoadingData, setIsLoadingData] = useState(FIREBASE_ENABLED);

  // Search State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [highlightedProjectId, setHighlightedProjectId] = useState<string | null>(null);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
        // Optional: Close mobile search if clicking outside (though usually we want to keep it open until explicit close or selection)
        // setIsSearchMobileOpen(false); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Results
  const searchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return null;

    const query = globalSearchQuery.toLowerCase();

    return {
      tasks: tasks.filter(t => t.title.toLowerCase().includes(query) || t.id.toLowerCase().includes(query)).slice(0, 3),
      projects: projects.filter(p => p.name.toLowerCase().includes(query)).slice(0, 3),
      users: users.filter(u => u.name.toLowerCase().includes(query) || u.role.toLowerCase().includes(query)).slice(0, 3),
      sprints: sprints.filter(s => s.name.toLowerCase().includes(query)).slice(0, 3),
      views: [
        { id: 'home', label: 'Inicio', icon: LayoutDashboard },
        { id: 'projects', label: 'Proyectos', icon: FolderKanban },
        { id: 'team', label: 'Equipo', icon: Users },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
        { id: 'inbox', label: 'Bandeja de Entrada', icon: Inbox },
        { id: 'backlog', label: 'Backlog', icon: AlertCircle },
        { id: 'roadmap', label: 'Roadmap', icon: Map },
        { id: 'retrospective', label: 'Retrospectiva', icon: RefreshCw },
        { id: 'standup', label: 'Daily Standup', icon: Clock },
        { id: 'sketchpad', label: 'Pizarra Dibujo', icon: Pencil },
        { id: 'uml', label: 'Diagramas UML', icon: Share2 },
        { id: 'checklist', label: 'Checklist', icon: ClipboardList },
        { id: 'recordings', label: 'Grabaciones', icon: Film },
        { id: 'integrations', label: 'Integraciones', icon: Link },
        ...(sessionUser?.role === Role.DEVELOPER ? [{ id: 'ide', label: 'Gestor GPT', icon: FileCode }] : []),
      ].filter(v => v.label.toLowerCase().includes(query)).slice(0, 3)
    };
  }, [globalSearchQuery, sessionUser]);

  const handleSearchResultClick = (type: string, item: any) => {
    setGlobalSearchQuery('');
    setIsSearchFocused(false);

    switch (type) {
      case 'view':
        setCurrentView(item.id as View);
        break;
      case 'project':
        setCurrentView('projects');
        setHighlightedProjectId(item.id);
        break;
      case 'user':
        setCurrentView('team');
        setHighlightedUserId(item.id);
        break;
      case 'sprint':
        setCurrentView('board');
        break;
      case 'task':
        setCurrentView('board');
        setHighlightedTaskId(item.id);
        break;
    }
  };

  // AI Chatbot State
  const [pendingAIQuery, setPendingAIQuery] = useState<string | null>(null);

  // Inactivity Timer Logic
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore session on mount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const restoreSession = async () => {
      if (FIREBASE_ENABLED) {
        await firebaseAuthService.init();
        unsubscribe = firebaseAuthService.onAuthStateChange((user) => {
          setSessionUser(user);
        });
      } else {
        await authService.init();
        const user = authService.getCurrentUser();
        if (user) {
          setSessionUser(user);
        }
      }
    };
    restoreSession();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogout = useCallback(async () => {
    if (FIREBASE_ENABLED) {
      await firebaseAuthService.logout();
    } else {
      authService.logout();
    }
    setSessionUser(null);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (sessionUser) {
      inactivityTimerRef.current = setTimeout(() => {
        handleLogout();
        // Notify user about session expiration
        alert('Tu sesión ha expirado por inactividad (15 min).');
      }, INACTIVITY_LIMIT);
    }
  }, [sessionUser, handleLogout]);

  useEffect(() => {
    if (!sessionUser) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Initial start
    resetInactivityTimer();

    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [sessionUser, resetInactivityTimer]);

  /* Role Based Sidebar Logic */
  const getSidebarItems = () => {
    const items = [
      { view: 'home', icon: Home, label: 'Home', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'inbox', icon: Inbox, label: 'Inbox', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'chat', icon: MessageSquare, label: 'Chat', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'team', icon: Users, label: 'Teams', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'docs', icon: ClipboardList, label: 'Repo PIG', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'dashboards', icon: LayoutDashboard, label: 'Dashboards', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'whiteboards', icon: KanbanSquare, label: 'Whiteboards', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'sketchpad', icon: Pencil, label: 'Pizarra Dibujo', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'uml', icon: Share2, label: 'Diagramas UML', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'ide', icon: FileCode, label: 'Gestor GPT', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'requirements', icon: ClipboardList, label: 'Pizarra Req.', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'backlog', icon: AlertCircle, label: 'Backlog', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'roadmap', icon: Map, label: 'Roadmap', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.SYSTEM_ADMIN] },
      { view: 'retrospective', icon: RefreshCw, label: 'Retrospectiva', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'standup', icon: Clock, label: 'Daily Standup', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'checklist', icon: ClipboardList, label: 'Checklist', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'clips', icon: Film, label: 'Clips', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'timesheets', icon: Clock, label: 'Timesheets', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
      { view: 'more', icon: MoreHorizontal, label: 'More', roles: [Role.SCRUM_MASTER, Role.PRODUCT_OWNER, Role.DEVELOPER, Role.SYSTEM_ADMIN] },
    ];

    return items.filter(item => sessionUser && item.roles.includes(sessionUser.role));
  };

  // Persistence for localStorage mode
  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      localStorage.setItem('scrum_tasks_v2', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      localStorage.setItem('scrum_sprints_v2', JSON.stringify(sprints));
    }
  }, [sprints]);

  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      localStorage.setItem('scrum_projects_v2', JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (!FIREBASE_ENABLED) {
      localStorage.setItem('scrum_users_v2', JSON.stringify(users));
    }
  }, [users]);

  // Load data from Firebase on mount (only if Firebase is enabled)
  useEffect(() => {
    if (!FIREBASE_ENABLED) return;

    const loadFirebaseData = async () => {
      try {
        setIsLoadingData(true);

        // Load all data in parallel
        const [tasksData, sprintsData, projectsData, usersData] = await Promise.all([
          tasksService.getAll(),
          sprintsService.getAll(),
          projectsService.getAll(),
          usersService.getAll()
        ]);

        setTasks(tasksData);
        setSprints(sprintsData);
        setProjects(projectsData);
        setUsers(usersData);

        // If no data exists, check if we should migrate from localStorage
        if (tasksData.length === 0 && sprintsData.length === 0) {
          const hasLocalData = localStorage.getItem('scrum_tasks_v2') ||
            localStorage.getItem('scrum_sprints_v2');

          if (hasLocalData) {
            const shouldMigrate = window.confirm(
              '¿Detectamos datos en localStorage. ¿Deseas migrarlos a Firebase?'
            );

            if (shouldMigrate) {
              await migrationService.migrateFromLocalStorage();
              // Reload data after migration
              const [newTasks, newSprints, newProjects] = await Promise.all([
                tasksService.getAll(),
                sprintsService.getAll(),
                projectsService.getAll()
              ]);
              setTasks(newTasks);
              setSprints(newSprints);
              setProjects(newProjects);
            }
          }
        }
      } catch (error) {
        console.error('Error loading Firebase data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFirebaseData();
  }, []);

  // Real-time listeners for Firebase data (only if Firebase is enabled)
  useEffect(() => {
    if (!FIREBASE_ENABLED) return;

    const unsubscribeTasks = tasksService.onTasksChange(setTasks);
    const unsubscribeSprints = sprintsService.onSprintsChange(setSprints);
    const unsubscribeProjects = projectsService.onProjectsChange(setProjects);
    const unsubscribeUsers = usersService.onUsersChange(setUsers);

    return () => {
      unsubscribeTasks();
      unsubscribeSprints();
      unsubscribeProjects();
      unsubscribeUsers();
    };
  }, []);



  // Sync session user to users list
  useEffect(() => {
    if (sessionUser) {
      setUsers(prev => {
        if (!prev.find(u => u.email === sessionUser.email)) {
          return [sessionUser, ...prev];
        }
        return prev;
      });
    }
  }, [sessionUser]);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    userName: sessionUser?.name || 'Usuario',
    email: sessionUser?.email || 'usuario@ejemplo.com',
    language: 'es',
    emailNotifications: true
  });

  // Notifications State with User Isolation
  const [notificationsUserId, setNotificationsUserId] = useState<string | undefined>(sessionUser?.id);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (sessionUser?.id) {
      const key = `scrum_notifications_${sessionUser.id}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: '1', text: 'Bienvenido a PIG 2026', time: 'Ahora', read: false, type: 'info' }
    ];
  });

  // Handle User Change & Load
  useEffect(() => {
    if (sessionUser?.id && sessionUser.id !== notificationsUserId) {
      const key = `scrum_notifications_${sessionUser.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        setNotifications([
          { id: '1', text: 'Bienvenido a PIG 2026', time: 'Ahora', read: false, type: 'info' }
        ]);
      }
      setNotificationsUserId(sessionUser.id);
    }
  }, [sessionUser, notificationsUserId]);

  // Persist notifications (only if user matches)
  useEffect(() => {
    if (sessionUser?.id && notificationsUserId === sessionUser.id) {
      localStorage.setItem(`scrum_notifications_${sessionUser.id}`, JSON.stringify(notifications));
    }
  }, [notifications, sessionUser, notificationsUserId]);

  // Deadline Checker
  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (!task.dueDate || task.status === TaskStatus.DONE) return;

        const due = new Date(task.dueDate);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

        let notificationMsg = '';
        let type: 'alert' | 'info' = 'info';

        if (diffHours < 0) {
          // Overdue
          notificationMsg = `¡ATENCIÓN! La tarea "${task.title}" ha vencido.`;
          type = 'alert';
        } else if (diffHours < 24) {
          // Upcoming
          notificationMsg = `La tarea "${task.title}" vence en menos de 24 horas.`;
          type = 'alert';
        } else if (diffHours < 48) {
          notificationMsg = `Recordatorio: "${task.title}" vence pronto.`;
        }

        if (notificationMsg) {
          // Avoid duplicates
          setNotifications(prev => {
            const exists = prev.some(n => n.text === notificationMsg);
            if (exists) return prev;
            return [{
              id: Date.now().toString() + Math.random(),
              text: notificationMsg,
              time: 'Ahora',
              read: false,
              type
            }, ...prev];
          });
        }
      });
    };

    const checkReminders = () => {
      const savedReminders = localStorage.getItem('calendar_reminders');
      if (!savedReminders) return;

      try {
        const reminders = JSON.parse(savedReminders);
        const now = new Date();

        reminders.forEach((reminder: any) => {
          const remDate = new Date(`${reminder.date}T${reminder.time}`);
          const diffHours = (remDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          let msg = '';
          if (diffHours > 0 && diffHours <= 48) {
            msg = `RECORDATORIO: "${reminder.title}" es en ${Math.round(diffHours)} horas.`;
          }

          if (msg) {
            setNotifications(prev => {
              const exists = prev.some(n => n.text === msg);
              if (exists) return prev;
              return [{
                id: `rem-${reminder.id}-${Math.floor(diffHours / 24)}`,
                text: msg,
                time: 'Ahora',
                read: false,
                type: diffHours <= 24 ? 'alert' : 'info'
              }, ...prev];
            });
          }
        });
      } catch (e) {
        console.error("Error checking reminders:", e);
      }
    };

    const timer = setInterval(() => {
      checkDeadlines();
      checkReminders();
    }, 60000); // Check every minute

    checkDeadlines();
    checkReminders();

    return () => clearInterval(timer);
  }, [tasks]);

  const activeSprint = sprints.find(s => s.status === 'Active') || sprints[0];
  const notificationRef = useRef<HTMLDivElement>(null);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handler for Kanban Updates - Firebase or localStorage
  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (FIREBASE_ENABLED) {
      try {
        await tasksService.update(taskId, { status: newStatus });
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    } else {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    }
  };

  const handleAddTask = async (taskData: Omit<Task, 'id'>) => {
    if (!activeSprint) {
      alert("No hay un sprint activo. Por favor crea uno primero.");
      return;
    }

    if (FIREBASE_ENABLED) {
      try {
        const newTask = await tasksService.add({
          ...taskData,
          sprintId: activeSprint.id
        });

        setNotifications(prev => [{
          id: Date.now().toString(),
          text: `Nueva tarea creada: ${newTask.title}`,
          time: 'Ahora',
          read: false,
          type: 'info'
        }, ...prev]);
      } catch (error) {
        console.error('Error adding task:', error);
      }
    } else {
      const newTask: Task = {
        ...taskData,
        id: `t-${Date.now()}`,
        sprintId: activeSprint.id
      };
      setTasks([...tasks, newTask]);

      setNotifications(prev => [{
        id: Date.now().toString(),
        text: `Nueva tarea creada: ${newTask.title}`,
        time: 'Ahora',
        read: false,
        type: 'info'
      }, ...prev]);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    if (FIREBASE_ENABLED) {
      try {
        const { id, ...updates } = updatedTask;
        await tasksService.update(id, updates);
      } catch (error) {
        console.error('Error updating task:', error);
      }
    } else {
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (FIREBASE_ENABLED) {
      try {
        await tasksService.delete(taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    } else {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  // Handlers for Project CRUD - Firebase or localStorage
  const handleAddProject = async (newProjectData: Omit<Project, 'id'>) => {
    if (FIREBASE_ENABLED) {
      try {
        await projectsService.add(newProjectData);
      } catch (error) {
        console.error('Error adding project:', error);
      }
    } else {
      const newProject: Project = {
        ...newProjectData,
        id: `p${Date.now()}`
      };
      setProjects([...projects, newProject]);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    if (FIREBASE_ENABLED) {
      try {
        const { id, ...updates } = updatedProject;
        await projectsService.update(id, updates);
      } catch (error) {
        console.error('Error updating project:', error);
      }
    } else {
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (FIREBASE_ENABLED) {
      try {
        await projectsService.delete(projectId);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  // Handlers for Sprint CRUD - Firebase or localStorage
  const handleAddSprint = async (newSprintData: Omit<Sprint, 'id'>) => {
    if (FIREBASE_ENABLED) {
      try {
        await sprintsService.add(newSprintData);
      } catch (error) {
        console.error('Error adding sprint:', error);
      }
    } else {
      const newSprint: Sprint = {
        ...newSprintData,
        id: `s${Date.now()}`
      };
      setSprints([...sprints, newSprint]);
    }
  };

  const handleUpdateSprint = async (updatedSprint: Sprint) => {
    if (FIREBASE_ENABLED) {
      try {
        const { id, ...updates } = updatedSprint;
        await sprintsService.update(id, updates);
      } catch (error) {
        console.error('Error updating sprint:', error);
      }
    } else {
      setSprints(sprints.map(s => s.id === updatedSprint.id ? updatedSprint : s));
    }
  };

  const handleDeleteSprint = async (sprintId: string) => {
    if (FIREBASE_ENABLED) {
      try {
        await sprintsService.delete(sprintId);
      } catch (error) {
        console.error('Error deleting sprint:', error);
      }
    } else {
      setSprints(sprints.filter(s => s.id !== sprintId));
    }
  };

  // Handlers for User/Team CRUD - Firebase or localStorage
  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    if (FIREBASE_ENABLED) {
      console.warn('Adding users should be done through registration');
    } else {
      const newUser: User = {
        ...userData,
        id: `u${Date.now()}`
      };
      setUsers([...users, newUser]);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (FIREBASE_ENABLED) {
      try {
        const { id, ...updates } = updatedUser;
        await usersService.update(id, updates);
      } catch (error) {
        console.error('Error updating user:', error);
      }
    } else {
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (FIREBASE_ENABLED) {
      try {
        await usersService.delete(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    } else {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  // Removed duplicate showSettings
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread' | 'alert'>('all');

  // Notification Logic
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    if (window.confirm('¿Borrar todas las notificaciones?')) {
      setNotifications([]);
    }
  };

  const getFilteredNotifications = () => {
    switch (notificationFilter) {
      case 'unread': return notifications.filter(n => !n.read);
      case 'alert': return notifications.filter(n => n.type === 'alert');
      default: return notifications;
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Update local user state for immediate feedback
    const updatedUsers = [...users];
    if (updatedUsers[0]) {
      updatedUsers[0] = { ...updatedUsers[0], name: settingsForm.userName };
      setUsers(updatedUsers);
    }
    setShowSettings(false);
    // Here you would typically make an API call
  };





  if (!sessionUser) {
    if (authView === 'login') {
      return <Login
        onLoginSuccess={async () => {
          if (FIREBASE_ENABLED) {
            const user = await firebaseAuthService.getCurrentUser();
            setSessionUser(user);
          } else {
            setSessionUser(authService.getCurrentUser());
          }
        }}
        onNavigateToRegister={() => setAuthView('register')}
      />;
    } else {
      return <Register
        onRegisterSuccess={async () => {
          if (FIREBASE_ENABLED) {
            const user = await firebaseAuthService.getCurrentUser();
            setSessionUser(user);
          } else {
            setSessionUser(authService.getCurrentUser());
          }
        }}
        onNavigateToLogin={() => setAuthView('login')}
      />;
    }
  }

  // Show loading state while data is being fetched from Firebase
  if (FIREBASE_ENABLED && isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7b68ee] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando datos desde Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full transition-colors duration-500 font-jakarta ${darkMode ? 'dark bg-[#0b0c14]' : 'bg-[#f4f7fe]'}`}>
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-500"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-64 lg:w-72 2xl:w-72 3xl:w-80 4xl:w-[600px]
        bg-[#1e1e2d] dark:bg-[#11121d] 
        text-white flex flex-col transition-all duration-500 ease-in-out shadow-[10px_0_40px_rgba(0,0,0,0.3)]
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>  {/* Workspace Switcher */}
        <div
          onClick={() => setCurrentView('home')}
          className="h-20 lg:h-24 2xl:h-24 3xl:h-32 4xl:h-48 flex items-center px-8 3xl:px-14 4xl:px-20 border-b border-white/5 bg-[#1e1e2d] relative group cursor-pointer hover:bg-white/[0.02] transition-colors"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-[#7b68ee] to-purple-500 opacity-50"></div>
          {/* Logo Container - Clean & Professional */}
          <div className="relative w-12 h-12 2xl:w-12 2xl:h-12 3xl:w-16 3xl:h-16 4xl:w-32 4xl:h-32 flex-shrink-0">
            {/* Main Icon Box */}
            <div className="relative w-full h-full bg-gradient-to-br from-[#7b68ee] to-[#5b4bc4] rounded-2xl 3xl:rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 group-hover:scale-[1.05] transition-transform duration-300 rotate-3">
              <Zap className="w-6 h-6 lg:w-8 lg:h-8 2xl:w-8 2xl:h-8 3xl:w-10 3xl:h-10 4xl:w-20 4xl:h-20 fill-white" />
            </div>
          </div>


          <div className="flex-1 min-w-0 ml-5 3xl:ml-10">
            <h2 className="block font-black text-xl 2xl:text-xl 3xl:text-2xl 4xl:text-[4.5rem] text-white tracking-tighter leading-none truncate group-hover:text-[#7b68ee] transition-colors">PIG 2026</h2>
            <span className="text-[10px] 2xl:text-[10px] 3xl:text-xs 4xl:text-3xl text-gray-500 font-black uppercase tracking-[0.3em] mt-1.5 block">Gestor IA</span>
          </div>

          {/* Close Sidebar Toggle for Desktop/Mobile */}
          <button
            onClick={(e) => { e.stopPropagation(); setSidebarOpen(false); }}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">

          {/* Favorites / Quick Access */}
          <div>
            <div className="px-4 mb-3 lg:mb-4 2xl:mb-4 3xl:mb-6 flex items-center justify-between group">
              <span className="text-xs 2xl:text-xs 3xl:text-xl 4xl:text-5xl font-black text-gray-500 uppercase tracking-widest">Favoritos</span>
              <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#7b68ee] transition-all text-xl 2xl:text-xl 3xl:text-3xl">+</button>
            </div>
            <div className="space-y-2 lg:space-y-3 2xl:space-y-3 3xl:space-y-4">
              <SidebarItem
                icon={Home}
                label="Inicio"
                isActive={currentView === 'home'}
                onClick={() => { setCurrentView('home'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={100}
              />
              <SidebarItem
                icon={Bell}
                label="Notificaciones"
                isActive={false}
                onClick={() => setShowNotifications(true)}
                delay={150}
              />
            </div>
          </div>

          {/* Spaces / Projects */}
          <div>
            <div className="px-4 mb-3 lg:mb-4 2xl:mb-4 3xl:mb-6 flex items-center justify-between group">
              <span className="text-xs 2xl:text-xs 3xl:text-xl 4xl:text-5xl font-black text-gray-500 uppercase tracking-widest">Espacios</span>
              <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#7b68ee] transition-all text-xl 2xl:text-xl 3xl:text-3xl">+</button>
            </div>
            <div className="space-y-2 lg:space-y-3 2xl:space-y-3 3xl:space-y-4">
              <SidebarItem
                icon={FolderKanban}
                label="Desarrollo PIG"
                isActive={currentView === 'projects'}
                onClick={() => { setCurrentView('projects'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={200}
              />

              {/* Nested items for "Development" space */}
              <div className="pl-2 border-l border-gray-200 dark:border-[#2a2b36] ml-4 space-y-0.5 my-1">
                <SidebarItem
                  isChild
                  icon={KanbanSquare}
                  label="Sprints Activos"
                  isActive={currentView === 'board'}
                  onClick={() => { setCurrentView('board'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                  delay={250}
                />
                <SidebarItem
                  isChild
                  icon={Calendar}
                  label="Calendario"
                  isActive={currentView === 'calendar'}
                  onClick={() => { setCurrentView('calendar'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                  delay={300}
                />
              </div>

              <SidebarItem
                icon={Users}
                label="Equipo & Personas"
                isActive={currentView === 'team'}
                onClick={() => { setCurrentView('team'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={350}
              />
            </div>
          </div>

          {/* Tools / Apps */}
          <div>
            <div className="px-4 mb-3 lg:mb-4 2xl:mb-4 3xl:mb-6 flex items-center justify-between group">
              <span className="text-xs 2xl:text-xs 3xl:text-xl 4xl:text-5xl font-black text-gray-500 uppercase tracking-widest">Herramientas</span>
            </div>
            <div className="space-y-2 lg:space-y-3 2xl:space-y-3 3xl:space-y-4">
              <SidebarItem
                icon={Video}
                label="Daily Standup"
                isActive={currentView === 'meeting'}
                onClick={() => { setCurrentView('meeting'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={400}
              />
              <SidebarItem
                icon={MessageSquare}
                label="Chat de Equipo"
                isActive={currentView === 'chat'}
                onClick={() => { setCurrentView('chat'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={450}
              />
              <SidebarItem
                icon={Film}
                label="Grabaciones"
                isActive={currentView === 'recordings'}
                onClick={() => { setCurrentView('recordings'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={500}
              />
              <SidebarItem
                icon={ClipboardList}
                label="Hitos & Artefactos"
                isActive={currentView === 'docs'}
                onClick={() => { setCurrentView('docs'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={550}
              />
              <SidebarItem
                icon={Pencil}
                label="Pizarra Dibujo"
                isActive={currentView === 'sketchpad'}
                onClick={() => { setCurrentView('sketchpad'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={600}
              />
              <SidebarItem
                icon={Share2}
                label="Diagramas UML"
                isActive={currentView === 'uml'}
                onClick={() => { setCurrentView('uml'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={610}
              />
              <SidebarItem
                icon={Check}
                label="Pizarra Checklist"
                isActive={currentView === 'checklist'}
                onClick={() => { setCurrentView('checklist'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={625}
              />
              <SidebarItem
                icon={Link}
                label="Integraciones"
                isActive={currentView === 'integrations'}
                onClick={() => { setCurrentView('integrations'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                delay={640}
              />
              {(sessionUser?.role === Role.DEVELOPER || sessionUser?.role === Role.SCRUM_MASTER || sessionUser?.role === Role.PRODUCT_OWNER || sessionUser?.role === Role.SYSTEM_ADMIN) && (
                <SidebarItem
                  icon={FileCode}
                  label="Gestor GPT"
                  isActive={currentView === 'ide'}
                  onClick={() => { setCurrentView('ide'); if (window.innerWidth < 768) setSidebarOpen(false); }}
                  delay={650}
                />
              )}
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-6 2xl:p-6 3xl:p-10 4xl:p-24 border-t border-white/10 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4 px-4 py-3 lg:py-4 2xl:py-4 3xl:py-6 rounded-2xl 3xl:rounded-[3rem] hover:bg-white/5 transition-all cursor-pointer group" onClick={() => setShowSettings(true)}>
            <div className="relative">
              <img src={sessionUser?.avatar || "https://ui-avatars.com/api/?name=User"} alt="User" className="w-10 h-10 2xl:w-12 2xl:h-12 3xl:w-20 3xl:h-20 4xl:w-40 4xl:h-40 rounded-full ring-4 ring-white/10 group-hover:ring-[#7b68ee]/50 transition-all shadow-2xl" />
              <div className="absolute bottom-1 right-1 w-3 h-3 2xl:w-4 2xl:h-4 3xl:w-6 3xl:h-6 4xl:w-12 4xl:h-12 bg-green-500 border-2 2xl:border-3 border-[#1e1e2d] rounded-full shadow-lg"></div>
            </div>
            <div className="flex-1 min-w-0 ml-1">
              <p className="text-sm 2xl:text-base 3xl:text-2xl 4xl:text-[3.5rem] font-black text-white truncate group-hover:text-[#7b68ee] transition-colors tracking-tight">{sessionUser?.name}</p>
              <p className="text-[10px] 2xl:text-xs 3xl:text-base 4xl:text-4xl text-gray-400 truncate capitalize font-bold mt-0.5">{sessionUser?.role?.replace('_', ' ')}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="text-gray-500 hover:text-red-400 transition-all p-2 2xl:p-2 3xl:p-4 hover:bg-red-500/10 rounded-xl 3xl:rounded-3xl opacity-0 group-hover:opacity-100 active:scale-95"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 2xl:w-6 2xl:h-6 3xl:w-10 3xl:h-10 4xl:w-20 4xl:h-20" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-[#16171f] transition-all duration-300 ${isSidebarOpen ? 'md:pl-64 lg:pl-72 2xl:pl-72 3xl:pl-80 4xl:pl-[600px]' : 'pl-0'}`}>
        {/* Top Header - ClickUp Style */}
        <header className="h-16 md:h-20 lg:h-24 2xl:h-24 3xl:h-32 4xl:h-48 bg-white/90 dark:bg-[#1e1e2d]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between px-4 md:px-6 lg:px-10 2xl:px-10 3xl:px-16 4xl:px-32 flex-shrink-0 transition-all duration-300 z-10 shadow-[0_1px_10px_rgba(0,0,0,0.05)] dark:shadow-black/20 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-3 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
              title={isSidebarOpen ? "Cerrar barra lateral" : "Abrir barra lateral"}
            >
              <Menu className="w-6 h-6 2xl:w-6 2xl:h-6 3xl:w-8 3xl:h-8 4xl:w-14 4xl:h-14" />
            </button>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchMobileOpen(!isSearchMobileOpen)}
              className="md:hidden p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all active:scale-95"
            >
              <Search className="w-6 h-6" />
            </button>

            {/* Breadcrumbs (Simulated) */}
            <div className="hidden md:flex items-center gap-3 text-base 2xl:text-base 3xl:text-xl 4xl:text-5xl text-gray-500 dark:text-gray-400">
              <span className="hover:text-[#7b68ee] cursor-pointer transition-colors font-medium">PIG 2026</span>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <span className="font-medium text-gray-900 dark:text-white hover:text-[#7b68ee] cursor-pointer transition-colors capitalize">
                {currentView === 'home' ? 'Inicio' :
                  currentView === 'dashboards' ? 'Dashboards' :
                    currentView === 'whiteboards' ? 'Whiteboards' :
                      currentView === 'sketchpad' ? 'Pizarra Dibujo' :
                        currentView === 'uml' ? 'Diagramas UML' :
                          currentView === 'requirements' ? 'Pizarra de Requerimientos' :
                            currentView === 'checklist' ? 'Pizarra Checklist' :
                              currentView === 'inbox' ? 'Inbox' :
                                currentView === 'chat' ? 'Chat' :
                                  currentView === 'team' ? 'Teams' :
                                    currentView === 'docs' ? 'Hitos & Artefactos' :
                                      currentView === 'clips' ? 'Clips' :
                                        currentView === 'recordings' ? 'Grabaciones' :
                                          currentView === 'timesheets' ? 'Timesheets' :
                                            currentView === 'more' ? 'Más' :
                                              currentView}
              </span>
            </div>

            {/* Central Search Bar */}
            <div
              className={`${isSearchMobileOpen ? 'absolute top-full left-0 w-full p-4 bg-white/95 dark:bg-[#1e1e2d]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-2xl z-50 animate-in slide-in-from-top-5 block' : 'hidden'} md:block md:static md:w-full md:max-w-lg 2xl:max-w-lg 3xl:max-w-2xl 4xl:max-w-3xl md:mx-8 md:p-0 md:bg-transparent md:border-none md:shadow-none`}
              ref={searchContainerRef}
            >
              <div className={`flex items-center gap-3 bg-gray-100/50 dark:bg-white/5 border ${isSearchFocused ? 'border-[#7b68ee]/50 bg-white dark:bg-white/10 shadow-lg shadow-[#7b68ee]/10' : 'border-transparent'} rounded-2xl px-5 py-3 2xl:py-3 3xl:py-6 4xl:py-10 w-full transition-all duration-300`}>
                <Search className={`w-5 h-5 2xl:w-6 2xl:h-6 3xl:w-10 3xl:h-10 4xl:w-14 4xl:h-14 transition-colors ${isSearchFocused ? 'text-[#7b68ee]' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    if (!isSearchFocused) setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Buscar proyectos, tareas, personas..."
                  className="bg-transparent border-none focus:outline-none text-sm 2xl:text-sm 3xl:text-2xl 4xl:text-4xl text-gray-700 dark:text-gray-200 w-full placeholder-gray-400 font-medium"
                />

                {/* Desktop Shortcut Hints */}
                <div className="hidden md:flex gap-2">
                  <span className="text-[10px] 2xl:text-xs 3xl:text-lg 4xl:text-2xl bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded-lg text-gray-500 dark:text-gray-400 font-mono border border-gray-200 dark:border-white/5">Ctrl</span>
                  <span className="text-[10px] 2xl:text-xs 3xl:text-lg 4xl:text-2xl bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded-lg text-gray-500 dark:text-gray-400 font-mono border border-gray-200 dark:border-white/5">K</span>
                </div>

                {/* Mobile Close Button */}
                {isSearchMobileOpen && (
                  <button onClick={() => setIsSearchMobileOpen(false)} className="md:hidden p-1 text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {isSearchFocused && globalSearchQuery.trim() && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 dark:bg-[#1e1e2d]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-4">

                    {/* Empty State */}
                    {Object.values(searchResults).every((arr: any) => arr.length === 0) && (
                      <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 animate-pulse">
                          <Search className="w-8 h-8 opacity-40" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Sin resultados</h3>
                        <p className="text-xs text-gray-500 max-w-[200px]">No encontramos coincidencias para "{globalSearchQuery}"</p>
                      </div>
                    )}

                    {/* Views */}
                    {searchResults.views.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                          <LayoutDashboard className="w-3 h-3" /> Navegación
                        </h3>
                        <div className="space-y-1">
                          {searchResults.views.map((view: any) => (
                            <div key={view.id} onClick={() => handleSearchResultClick('view', view)} className="flex items-center gap-3 p-2.5 hover:bg-[#7b68ee]/10 dark:hover:bg-[#7b68ee]/20 rounded-lg cursor-pointer group transition-all duration-200 border border-transparent hover:border-[#7b68ee]/20">
                              <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-md text-gray-500 group-hover:text-[#7b68ee] group-hover:bg-white dark:group-hover:bg-white/10 transition-colors shadow-sm">
                                <view.icon className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-[#7b68ee] transition-colors">{view.label}</span>
                              <span className="ml-auto text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Ir a vista</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {searchResults.projects.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                          <FolderKanban className="w-3 h-3" /> Proyectos
                        </h3>
                        <div className="space-y-1">
                          {searchResults.projects.map(project => (
                            <div key={project.id} onClick={() => handleSearchResultClick('project', project)} className="flex items-center gap-3 p-2.5 hover:bg-[#7b68ee]/10 dark:hover:bg-[#7b68ee]/20 rounded-lg cursor-pointer group transition-all duration-200 border border-transparent hover:border-[#7b68ee]/20">
                              <div className="w-1.5 h-8 rounded-full bg-[#7b68ee] shadow-[0_0_8px_#7b68ee]"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-[#7b68ee] transition-colors truncate">{project.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{project.key || 'PRJ'}</p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-4 h-4 text-[#7b68ee]" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    {searchResults.tasks.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                          <Check className="w-3 h-3" /> Tareas
                        </h3>
                        <div className="space-y-1">
                          {searchResults.tasks.map(task => (
                            <div key={task.id} onClick={() => handleSearchResultClick('task', task)} className="flex items-start gap-3 p-2.5 hover:bg-[#7b68ee]/10 dark:hover:bg-[#7b68ee]/20 rounded-lg cursor-pointer group transition-all duration-200 border border-transparent hover:border-[#7b68ee]/20">
                              <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 ${task.priority === 'critical' ? 'bg-red-500 shadow-red-500/50' :
                                task.priority === 'high' ? 'bg-orange-500 shadow-orange-500/50' :
                                  task.priority === 'medium' ? 'bg-blue-500 shadow-blue-500/50' : 'bg-gray-400'
                                }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-[#7b68ee] transition-colors">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-mono bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5">{task.id}</span>
                                  <span className="text-[10px] text-gray-400 capitalize flex items-center gap-1">
                                    {task.status === 'DONE' ? <Check className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3" />}
                                    {task.status.replace('_', ' ').toLowerCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Personas</h3>
                        {searchResults.users.map(user => (
                          <div key={user.id} onClick={() => handleSearchResultClick('user', user)} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer group">
                            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-[#7b68ee] transition-colors">{user.name}</p>
                              <p className="text-[10px] text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sprints */}
                    {searchResults.sprints.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">Sprints</h3>
                        {searchResults.sprints.map(sprint => (
                          <div key={sprint.id} onClick={() => handleSearchResultClick('sprint', sprint)} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer group">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-md text-purple-600">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-[#7b68ee] transition-colors">{sprint.name}</p>
                              <p className="text-[10px] text-gray-400">{new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 px-3 py-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                    <span>{Object.values(searchResults).flat().length} resultados encontrados</span>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1"><span className="bg-gray-200 dark:bg-white/10 px-1 rounded">↑</span> <span className="bg-gray-200 dark:bg-white/10 px-1 rounded">↓</span> navegar</span>
                      <span className="flex items-center gap-1"><span className="bg-gray-200 dark:bg-white/10 px-1 rounded">↵</span> seleccionar</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            {/* Quick Action Button */}
            <button
              onClick={() => setTaskWizardOpen(true)}
              className="hidden md:flex items-center gap-2 bg-[#7b68ee] hover:bg-[#6a5acd] text-white px-5 py-2.5 2xl:px-8 2xl:py-4 3xl:px-12 3xl:py-8 4xl:px-16 4xl:py-12 rounded-xl text-sm 2xl:text-xl 3xl:text-3xl 4xl:text-5xl font-black shadow-lg shadow-[#7b68ee]/30 transition-all active:scale-95 btn-shine"
            >
              <span className="text-xl 2xl:text-3xl 3xl:text-5xl 4xl:text-7xl leading-none">+</span>
              <span>Nuevo</span>
            </button>

            {/* Mobile Quick Action FAB */}
            <button
              onClick={() => setTaskWizardOpen(true)}
              className="md:hidden fixed bottom-6 right-6 z-50 bg-[#7b68ee] text-white p-4 rounded-full shadow-2xl shadow-[#7b68ee]/40 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>

            <div className="hidden md:block h-8 2xl:h-12 3xl:h-20 4xl:h-28 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 text-gray-400 hover:text-[#7b68ee] transition-all rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95"
              title={darkMode ? "Modo Claro" : "Modo Oscuro"}
            >
              {darkMode ? <Sun className="w-5 h-5 2xl:w-8 2xl:h-8 3xl:w-12 3xl:h-12 4xl:w-16 4xl:h-16" /> : <Moon className="w-5 h-5 2xl:w-8 2xl:h-8 3xl:w-12 3xl:h-12 4xl:w-16 4xl:h-16" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 transition-all rounded-xl active:scale-95 ${showNotifications ? 'bg-[#7b68ee]/10 text-[#7b68ee]' : 'text-gray-400 hover:text-[#7b68ee] hover:bg-gray-100 dark:hover:bg-white/5'}`}
              >
                <Bell className="w-5 h-5 2xl:w-8 2xl:h-8 3xl:w-12 3xl:h-12 4xl:w-16 4xl:h-16" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-3 h-3 2xl:w-4 2xl:h-4 3xl:w-6 3xl:h-6 4xl:w-8 4xl:h-8 bg-[#e03131] rounded-full border-2 border-white dark:border-[#1e1e2d] shadow-sm"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-[#1e1e2d]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                  <div className="p-3 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <h3 className="font-bold text-xs text-gray-800 dark:text-white uppercase tracking-wider">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-[#7b68ee] hover:underline"
                      >
                        MARCAR LEÍDAS
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">No tienes notificaciones</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 border-b border-gray-50 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!n.read ? 'bg-[#7b68ee]/5 dark:bg-[#7b68ee]/10' : ''}`}>
                          <div className="flex gap-3">
                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-[#7b68ee]' : 'bg-gray-300 dark:bg-gray-600'}`} />
                            <div>
                              <p className={`text-xs ${!n.read ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                {n.text}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 text-center border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={() => { setShowNotifications(false); setShowNotificationCenter(true); }}
                      className="text-xs font-medium text-gray-500 hover:text-[#7b68ee] transition-colors"
                    >
                      Ver todas
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block h-8 2xl:h-12 3xl:h-20 4xl:h-28 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>

            <button
              onClick={() => setShowSettings(true)}
              className="hidden md:flex items-center gap-3 text-sm 2xl:text-xl 3xl:text-3xl 4xl:text-5xl font-black text-gray-500 dark:text-gray-400 hover:text-[#7b68ee] hover:bg-gray-100 dark:hover:bg-white/5 px-5 py-2.5 2xl:px-8 2xl:py-4 3xl:px-12 3xl:py-8 4xl:px-16 4xl:py-12 rounded-xl transition-all active:scale-95"
            >
              <Settings className="w-5 h-5 2xl:w-8 2xl:h-8 3xl:w-12 3xl:h-12 4xl:w-16 4xl:h-16 animate-spin-slow" />
              <span>Ajustes</span>
            </button>

            {/* Mobile Settings Icon */}
            <button
              onClick={() => setShowSettings(true)}
              className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-[#7b68ee]"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </header>



        {/* Feature Specific Banners */}
        {currentView === 'home' && showAIPrompt && (
          <div className="mx-4 md:mx-6 lg:mx-10 2xl:mx-16 3xl:mx-20 4xl:mx-32 mt-4 md:mt-6 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-gradient-to-r from-[#7b68ee] to-indigo-600 rounded-[2.5rem] p-4 md:p-6 3xl:p-12 shadow-2xl shadow-[#7b68ee]/30 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl 2xl:text-4xl font-black text-white tracking-tighter uppercase">Preparación IA Lista</h3>
                    <p className="text-sm 2xl:text-xl text-white/80 font-medium">He analizado tus commits y mensajes de ayer. Tu resumen para la Daily está listo.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowAIPrompt(false)}
                    className="px-6 py-3 text-white/60 hover:text-white font-black text-xs uppercase tracking-widest transition-colors"
                  >
                    Ignorar
                  </button>
                  <button
                    onClick={() => { setCurrentView('standup'); setShowAIPrompt(false); }}
                    className="px-8 py-4 bg-white text-[#7b68ee] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    Ver Resumen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Content */}
        {/* View Content */}
        <div className="flex-1 overflow-auto bg-[#f9f9f9] dark:bg-[#16171f] relative transition-colors duration-200" key={currentView}>
          <div className="h-full animate-in fade-in-up duration-500 ease-out">
            {currentView === 'home' && (
              <HomeView
                tasks={tasks}
                currentUser={sessionUser}
                onNewTask={() => setTaskWizardOpen(true)}
                onStartMeeting={() => setCurrentView('meeting')}
                onCreateDoc={() => setCurrentView('docs')}
                onNavigateTo={(view) => setCurrentView(view)}
                onOpenTask={() => setCurrentView('board')}
              />
            )}
            {/* ... other views ... */}
            {/* ... other views ... */}
            {currentView === 'inbox' && <InboxView notifications={notifications} />}
            {currentView === 'chat' && (
              <TeamChat
                currentUser={sessionUser}
                users={users}
                onNavigateToMeeting={() => setCurrentView('meeting')}
                onNavigateToHome={() => setCurrentView('home')}
              />
            )}
            {currentView === 'team' && (
              <Team
                users={users}
                currentUser={sessionUser}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                highlightedUserId={highlightedUserId}
                onClearHighlight={() => setHighlightedUserId(null)}
              />
            )}
            {currentView === 'docs' && <ArtifactRepository />}
            {currentView === 'whiteboards' && <Whiteboards />}
            {currentView === 'sketchpad' && <Sketchpad currentUser={sessionUser} isSidebarOpen={isSidebarOpen} />}
            {currentView === 'uml' && <EnhancedUML />}
            {currentView === 'ide' && (sessionUser?.role === Role.DEVELOPER || sessionUser?.role === Role.SCRUM_MASTER || sessionUser?.role === Role.PRODUCT_OWNER || sessionUser?.role === Role.SYSTEM_ADMIN) && <GestorGPT isDarkMode={darkMode} />}
            {currentView === 'dashboards' && (
              activeSprint ? (
                <Dashboard
                  tasks={tasks}
                  users={users}
                  projects={projects}
                  sprints={sprints}
                  activeSprint={activeSprint}
                  currentUser={sessionUser}
                  onTaskUpdate={(taskId, status) => updateTaskStatus(taskId, status as TaskStatus)}
                  onNavigateTo={(view) => setCurrentView(view as View)}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  No hay sprints activos o definidos.
                </div>
              )
            )}
            {currentView === 'requirements' && <RequirementBoard />}
            {currentView === 'checklist' && <ChecklistBoard />}
            {currentView === 'backlog' && (
              <BacklogView
                tasks={tasks}
                users={users}
                sprints={sprints}
                activeSprintId={activeSprint?.id}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddSprint={handleAddSprint}
                onUpdateSprint={handleUpdateSprint}
                onDeleteSprint={handleDeleteSprint}
              />
            )}
            {currentView === 'roadmap' && (
              <RoadmapView
                items={roadmapItems}
                onAddItem={handleAddRoadmapItem}
                onUpdateItem={handleUpdateRoadmapItem}
                onDeleteItem={handleDeleteRoadmapItem}
              />
            )}
            {currentView === 'retrospective' && (
              <RetrospectiveView
                items={retroItems}
                onAddItem={handleAddRetroItem}
                onUpdateItem={handleUpdateRetroItem}
                onDeleteItem={handleDeleteRetroItem}
                onClearItems={handleClearRetroItems}
              />
            )}
            {currentView === 'standup' && sessionUser && (
              <DailyStandup
                users={users}
                tasks={tasks}
                currentUser={sessionUser}
                onClose={() => setCurrentView('home')}
              />
            )}
            {currentView === 'clips' && <Clips />}
            {currentView === 'recordings' && <RecordingsRepository onSummarize={(name) => setPendingAIQuery(`Resume la reunión: ${name}`)} />}
            {currentView === 'integrations' && <IntegrationsView />}
            {currentView === 'timesheets' && <TimesheetsView />}
            {currentView === 'more' && <More />}

            {currentView === 'board' && (
              activeSprint ? (
                <ScrumBoard
                  tasks={tasks.filter(t => t.sprintId === activeSprint.id)}
                  users={users}
                  currentUser={sessionUser}
                  onUpdateTaskStatus={updateTaskStatus}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                  highlightedTaskId={highlightedTaskId}
                  onClearHighlight={() => setHighlightedTaskId(null)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  No hay sprints activos para mostrar el tablero.
                </div>
              )
            )}

            {currentView === 'projects' && (
              <Projects
                projects={projects}
                users={users}
                currentUser={sessionUser}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
              />
            )}

            {currentView === 'calendar' && (
              <CalendarView sprints={sprints} tasks={tasks} currentUser={sessionUser} />
            )}

            {currentView === 'meeting' && (
              <MeetingRoom
                currentUser={sessionUser}
                users={users}
                onLeave={() => setCurrentView('home')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Task Wizard Modal */}
      {
        sessionUser && activeSprint && (
          <TaskWizard
            isOpen={isTaskWizardOpen}
            onClose={() => setTaskWizardOpen(false)}
            onSubmit={async (task) => {
              await handleAddTask(task);
              setTaskWizardOpen(false);
            }}
            users={users}
            currentUser={sessionUser}
            activeSprint={activeSprint}
          />
        )
      }

      {/* AI Assistant */}
      <AIChatbot
        tasks={tasks}
        sprints={sprints}
        users={users}
        projects={projects}
        roadmapItems={roadmapItems}
        retroItems={retroItems}
        currentUser={sessionUser}
        externalQuery={pendingAIQuery}
        onQueryHandled={() => setPendingAIQuery(null)}
      />

      <div className="border-gradient" /> {/* Visual Effect */}
      {/* Notification Center Modal */}
      {
        showNotificationCenter && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500"
              onClick={() => setShowNotificationCenter(false)}
            />

            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden border border-white/50 dark:border-white/10 transform transition-all animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 ease-out flex flex-col max-h-[85vh]">
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b68ee]/10 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />

              {/* Header */}
              <div className="relative px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 rounded-2xl text-[#7b68ee]">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-wider">Centro de Notificaciones</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gestión de alertas en tiempo real</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationCenter(false)}
                  className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="px-8 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                  {(['all', 'unread', 'alert'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setNotificationFilter(filter)}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${notificationFilter === filter
                        ? 'bg-white dark:bg-[#7b68ee] text-[#7b68ee] dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                      {filter === 'all' ? 'Todas' : filter === 'unread' ? 'No leídas' : 'Alertas'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={markAllRead}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl transition-all active:scale-95"
                  >
                    Marcar leído
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all active:scale-95"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
                {getFilteredNotifications().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Bell className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Perímetro despejado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredNotifications().map(n => (
                      <div key={n.id} className={`p-5 rounded-3xl flex gap-5 border transition-all ${!n.read
                        ? 'bg-[#7b68ee]/5 dark:bg-[#7b68ee]/10 border-[#7b68ee]/20 dark:border-[#7b68ee]/30'
                        : 'bg-white dark:bg-white/[0.02] border-slate-100 dark:border-white/5 opacity-70'}`}>
                        <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${n.type === 'alert' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' :
                          n.type === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                          }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <p className={`text-sm tracking-tight ${!n.read ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                              {n.text}
                            </p>
                            <span className="text-[10px] font-black text-slate-400 whitespace-nowrap ml-4 mt-0.5">{n.time}</span>
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                            {n.type === 'alert' ? 'Prioridad de Misión' : 'Comunicación del Sistema'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 text-center shrink-0">
                <button
                  onClick={() => setShowNotificationCenter(false)}
                  className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#7b68ee] transition-colors"
                >
                  Finalizar Revisión
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Settings Modal */}
      {
        showSettings && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500"
              onClick={() => setShowSettings(false)}
            />

            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden border border-white/50 dark:border-white/10 transform transition-all animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 ease-out flex flex-col max-h-[90vh]">
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b68ee]/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />

              {/* Modal Header */}
              <div className="relative px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-600 dark:text-slate-300">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-wider">Configuración</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Preferencias generales y perfil</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                {/* Profile Section */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Perfil de Usuario</h4>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Nombre Visible</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <UserIcon className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#7b68ee]" />
                        </div>
                        <input
                          type="text"
                          value={settingsForm.userName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, userName: e.target.value })}
                          className="block w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Correo Electrónico</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-[#7b68ee]" />
                        </div>
                        <input
                          type="email"
                          value={settingsForm.email}
                          onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                          className="block w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-white/5"></div>

                {/* App Preferences */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Preferencias de Aplicación</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:border-[#7b68ee]/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white dark:bg-white/5 rounded-xl shadow-sm">
                          <Bell className="w-5 h-5 text-[#7b68ee]" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Notificaciones por Email</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Resumen diario activo</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, emailNotifications: !settingsForm.emailNotifications })}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ${settingsForm.emailNotifications ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${settingsForm.emailNotifications ? 'translate-x-[26px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Idioma de Interfaz</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Globe className="h-5 w-5 text-slate-400" />
                        </div>
                        <select
                          value={settingsForm.language}
                          onChange={(e) => setSettingsForm({ ...settingsForm, language: e.target.value })}
                          className="block w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white text-sm font-bold focus:outline-none appearance-none cursor-pointer hover:border-[#7b68ee]/30 transition-all"
                        >
                          <option value="es">Español (Latinoamérica)</option>
                          <option value="en">English (US)</option>
                          <option value="pt">Português (Brasil)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-6 py-4 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-[#7b68ee]/30 transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default App;
