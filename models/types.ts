export enum Role {
  SCRUM_MASTER = 'Scrum Master',
  PRODUCT_OWNER = 'Product Owner',
  DEVELOPER = 'Desarrollador',
  SYSTEM_ADMIN = 'Administrador del Sistema'
}

export enum IncidentSeverity {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export enum IncidentStatus {
  OPEN = 'Abierto',
  IN_PROGRESS = 'En Progreso',
  RESOLVED = 'Resuelto',
  CLOSED = 'Cerrado'
}

export enum TaskStatus {
  BACKLOG = 'Backlog',
  TODO = 'Por Hacer',
  IN_PROGRESS = 'En Progreso',
  REVIEW = 'Revisión',
  DONE = 'Hecho'
}

export enum Priority {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
  CRITICAL = 'Crítica'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  email: string;
  password?: string; // Optional for safety when displaying, but needed for auth
  status?: 'active' | 'suspended';
  lastLogin?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  sprintId: string;
  points: number;
  dueDate?: string; // ISO Date String
  isBlocked?: boolean;
  blockerReason?: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
  status: 'Active' | 'Planned' | 'Completed';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Attachment {
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: string;
  mimeType?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface TeamChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  readBy: string[];
  reactions?: Reaction[];
  isEdited?: boolean;
  replyToId?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'dm';
  members?: string[];
  description?: string;
  isStarred?: boolean;
  lastActivity?: Date;
}

export interface PersonalNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  isCompleted?: boolean;
  timeEstimate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  createdAt: string;
  assignedTo?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  defaultValues: Partial<Task>;
  icon: any;
  estimatedPoints: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentions: string[];
  createdAt: string;
  isEdited?: boolean;
}

export enum TaskActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  COMMENTED = 'commented',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned'
}

export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: TaskActivityAction;
  details: string;
  timestamp: string;
}

export interface CollaborationNotification {
  id: string;
  userId: string;
  type: 'mention' | 'assignment' | 'update';
  taskId: string;
  triggeredBy: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  category: 'Frontend' | 'Backend' | 'Design' | 'Marketing';
  status: 'Planned' | 'In Progress' | 'Completed' | 'Delayed';
}

export interface RetroItem {
  id: string;
  content: string;
  type: 'start' | 'stop' | 'continue';
  votes: number;
}
