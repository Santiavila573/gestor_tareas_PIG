import { Priority, Project, Role, Sprint, Task, TaskStatus, User, IncidentSeverity, IncidentStatus, Incident } from './types';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Chen', role: Role.SCRUM_MASTER, avatar: 'https://picsum.photos/100/100?random=1', email: 'alex@example.com', password: 'password123', status: 'active', lastLogin: '2025-11-10T08:30:00Z' },
  { id: 'u2', name: 'Sarah Jones', role: Role.PRODUCT_OWNER, avatar: 'https://picsum.photos/100/100?random=2', email: 'sarah@example.com', password: 'password123', status: 'active', lastLogin: '2025-11-10T09:00:00Z' },
  { id: 'u3', name: 'Mike Ross', role: Role.DEVELOPER, avatar: 'https://picsum.photos/100/100?random=3', email: 'mike@example.com', password: 'password123', status: 'active', lastLogin: '2025-11-09T17:45:00Z' },
  { id: 'u4', name: 'Emily Blunt', role: Role.DEVELOPER, avatar: 'https://picsum.photos/100/100?random=4', email: 'emily@example.com', password: 'password123', status: 'suspended', lastLogin: '2025-11-01T10:00:00Z' },
  { id: 'u5', name: 'Admin User', role: Role.SYSTEM_ADMIN, avatar: 'https://picsum.photos/100/100?random=5', email: 'admin@example.com', password: 'password123', status: 'active', lastLogin: '2025-11-10T10:00:00Z' },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Rediseño Plataforma E-Commerce', description: 'Migración de monolito legado a microservicios.', ownerId: 'u2' },
];

export const MOCK_SPRINTS: Sprint[] = [
  { id: 's1', name: 'Sprint 10: API Núcleo', startDate: '2025-11-01', endDate: '2025-11-14', goal: 'Establecer endpoints base de autenticación', status: 'Completed' },
  { id: 's2', name: 'Sprint 11: Flujo de Pago', startDate: '2025-12-01', endDate: '2025-12-15', goal: 'Implementar integración con Stripe', status: 'Active' },
];

export const MOCK_TASKS: Task[] = [
  // Developer tasks - Technical implementation
  { id: 't1', title: 'Diseñar Esquema de Base de Datos', description: 'Crear ERD para usuarios y pedidos', status: TaskStatus.DONE, priority: Priority.HIGH, assigneeId: 'u3', sprintId: 's1', points: 5 },
  { id: 't2', title: 'Implementar API de Login', description: 'Implementación de autenticación JWT', status: TaskStatus.REVIEW, priority: Priority.CRITICAL, assigneeId: 'u3', sprintId: 's2', points: 8, dueDate: '2025-12-14' },
  { id: 't3', title: 'Crear UI de Checkout', description: 'Componentes React para revisión del carrito', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, assigneeId: 'u4', sprintId: 's2', points: 5, dueDate: '2025-12-20' },
  { id: 't4', title: 'Integrar Webhooks de Stripe', description: 'Manejar eventos de éxito de pago', status: TaskStatus.TODO, priority: Priority.HIGH, assigneeId: 'u3', sprintId: 's2', points: 5, dueDate: '2025-12-10' }, // Overdue
  { id: 't5', title: 'Actualizar UI Perfil Usuario', description: 'Permitir a usuarios cambiar avatar', status: TaskStatus.TODO, priority: Priority.LOW, assigneeId: 'u4', sprintId: 's2', points: 2 },
  { id: 't6', title: 'Implementar Tests Unitarios API', description: 'Crear suite de tests con Jest para endpoints', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, assigneeId: 'u4', sprintId: 's2', points: 3 },

  // Scrum Master tasks - Facilitation and process improvement
  { id: 't7', title: 'Facilitar Daily Standup', description: 'Organizar y moderar reunión diaria del equipo', status: TaskStatus.DONE, priority: Priority.MEDIUM, assigneeId: 'u1', sprintId: 's2', points: 1 },
  { id: 't8', title: 'Resolver Impedimento: Acceso Base de Datos', description: 'Coordinar con DevOps para otorgar permisos de BD al equipo', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, assigneeId: 'u1', sprintId: 's2', points: 2, dueDate: '2025-12-15' },
  { id: 't9', title: 'Preparar Sprint Retrospective', description: 'Crear agenda y actividades para retrospectiva del Sprint 11', status: TaskStatus.TODO, priority: Priority.MEDIUM, assigneeId: 'u1', sprintId: 's2', points: 2 },

  // Product Owner tasks - Requirements and backlog management
  { id: 't10', title: 'Definir Criterios de Aceptación - Checkout', description: 'Especificar criterios detallados para validar flujo de pago', status: TaskStatus.DONE, priority: Priority.HIGH, assigneeId: 'u2', sprintId: 's2', points: 3 },
  { id: 't11', title: 'Priorizar Backlog Sprint 12', description: 'Revisar y ordenar historias de usuario para próximo sprint', status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, assigneeId: 'u2', sprintId: 's2', points: 5, dueDate: '2025-12-16' },
  { id: 't12', title: 'Validar Historias de Usuario con Stakeholders', description: 'Reunión con cliente para validar requisitos de notificaciones', status: TaskStatus.TODO, priority: Priority.MEDIUM, assigneeId: 'u2', sprintId: 's2', points: 3, dueDate: '2025-12-18' },
];

