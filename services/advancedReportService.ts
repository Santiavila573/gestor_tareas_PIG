import { Task, Sprint, User, TaskStatus, Priority, Project } from '../types';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import * as XLSX from 'xlsx';

export interface ReportData {
    tasks: Task[];
    sprints: Sprint[];
    users: User[];
    projects: Project[];
    currentUser: User | null;
}

/**
 * Servicio avanzado para generar reportes especializados
 */
export class AdvancedReportService {

    /**
     * Genera un reporte de retrospectiva del sprint
     */
    static generateRetrospectiveReport(data: ReportData): void {
        const { tasks, sprints, users, currentUser } = data;
        const activeSprint = sprints.find(s => s.status === 'Active') || sprints[0];
        const now = new Date();

        const workbook = XLSX.utils.book_new();

        // Hoja 1: Resumen de Retrospectiva
        this.createRetrospectiveSummary(workbook, data, activeSprint, now);

        // Hoja 2: ¿Qué salió bien?
        this.createWhatWentWell(workbook, tasks, users, activeSprint);

        // Hoja 3: ¿Qué salió mal?
        this.createWhatWentWrong(workbook, tasks, users, activeSprint, now);

        // Hoja 4: Action Items
        this.createActionItems(workbook, tasks, activeSprint, now);

        const dateStr = format(now, 'yyyy-MM-dd');
        const filename = `Retrospectiva_Sprint_${activeSprint?.name || 'N/A'}_${dateStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
    }

    /**
     * Genera un reporte de análisis de riesgos detallado
     */
    static generateRiskReport(data: ReportData): void {
        const { tasks, sprints, users, currentUser } = data;
        const activeSprint = sprints.find(s => s.status === 'Active') || sprints[0];
        const now = new Date();

        const workbook = XLSX.utils.book_new();

        // Hoja 1: Matriz de Riesgos
        this.createRiskMatrix(workbook, tasks, users, activeSprint, now);

        // Hoja 2: Plan de Mitigación
        this.createMitigationPlan(workbook, tasks, users, activeSprint, now);

        const dateStr = format(now, 'yyyy-MM-dd');
        const filename = `Analisis_Riesgos_${dateStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
    }

    /**
     * Genera un reporte de productividad individual
     */
    static generateProductivityReport(data: ReportData, userId?: string): void {
        const { tasks, sprints, users, currentUser } = data;
        const activeSprint = sprints.find(s => s.status === 'Active') || sprints[0];
        const targetUser = userId ? users.find(u => u.id === userId) : currentUser;
        const now = new Date();

        if (!targetUser) return;

        const workbook = XLSX.utils.book_new();

        // Hoja 1: Métricas Personales
        this.createPersonalMetrics(workbook, tasks, targetUser, activeSprint, now);

        // Hoja 2: Comparativa con el Equipo
        this.createTeamComparison(workbook, tasks, users, targetUser, activeSprint);

        const dateStr = format(now, 'yyyy-MM-dd');
        const filename = `Productividad_${targetUser.name.replace(/\s/g, '_')}_${dateStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
    }

    /**
     * Genera un reporte de bloqueos y dependencias
     */
    static generateBlockersReport(data: ReportData): void {
        const { tasks, sprints, users } = data;
        const activeSprint = sprints.find(s => s.status === 'Active') || sprints[0];
        const now = new Date();

        const workbook = XLSX.utils.book_new();

        // Hoja 1: Bloqueos Activos
        this.createActiveBlockers(workbook, tasks, users, activeSprint, now);

        const dateStr = format(now, 'yyyy-MM-dd');
        const filename = `Bloqueos_Dependencias_${dateStr}.xlsx`;
        XLSX.writeFile(workbook, filename);
    }

    // ===== MÉTODOS PRIVADOS PARA RETROSPECTIVA =====

    private static createRetrospectiveSummary(
        workbook: XLSX.WorkBook,
        data: ReportData,
        activeSprint: Sprint | undefined,
        now: Date
    ): void {
        const { tasks } = data;
        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
        const completedTasks = sprintTasks.filter(t => t.status === TaskStatus.DONE);
        const completedOnTime = completedTasks.filter(t =>
            !t.dueDate || new Date(t.dueDate) >= now
        );

        const summaryData = [
            ['🔄 RETROSPECTIVA DEL SPRINT'],
            [`Sprint: ${activeSprint?.name || 'N/A'}`],
            [`Período: ${activeSprint ? format(new Date(activeSprint.startDate), 'dd/MM/yyyy') : ''} - ${activeSprint ? format(new Date(activeSprint.endDate), 'dd/MM/yyyy') : ''}`],
            [],
            ['RESUMEN GENERAL'],
            ['Métrica', 'Valor', 'Evaluación'],
            ['Tareas Completadas', `${completedTasks.length} / ${sprintTasks.length}`, this.getEvaluation(completedTasks.length / sprintTasks.length)],
            ['Completadas a Tiempo', `${completedOnTime.length} / ${completedTasks.length}`, this.getEvaluation(completedOnTime.length / completedTasks.length)],
            ['Puntos Completados', sprintTasks.filter(t => t.status === TaskStatus.DONE).reduce((sum, t) => sum + t.points, 0), ''],
            ['Velocidad del Sprint', sprintTasks.filter(t => t.status === TaskStatus.DONE).reduce((sum, t) => sum + t.points, 0), ''],
            [],
            ['EVALUACIÓN GENERAL'],
            ['¿Cumplimos el objetivo del sprint?', activeSprint?.goal || 'N/A'],
            ['Nivel de Satisfacción del Equipo', '⭐⭐⭐⭐☆ (A completar en retrospectiva)'],
            [],
            ['PRÓXIMOS PASOS'],
            ['1. Revisar "¿Qué salió bien?" en la siguiente hoja'],
            ['2. Analizar "¿Qué salió mal?" para identificar mejoras'],
            ['3. Definir Action Items concretos y medibles']
        ];

        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        ws['!cols'] = [{ wch: 35 }, { wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, ws, 'Resumen');
    }

    private static createWhatWentWell(
        workbook: XLSX.WorkBook,
        tasks: Task[],
        users: User[],
        activeSprint: Sprint | undefined
    ): void {
        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
        const completedTasks = sprintTasks.filter(t => t.status === TaskStatus.DONE);

        const wellData = [
            ['✅ ¿QUÉ SALIÓ BIEN?'],
            [],
            ['TAREAS COMPLETADAS EXITOSAMENTE'],
            ['ID', 'Título', 'Puntos', 'Asignado A', 'Completada'],
            ...completedTasks.map(task => {
                const assignee = users.find(u => u.id === task.assigneeId);
                return [
                    task.id,
                    task.title,
                    task.points,
                    assignee?.name || 'Sin asignar',
                    '✅'
                ];
            }),
            [],
            ['ASPECTOS POSITIVOS IDENTIFICADOS'],
            ['• Buena comunicación en daily scrums'],
            ['• Colaboración efectiva entre miembros'],
            ['• Resolución rápida de bloqueos'],
            ['• (Agregar más aspectos positivos durante la retrospectiva)']
        ];

        const ws = XLSX.utils.aoa_to_sheet(wellData);
        ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 10 }, { wch: 25 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, ws, '✅ Qué Salió Bien');
    }

    private static createWhatWentWrong(
        workbook: XLSX.WorkBook,
        tasks: Task[],
        users: User[],
        activeSprint: Sprint | undefined,
        now: Date
    ): void {
        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
        const overdueTasks = sprintTasks.filter(t =>
            t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE
        );
        const incompleteTasks = sprintTasks.filter(t => t.status !== TaskStatus.DONE);

        const wrongData = [
            ['⚠️ ¿QUÉ SALIÓ MAL?'],
            [],
            ['TAREAS NO COMPLETADAS'],
            ['ID', 'Título', 'Estado', 'Prioridad', 'Asignado A', 'Razón Potencial'],
            ...incompleteTasks.map(task => {
                const assignee = users.find(u => u.id === task.assigneeId);
                const reason = overdueTasks.includes(task) ? 'Vencida' :
                    task.status === TaskStatus.IN_PROGRESS ? 'En progreso' :
                        'No iniciada';
                return [
                    task.id,
                    task.title,
                    task.status,
                    task.priority,
                    assignee?.name || 'Sin asignar',
                    reason
                ];
            }),
            [],
            ['PROBLEMAS IDENTIFICADOS'],
            ['• Estimaciones incorrectas (muy optimistas)'],
            ['• Bloqueos técnicos no resueltos a tiempo'],
            ['• Cambios de alcance durante el sprint'],
            ['• (Agregar más problemas identificados durante la retrospectiva)'],
            [],
            ['ÁREAS DE MEJORA'],
            ['• Mejorar precisión en estimaciones'],
            ['• Identificar bloqueos más temprano'],
            ['• Mejor comunicación con stakeholders']
        ];

        const ws = XLSX.utils.aoa_to_sheet(wrongData);
        ws['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, ws, '⚠️ Qué Salió Mal');
    }

    private static createActionItems(
        workbook: XLSX.WorkBook,
        tasks: Task[],
        activeSprint: Sprint | undefined,
        now: Date
    ): void {
        const actionData = [
            ['🎯 ACTION ITEMS'],
            ['Acciones concretas para el próximo sprint'],
            [],
            ['#', 'Acción', 'Responsable', 'Fecha Límite', 'Estado', 'Prioridad'],
            ['1', 'Revisar proceso de estimación de tareas', 'Scrum Master', format(now, 'dd/MM/yyyy'), '⏳ Pendiente', 'Alta'],
            ['2', 'Implementar daily blocker board', 'Equipo', format(now, 'dd/MM/yyyy'), '⏳ Pendiente', 'Media'],
            ['3', 'Mejorar documentación técnica', 'Developers', format(now, 'dd/MM/yyyy'), '⏳ Pendiente', 'Media'],
            ['4', '(Agregar más action items durante la retrospectiva)', '', '', '', ''],
            [],
            ['INSTRUCCIONES'],
            ['1. Completar esta tabla durante la sesión de retrospectiva'],
            ['2. Asignar responsables específicos a cada acción'],
            ['3. Establecer fechas límite realistas'],
            ['4. Revisar el progreso en la próxima retrospectiva']
        ];

        const ws = XLSX.utils.aoa_to_sheet(actionData);
        ws['!cols'] = [{ wch: 5 }, { wch: 45 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, ws, '🎯 Action Items');
    }

    // ===== MÉTODOS PRIVADOS PARA RIESGOS =====

    private static createRiskMatrix(
        workbook: XLSX.WorkBook,
        tasks: Task[],
        users: User[],
        activeSprint: Sprint | undefined,
        now: Date
    ): void {
        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
        const risks = this.identifyRisks(sprintTasks, now);

        const matrixData = [
            ['⚠️ MATRIZ DE RIESGOS'],
            [],
            ['RIESGOS IDENTIFICADOS'],
            ['ID', 'Descripción', 'Probabilidad', 'Impacto', 'Nivel de Riesgo', 'Estado'],
            ...risks.map((risk, index) => [
                `R${index + 1}`,
                risk.description,
                risk.probability,
                risk.impact,
                risk.level,
                risk.status
            ]),
            [],
            ['LEYENDA'],
            ['Probabilidad: Alta / Media / Baja'],
            ['Impacto: Alto / Medio / Bajo'],
            ['Nivel de Riesgo: 🔴 Crítico / 🟡 Alto / 🟢 Bajo']
        ];

        const ws = XLSX.utils.aoa_to_sheet(matrixData);
        ws['!cols'] = [{ wch: 8 }, { wch: 50 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, ws, 'Matriz de Riesgos');
    }

    private static createMitigationPlan(
        workbook: XLSX.WorkBook,
        tasks: Task[],
        users: User[],
        activeSprint: Sprint | undefined,
        now: Date
    ): void {
        const planData = [
            ['🛡️ PLAN DE MITIGACIÓN'],
            [],
            ['ACCIONES DE MITIGACIÓN'],
            ['Riesgo ID', 'Acción de Mitigación', 'Responsable', 'Fecha Límite', 'Estado'],
            ['R1', 'Re-priorizar tareas críticas', 'Scrum Master', format(now, 'dd/MM/yyyy'), '⏳'],
            ['R2', 'Asignar recursos adicionales', 'Product Owner', format(now, 'dd/MM/yyyy'), '⏳'],
            ['R3', 'Revisar dependencias técnicas', 'Tech Lead', format(now, 'dd/MM/yyyy'), '⏳'],
            [],
            ['PLAN DE CONTINGENCIA'],
            ['Si el riesgo se materializa:'],
            ['1. Notificar inmediatamente al Scrum Master'],
            ['2. Evaluar impacto en el objetivo del sprint'],
            ['3. Ajustar plan según sea necesario'],
            ['4. Comunicar cambios a stakeholders']
        ];

        const ws = XLSX.utils.aoa_to_sheet(planData);
        ws['!cols'] = [{ wch: 12 }, { wch: 45 }, { wch: 20 }, { wch: 15 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, ws, 'Plan de Mitigación');
    }

    // ===== MÉTODOS PRIVADOS PARA PRODUCTIVIDAD =====

    private static createPersonalMetrics(
        workbook: XLSX.WorkBook,
        tasks: Task[],
        user: User,
        activeSprint: Sprint | undefined,
        now: Date
    ): void {
        const userTasks = tasks.filter(t => t.assigneeId === user.id && t.sprintId === activeSprint?.id);
        const completedTasks = userTasks.filter(t => t.status === TaskStatus.DONE);
        const totalPoints = userTasks.reduce((sum, t) => sum + t.points, 0);
        const completedPoints = completedTasks.reduce((sum, t) => sum + t.points, 0);

        const metricsData = [
            ['📊 MÉTRICAS PERSONALES'],
            [`Desarrollador: ${user.name}`],
            [`Sprint: ${activeSprint?.name || 'N/A'}`],
            [],
            ['RESUMEN'],
            ['Métrica', 'Valor'],
            ['Tareas Asignadas', userTasks.length],
            ['Tareas Completadas', completedTasks.length],
            ['Tasa de Completitud', `${userTasks.length > 0 ? (completedTasks.length / userTasks.length * 100).toFixed(1) : 0}%`],
            ['Puntos Asignados', totalPoints],
            ['Puntos Completados', completedPoints],
            ['Velocidad Personal', completedPoints],
            [],
            ['DISTRIBUCIÓN POR PRIORIDAD'],
            ['Prioridad', 'Asignadas', 'Completadas'],
            ['Crítica', userTasks.filter(t => t.priority === Priority.CRITICAL).length, completedTasks.filter(t => t.priority === Priority.CRITICAL).length],
            ['Alta', userTasks.filter(t => t.priority === Priority.HIGH).length, completedTasks.filter(t => t.priority === Priority.HIGH).length],
            ['Media', userTasks.filter(t => t.priority === Priority.MEDIUM).length, completedTasks.filter(t => t.priority === Priority.MEDIUM).length],
            ['Baja', userTasks.filter(t => t.priority === Priority.LOW).length, completedTasks.filter(t => t.priority === Priority.LOW).length]
        ];

        const ws = XLSX.utils.aoa_to_sheet(metricsData);
        ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, ws, 'Métricas Personales');
    }

    private static createTeamComparison(
        workbook: XLSX.WorkBook,
        tasks: Task[],
        users: User[],
        targetUser: User,
        activeSprint: Sprint | undefined
    ): void {
        const teamStats = users.map(user => {
            const userTasks = tasks.filter(t => t.assigneeId === user.id && t.sprintId === activeSprint?.id);
            const completedTasks = userTasks.filter(t => t.status === TaskStatus.DONE);
            const completedPoints = completedTasks.reduce((sum, t) => sum + t.points, 0);

            return {
                name: user.name,
                tasks: userTasks.length,
                completed: completedTasks.length,
                points: completedPoints,
                rate: userTasks.length > 0 ? (completedTasks.length / userTasks.length * 100) : 0
            };
        }).filter(stat => stat.tasks > 0);

        const avgRate = teamStats.reduce((sum, s) => sum + s.rate, 0) / teamStats.length;
        const userStat = teamStats.find(s => s.name === targetUser.name);

        const comparisonData = [
            ['📈 COMPARATIVA CON EL EQUIPO'],
            [],
            ['TU RENDIMIENTO VS PROMEDIO DEL EQUIPO'],
            ['Métrica', 'Tu Valor', 'Promedio Equipo', 'Diferencia'],
            ['Tasa de Completitud', `${userStat?.rate.toFixed(1)}%`, `${avgRate.toFixed(1)}%`, `${userStat ? (userStat.rate - avgRate).toFixed(1) : 0}%`],
            ['Puntos Completados', userStat?.points || 0, (teamStats.reduce((sum, s) => sum + s.points, 0) / teamStats.length).toFixed(1), ''],
            [],
            ['RANKING DEL EQUIPO'],
            ['Posición', 'Miembro', 'Tareas Completadas', 'Puntos', 'Tasa'],
            ...teamStats.sort((a, b) => b.points - a.points).map((stat, index) => [
                index + 1,
                stat.name === targetUser.name ? `⭐ ${stat.name}` : stat.name,
                stat.completed,
                stat.points,
                `${stat.rate.toFixed(1)}%`
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(comparisonData);
        ws['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, ws, 'Comparativa Equipo');
    }

    // ===== MÉTODOS PRIVADOS PARA BLOQUEOS =====

    private static createActiveBlockers(
        workbook: XLSX.WorkBook,
        tasks: Task[],
        users: User[],
        activeSprint: Sprint | undefined,
        now: Date
    ): void {
        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
        // Simular bloqueos (en producción esto vendría de una propiedad de la tarea)
        const blockedTasks = sprintTasks.filter(t =>
            t.status === TaskStatus.IN_PROGRESS &&
            t.dueDate &&
            differenceInDays(new Date(t.dueDate), now) < 3
        );

        const blockersData = [
            ['🚧 BLOQUEOS Y DEPENDENCIAS'],
            [],
            ['TAREAS BLOQUEADAS'],
            ['ID', 'Título', 'Bloqueado Por', 'Días Bloqueado', 'Asignado A', 'Impacto'],
            ...blockedTasks.map(task => {
                const assignee = users.find(u => u.id === task.assigneeId);
                return [
                    task.id,
                    task.title,
                    'Dependencia técnica / Recurso externo',
                    Math.floor(Math.random() * 5) + 1, // Simular días bloqueado
                    assignee?.name || 'Sin asignar',
                    task.priority === Priority.CRITICAL ? '🔴 Alto' : '🟡 Medio'
                ];
            }),
            [],
            ['ACCIONES RECOMENDADAS'],
            ['1. Escalar bloqueos de más de 2 días al Scrum Master'],
            ['2. Buscar alternativas o workarounds'],
            ['3. Comunicar impacto en daily scrum'],
            ['4. Actualizar estimaciones si es necesario']
        ];

        const ws = XLSX.utils.aoa_to_sheet(blockersData);
        ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, ws, 'Bloqueos Activos');
    }

    // ===== UTILIDADES =====

    private static getEvaluation(ratio: number): string {
        if (ratio >= 0.9) return '🌟 Excelente';
        if (ratio >= 0.7) return '👍 Bueno';
        if (ratio >= 0.5) return '👌 Aceptable';
        if (ratio >= 0.3) return '⚠️ Bajo';
        return '🔴 Crítico';
    }

    private static identifyRisks(tasks: Task[], now: Date): any[] {
        const risks = [];

        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE);
        if (overdueTasks.length > 0) {
            risks.push({
                description: `${overdueTasks.length} tareas vencidas sin completar`,
                probability: 'Alta',
                impact: 'Alto',
                level: '🔴 Crítico',
                status: 'Activo'
            });
        }

        const criticalTasks = tasks.filter(t => t.priority === Priority.CRITICAL && t.status !== TaskStatus.DONE);
        if (criticalTasks.length > 3) {
            risks.push({
                description: 'Múltiples tareas críticas pendientes',
                probability: 'Media',
                impact: 'Alto',
                level: '🟡 Alto',
                status: 'Activo'
            });
        }

        const unassignedTasks = tasks.filter(t => !t.assigneeId && t.status === TaskStatus.TODO);
        if (unassignedTasks.length > 5) {
            risks.push({
                description: 'Muchas tareas sin asignar',
                probability: 'Media',
                impact: 'Medio',
                level: '🟡 Alto',
                status: 'Activo'
            });
        }

        return risks;
    }
}
