import { Task, Sprint, User, TaskStatus, Priority } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ReportData {
  tasks: Task[];
  sprints: Sprint[];
  users: User[];
  currentUser: User | null;
}

export class ReportService {

  /**
   * Genera un reporte CSV de datos limpios para integración con otras herramientas
   */
  static generateProfessionalCSV(data: ReportData): string {
    const { tasks, sprints, users } = data;
    const activeSprint = sprints.find(s => s.status === 'Active') || sprints[0];

    // Construir CSV Tabular (Solo Datos)
    let csv = '\ufeff'; // UTF-8 BOM

    // Encabezados
    csv += 'ID,Sprint,Título,Estado,Prioridad,Puntos,Asignado A,Rol,Fecha Límite,Días Restantes\n';

    const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);

    sprintTasks.forEach(task => {
      const assignee = users.find(u => u.id === task.assigneeId);
      const daysRemaining = task.dueDate ? this.calculateDaysRemaining(task.dueDate) : 'N/A';
      const dueDateFormatted = task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '';

      const row = [
        task.id,
        `"${activeSprint?.name || ''}"`,
        `"${this.escapeCSV(task.title)}"`,
        task.status,
        task.priority,
        task.points,
        `"${assignee?.name || 'Sin asignar'}"`,
        `"${assignee?.role || ''}"`,
        dueDateFormatted,
        daysRemaining
      ];

      csv += row.join(',') + '\n';
    });

    return csv;
  }

  /**
   * Calcula estadísticas del sprint
   */
  private static calculateStatistics(tasks: Task[], activeSprint?: Sprint) {
    const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
    const totalTasks = sprintTasks.length;
    const totalPoints = sprintTasks.reduce((sum, t) => sum + t.points, 0);

    const byStatus = {
      [TaskStatus.TODO]: sprintTasks.filter(t => t.status === TaskStatus.TODO).length,
      [TaskStatus.IN_PROGRESS]: sprintTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      [TaskStatus.REVIEW]: sprintTasks.filter(t => t.status === TaskStatus.REVIEW).length,
      [TaskStatus.DONE]: sprintTasks.filter(t => t.status === TaskStatus.DONE).length,
    };

    const byPriority = {
      [Priority.LOW]: sprintTasks.filter(t => t.priority === Priority.LOW).length,
      [Priority.MEDIUM]: sprintTasks.filter(t => t.priority === Priority.MEDIUM).length,
      [Priority.HIGH]: sprintTasks.filter(t => t.priority === Priority.HIGH).length,
      [Priority.CRITICAL]: sprintTasks.filter(t => t.priority === Priority.CRITICAL).length,
    };

    const done = byStatus[TaskStatus.DONE];
    const completedPoints = sprintTasks.filter(t => t.status === TaskStatus.DONE).reduce((sum, t) => sum + t.points, 0);
    const pendingPoints = totalPoints - completedPoints;

    const now = new Date();
    const overdue = sprintTasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE
    ).length;

    const progressPercentage = totalTasks > 0 ? (done / totalTasks * 100) : 0;
    const completionRate = totalPoints > 0 ? (completedPoints / totalPoints * 100) : 0;
    const velocity = completedPoints;

    // Calcular burndown
    const idealBurndown = totalPoints;
    const actualBurndown = pendingPoints;
    const deviation = actualBurndown - (idealBurndown * 0.5); // Asumiendo 50% del sprint

    return {
      totalTasks,
      totalPoints,
      byStatus,
      byPriority,
      done,
      completedPoints,
      pendingPoints,
      overdue,
      progressPercentage,
      completionRate,
      velocity,
      idealBurndown,
      actualBurndown,
      deviation
    };
  }

  /**
   * Obtiene estadísticas por usuario
   */
  private static getUserStatistics(tasks: Task[], users: User[], activeSprint?: Sprint) {
    return users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id && t.sprintId === activeSprint?.id);
      const totalTasks = userTasks.length;
      const totalPoints = userTasks.reduce((sum, t) => sum + t.points, 0);
      const completedTasks = userTasks.filter(t => t.status === TaskStatus.DONE).length;

      return {
        name: user.name,
        role: user.role,
        totalTasks,
        totalPoints,
        completedTasks
      };
    }).filter(stat => stat.totalTasks > 0); // Solo usuarios con tareas asignadas
  }

  /**
   * Calcula días restantes hasta la fecha límite
   */
  private static calculateDaysRemaining(dueDate: string): number | string {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'VENCIDA';
    return diffDays;
  }

  /**
   * Determina el estado general del sprint
   */
  private static getOverallStatus(stats: any): string {
    if (stats.progressPercentage >= 80) return '✓ Excelente - En camino al objetivo';
    if (stats.progressPercentage >= 60) return '○ Bueno - Progreso adecuado';
    if (stats.progressPercentage >= 40) return '△ Moderado - Requiere atención';
    if (stats.progressPercentage >= 20) return '⚠ En riesgo - Acción necesaria';
    return '✗ Crítico - Intervención urgente';
  }

  /**
   * Escapa caracteres especiales en CSV
   */
  private static escapeCSV(text: string): string {
    return text.replace(/"/g, '""');
  }

  /**
   * Descarga el CSV generado
   */
  static downloadCSV(content: string, filename?: string) {
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd');
    const timeStr = format(now, 'HHmm');
    const defaultFilename = `Reporte_Scrum_Profesional_${dateStr}_${timeStr}.csv`;

    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM for Excel
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || defaultFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}