export const MOCK_ADMIN_KPIS = {
  systemUptime: 99.99,
  activeIncidents: 3,
  incidentMTTR: 45,
  securityAlertsToday: 12,
  complianceScore: 92
};

export const MOCK_INCIDENTS: Incident[] = [
  { id: 'inc1', title: 'Database Latency Spike', description: 'High latency observed in the primary database cluster affecting query performance.', severity: IncidentSeverity.HIGH, status: IncidentStatus.OPEN, createdAt: '2025-11-10T10:00:00Z', assignedTo: 'u3' },
  { id: 'inc2', title: 'API Rate Limit Exceeded', description: 'Multiple clients reporting 429 Too Many Requests errors during peak hours.', severity: IncidentSeverity.MEDIUM, status: IncidentStatus.RESOLVED, createdAt: '2025-11-09T14:30:00Z', assignedTo: 'u4' }
];

export const MOCK_SYSTEM_METRICS = [
  { timestamp: '2025-11-10T10:00:00Z', cpuUsage: 45, memoryUsage: 60, requestsPerMinute: 1200 },
  { timestamp: '2025-11-10T10:05:00Z', cpuUsage: 50, memoryUsage: 62, requestsPerMinute: 1300 },
  { timestamp: '2025-11-10T10:10:00Z', cpuUsage: 55, memoryUsage: 65, requestsPerMinute: 1500 },
  { timestamp: '2025-11-10T10:15:00Z', cpuUsage: 48, memoryUsage: 61, requestsPerMinute: 1250 }
];

export const MOCK_AUDIT_LOGS = [
  { id: 'log1', action: 'Inicio de Sesión', userId: 'u1', timestamp: '2025-11-10T09:00:00Z', ipAddress: '192.168.1.1', userAgent: 'Chrome/120.0', success: true, details: 'Login successful via email' },
  { id: 'log2', action: 'Project Created', userId: 'u2', timestamp: '2025-11-10T09:30:00Z', ipAddress: '192.168.1.2', userAgent: 'Firefox/120.0', success: true, details: 'Created project "E-Commerce Refactor"' },
  { id: 'log3', action: 'Inicio de Sesión', userId: 'u4', timestamp: '2025-11-10T10:00:00Z', ipAddress: '10.0.0.5', userAgent: 'Safari/17.0', success: false, details: 'Invalid password attempt' }
];

export const MOCK_COMPLIANCE_AUDITS = [
  { id: 'audit1', standard: 'ISO 27001', status: 'Passed', lastCheck: '2025-10-01', score: 98, nextAuditDate: '2026-10-01' },
  { id: 'audit2', standard: 'GDPR', status: 'Review Needed', lastCheck: '2025-10-15', score: 85, nextAuditDate: '2025-12-15' }
];

export const MOCK_ARCO_REQUESTS = [
  { id: 'arco1', type: 'Access', status: 'Pending', requesterEmail: 'john.doe@example.com', deadline: '2025-11-20' },
  { id: 'arco2', type: 'Deletion', status: 'Completed', requesterEmail: 'jane.smith@example.com', deadline: '2025-11-10' }
];