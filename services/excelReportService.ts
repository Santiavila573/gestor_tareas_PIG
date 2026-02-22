import { Task, Sprint, User, TaskStatus, Priority } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export interface ReportData {
    tasks: Task[];
    sprints: Sprint[];
    users: User[];
    currentUser: User | null;
}

const COLORS = {
    primary: '4F46E5',      // Indigo
    success: '10B981',      // Green
    warning: 'F59E0B',      // Amber
    danger: 'EF4444',       // Red
    info: '3B82F6',         // Blue
    white: 'FFFFFF',
    dark: '1F2937',
    lightGray: 'F3F4F6'
};

export class ExcelReportService {

    /**
     * Genera un reporte Excel ultra-profesional usando ExcelJS
     * Incluye Tablas Inteligentes, Auto-filtros y Formato Condicional
     */
    static async generateProfessionalExcel(data: ReportData): Promise<void> {
        const { tasks, sprints, users, currentUser } = data;
        const activeSprint = sprints.find(s => s.status === 'Active') || sprints[0];
        const now = new Date();

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'TaskiBot AI';
        workbook.lastModifiedBy = currentUser?.name || 'Sistema';
        workbook.created = now;
        workbook.modified = now;

        // 1. Hoja de Dashboard
        const dashboardWs = workbook.addWorksheet('📊 Dashboard Ejecutivo');
        await this.createDashboardSheet(workbook, dashboardWs, data, activeSprint, now);

        // 2. Hoja de Detalle (Fuente de Datos para Pivot)
        await this.createTasksTableSheet(workbook, tasks, users, activeSprint);

        // 3. NUEVA: Hoja de Análisis Cruzado (Simulación de Tabla Dinámica con Fórmulas)
        await this.createPivotAnalysisSheet(workbook, tasks);

        // 4. NUEVA: Hoja de Burndown Chart Visual
        await this.createBurndownSheet(workbook, tasks, activeSprint, now);

        // 5. Hoja de Rendimiento del Equipo
        await this.createTeamSheet(workbook, tasks, users, activeSprint);

        // Generar el buffer y descargar
        const buffer = await workbook.xlsx.writeBuffer();
        const dateStr = format(now, 'yyyy-MM-dd');
        const filename = `Reporte_Scrum_Premium_${dateStr}.xlsx`;

        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, filename);
    }

    private static async createDashboardSheet(
        workbook: ExcelJS.Workbook,
        ws: ExcelJS.Worksheet,
        data: ReportData,
        activeSprint: Sprint | undefined,
        now: Date
    ): Promise<void> {
        const stats = this.calculateStatistics(data.tasks, activeSprint);

        // Menú de Navegación
        this.addNavigationMenu(ws);

        // Configuración de columnas
        ws.getColumn(1).width = 25;
        ws.getColumn(2).width = 40;
        ws.getColumn(3).width = 25;
        ws.getColumn(4).width = 40; // Espacio para gráficos

        // Título Principal (Desplazado a fila 2)
        const titleRow = ws.addRow(['📊 REPORTE DE INTELIGENCIA SCRUM']);
        titleRow.font = { name: 'Segoe UI', size: 20, bold: true, color: { argb: COLORS.primary } };
        ws.mergeCells(2, 1, 2, 3);
        titleRow.alignment = { horizontal: 'center' };

        const subTitleRow = ws.addRow(['GestorTasks AI - Análisis de Rendimiento Corporativo']);
        ws.mergeCells(3, 1, 3, 3);
        subTitleRow.alignment = { horizontal: 'center' };
        subTitleRow.font = { italic: true, color: { argb: '6B7280' } };

        ws.addRow([]); // Espacio

        // Bloque de Información General
        this.addSectionTitle(ws, '🏛️ INFORMACIÓN DEL SPRINT', 5);
        ws.addRow(['Sprint', activeSprint?.name || 'N/A']);
        ws.addRow(['Objetivo', activeSprint?.goal || 'N/A']);
        ws.addRow(['Período', activeSprint ? `${format(new Date(activeSprint.startDate), 'dd MMM')} - ${format(new Date(activeSprint.endDate), 'dd MMM')}` : 'N/A']);
        ws.addRow(['Fecha de Generación', format(now, "dd 'de' MMMM, yyyy HH:mm", { locale: es })]);

        ws.addRow([]);

        // Bloque de KPIs
        this.addSectionTitle(ws, '🎯 INDICADORES CLAVE (KPIs)', 11);

        const kpiRows = [
            ['Progreso del Sprint', `${stats.progressPercentage.toFixed(1)}%`, this.getProgressBar(stats.progressPercentage)],
            ['Puntos Completados', `${stats.completedPoints} / ${stats.totalPoints}`, stats.completionRate >= 80 ? 'EXCELENTE' : 'EN PROGRESO'],
            ['Velocidad Actual', `${stats.velocity} pts`, '⚡'],
            ['Tareas en Riesgo', stats.overdue, stats.overdue > 0 ? '⚠️ ATENCIÓN' : '✅ OK']
        ];

        kpiRows.forEach(content => {
            const row = ws.addRow(content);
            row.font = { bold: true };
            if (content[2] === '⚠️ ATENCIÓN') row.getCell(3).font = { color: { argb: COLORS.danger }, bold: true };
        });

        ws.addRow([]);

        // Bloque de Inteligencia Avanzada
        this.addSectionTitle(ws, '🧠 CENTRO DE INTELIGENCIA', 17);
        const intelRows = [
            ['Velocidad Requerida', `${stats.requiredVelocity.toFixed(1)} pts/día`, '📈'],
            ['Tareas Bloqueadas', stats.blockedCount, stats.blockedCount > 0 ? '🚨 BLOQUEO' : '✅ LIBRE'],
            ['Días para Cierre', `${stats.daysRemaining} días`, '⏳'],
            ['Pendiente Crítico', stats.criticalPendingCount, stats.criticalPendingCount > 0 ? '⚠️ PRIORIZAR' : '✅ OK']
        ];

        intelRows.forEach(content => {
            const row = ws.addRow(content);
            row.font = { bold: true };
            if (content[2] === '🚨 BLOQUEO' || content[2] === '⚠️ PRIORIZAR') {
                row.getCell(3).font = { color: { argb: COLORS.danger }, bold: true };
            }
        });

        ws.addRow([]);

        // Bloque de Alertas y Sugerencias
        this.addSectionTitle(ws, '💬 ALERTAS Y RECOMENDACIONES', 23);
        const alertRow = ws.addRow([this.getMainAlert(stats, data.tasks, activeSprint, now)]);
        ws.mergeCells(ws.lastRow.number, 1, ws.lastRow.number, 3);
        alertRow.font = { bold: true, color: { argb: COLORS.primary } };

        const recRow = ws.addRow([this.getMainRecommendation(stats)]);
        ws.mergeCells(ws.lastRow.number, 1, ws.lastRow.number, 3);
        recRow.font = { italic: true };

        // Distribución por Estado (Ahora en fila 27)
        this.addSectionTitle(ws, '� DISTRIBUCIÓN POR ESTADO', 27);
        ws.addRow(['Estado', 'Tareas', 'Impacto']);

        Object.entries(stats.byStatus).forEach(([status, count]) => {
            const numericCount = count as number;
            const row = ws.addRow([status, numericCount, this.getProgressBar((numericCount / Math.max(1, stats.totalTasks)) * 100, 15)]);
            if (status === TaskStatus.DONE) row.getCell(1).font = { color: { argb: COLORS.success }, bold: true };
        });

        // --- AGREGAR GRÁFICO VISUAL (IMAGEN 1: PASTEL) ---
        try {
            const chartData = Object.entries(stats.byStatus).map(([name, value]) => ({ name, value: value as number }));
            const chartBase64 = this.renderStatusChart(chartData);

            const imageId = workbook.addImage({
                base64: chartBase64,
                extension: 'png',
            });

            ws.addImage(imageId, {
                tl: { col: 3.2, row: 4.5 },
                ext: { width: 400, height: 300 },
                editAs: 'oneCell'
            });

            ws.getCell('D5').value = '📊 DISTRIBUCIÓN VISUAL DE ESTADOS';
            ws.getCell('D5').font = { bold: true, color: { argb: COLORS.primary } };

            // --- AGREGAR GRÁFICO VISUAL (IMAGEN 2: BARRAS - CARGA) ---
            const topMembers = this.getTopContributors(data.tasks, data.users, activeSprint, 5);
            const workloadData = topMembers.map(m => ({ name: m[0], value: m[2] })); // Nombre y Puntos

            if (workloadData.length > 0) {
                const barChartBase64 = this.renderWorkloadChart(workloadData);
                const barImageId = workbook.addImage({
                    base64: barChartBase64,
                    extension: 'png',
                });

                ws.addImage(barImageId, {
                    tl: { col: 3.2, row: 21 },
                    ext: { width: 400, height: 300 },
                    editAs: 'oneCell'
                });

                ws.getCell('D21').value = '📈 PRODUCTIVIDAD POR MIEMBRO (Puntos)';
                ws.getCell('D21').font = { bold: true, color: { argb: COLORS.primary } };
            }

            // --- AGREGAR GRÁFICO VISUAL (IMAGEN 3: BURNDOWN) ---
            if (activeSprint) {
                const burndownBase64 = this.renderBurndownChart(activeSprint, data.tasks, now);
                const burndownImageId = workbook.addImage({
                    base64: burndownBase64,
                    extension: 'png',
                });

                ws.addImage(burndownImageId, {
                    tl: { col: 3.2, row: 38 },
                    ext: { width: 400, height: 250 },
                    editAs: 'oneCell'
                });

                ws.getCell('D38').value = '📉 TENDENCIA DE QUEMADO (Burndown)';
                ws.getCell('D38').font = { bold: true, color: { argb: COLORS.primary } };
            }
        } catch (e) {
            console.error("No se pudieron generar los gráficos visuales:", e);
        }

        // Estilos finales de celdas label
        ws.eachRow((row, rowNumber) => {
            const skipRows = [11, 17, 23, 27, 24, 25]; // Títulos y mensajes largos
            if (rowNumber > 4 && !skipRows.includes(rowNumber)) {
                row.getCell(1).font = { bold: true, color: { argb: COLORS.dark } };
            }
        });
    }

    private static async createTasksTableSheet(
        workbook: ExcelJS.Workbook,
        tasks: Task[],
        users: User[],
        activeSprint: Sprint | undefined
    ): Promise<void> {
        const ws = workbook.addWorksheet('📋 Detalle de Tareas');
        this.addNavigationMenu(ws);
        ws.addRow([]);

        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);

        // Preparar Datos
        const tableData = sprintTasks.map(t => {
            const assignee = users.find(u => u.id === t.assigneeId);
            return [
                t.id,
                t.title,
                t.status,
                t.priority,
                t.points,
                assignee?.name || 'Sin asignar',
                t.dueDate ? format(new Date(t.dueDate), 'dd/MM/yyyy') : 'N/A'
            ];
        });

        // Crear TABLA REAL DE EXCEL (Con filtros y estilos automáticos)
        ws.addTable({
            name: 'TareasSprint',
            ref: 'A3',
            headerRow: true,
            totalsRow: true,
            style: {
                theme: 'TableStyleMedium9',
                showRowStripes: true,
            },
            columns: [
                { name: 'ID', filterButton: true },
                { name: 'Título', filterButton: true },
                { name: 'Estado', filterButton: true },
                { name: 'Prioridad', filterButton: true },
                { name: 'Puntos', filterButton: true, totalsRowFunction: 'sum' },
                { name: 'Responsable', filterButton: true },
                { name: 'Fecha Límite', filterButton: true }
            ],
            rows: tableData,
        });

        // Ajustar anchos
        ws.columns = [
            { width: 10 }, { width: 45 }, { width: 15 },
            { width: 15 }, { width: 10 }, { width: 25 }, { width: 15 }
        ];

        // Formato Condicional para Prioridad Crítica
        ws.addConditionalFormatting({
            ref: `D2:D${tableData.length + 1}`,
            rules: [
                {
                    priority: 1,
                    type: 'containsText',
                    operator: 'containsText',
                    text: 'Crítica',
                    style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFECACA' } }, font: { color: { argb: 'FF991B1B' }, bold: true } }
                }
            ]
        });
    }

    private static async createPivotAnalysisSheet(workbook: ExcelJS.Workbook, tasks: Task[]): Promise<void> {
        const ws = workbook.addWorksheet('📊 Análisis Inteligente');

        // Menú de Navegación
        this.addNavigationMenu(ws);

        ws.addRow([]);
        const headerRow = ws.addRow(['🔍 MATRIZ DE ANÁLISIS CRUZADO (Estado vs Prioridad)']);
        headerRow.font = { bold: true, size: 14, color: { argb: COLORS.primary } };

        ws.addRow(['Esta tabla se actualiza automáticamente si cambias los datos en la hoja de Detalle.']);
        ws.addRow([]);

        const priorities = Object.values(Priority);
        const statuses = Object.values(TaskStatus);

        // Cabeceras de la matriz
        const matrixHeader = ws.addRow(['Estado / Prioridad', ...priorities, 'TOTAL']);
        matrixHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
        matrixHeader.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } });

        // Generar Matriz con Fórmulas de Excel (Simulación de Pivot)
        statuses.forEach((status, sIdx) => {
            const rowValues = [status];
            priorities.forEach((priority, pIdx) => {
                // Fórmula COUNTIFS: Cuenta tareas que cumplen ambos criterios en la tabla 'TareasSprint'
                // Sintaxis de tabla: TareasSprint[Estado]
                const colLetterPriority = String.fromCharCode(66 + pIdx); // B, C, D...
                rowValues.push({ formula: `COUNTIFS(TareasSprint[Estado], "${status}", TareasSprint[Prioridad], "${priority}")` } as any);
            });
            // Total de fila
            rowValues.push({ formula: `SUM(B${ws.lastRow.number + 1}:${String.fromCharCode(65 + priorities.length)}${ws.lastRow.number + 1})` } as any);

            const row = ws.addRow(rowValues);
            row.getCell(1).font = { bold: true };
        });

        // Fila de Totales Columnas
        const totalRowValues = ['TOTAL GENERAL'];
        const lastDataRowNum = ws.lastRow.number;
        const firstDataRowNum = lastDataRowNum - statuses.length + 1;

        priorities.forEach((_, pIdx) => {
            const colLetter = String.fromCharCode(66 + pIdx);
            totalRowValues.push({ formula: `SUM(${colLetter}${firstDataRowNum}:${colLetter}${lastDataRowNum})` } as any);
        });

        const totalRow = ws.addRow(totalRowValues);
        totalRow.font = { bold: true };
        totalRow.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F3F4F6' } });

        ws.columns = [{ width: 20 }, ...priorities.map(() => ({ width: 15 })), { width: 15 }];
    }

    private static addNavigationMenu(ws: ExcelJS.Worksheet) {
        const navRow = ws.addRow(['📍 NAVEGACIÓN RÁPIDA: ', 'INICIO (Dashboard)', 'DETALLE DE TAREAS', 'ANÁLISIS INTELIGENTE', 'BURNDOWN', 'EQUIPO']);
        navRow.font = { size: 9, bold: true };

        // Vínculos internos
        ws.getCell('B1').value = { text: '🏠 Dashboard', hyperlink: "#'📊 Dashboard Ejecutivo'!A1" };
        ws.getCell('C1').value = { text: '📋 Tareas', hyperlink: "#'📋 Detalle de Tareas'!A1" };
        ws.getCell('D1').value = { text: '📊 Análisis', hyperlink: "#'📊 Análisis Inteligente'!A1" };
        ws.getCell('E1').value = { text: '📉 Burndown', hyperlink: "#'📉 Burndown Chart'!A1" };
        ws.getCell('F1').value = { text: '👥 Equipo', hyperlink: "#'👥 Rendimiento Equipo'!A1" };

        ws.getRow(1).height = 20;
        ws.getRow(1).alignment = { vertical: 'middle' };
    }

    private static async createTeamSheet(
        workbook: ExcelJS.Workbook,
        tasks: Task[],
        users: User[],
        activeSprint: Sprint | undefined
    ): Promise<void> {
        const ws = workbook.addWorksheet('👥 Rendimiento Equipo');
        this.addNavigationMenu(ws);
        ws.addRow([]);

        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
        const teamData = users.map(user => {
            const userTasks = sprintTasks.filter(t => t.assigneeId === user.id);
            const completed = userTasks.filter(t => t.status === TaskStatus.DONE).length;
            const points = userTasks.reduce((s, t) => s + t.points, 0);
            return [user.name, user.role, userTasks.length, points, completed];
        }).filter(d => (d[2] as number) > 0);

        ws.addTable({
            name: 'RendimientoEquipo',
            ref: 'A1',
            headerRow: true,
            style: { theme: 'TableStyleMedium14', showRowStripes: true },
            columns: [
                { name: 'Miembro' }, { name: 'Rol' }, { name: 'Tareas Asignadas' },
                { name: 'Puntos Totales' }, { name: 'Completadas' }
            ],
            rows: teamData
        });

        ws.columns = [{ width: 30 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }];
    }

    // --- Auxiliares ---

    private static addSectionTitle(ws: ExcelJS.Worksheet, title: string, rowNum: number) {
        const row = ws.getRow(rowNum);
        row.getCell(1).value = title;
        ws.mergeCells(rowNum, 1, rowNum, 3);
        row.font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } };
    }

    private static getProgressBar(percentage: number, length: number = 10): string {
        const filled = Math.round((percentage / 100) * length);
        return '█'.repeat(filled) + '░'.repeat(Math.max(0, length - filled));
    }

    private static renderStatusChart(data: { name: string, value: number }[]): string {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        const total = data.reduce((s, d) => s + d.value, 0);
        let currentAngle = -0.5 * Math.PI;
        const centerX = 300;
        const centerY = 300;
        const radius = 200;

        const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6'];

        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        data.forEach((d, i) => {
            if (d.value === 0) return;
            const sliceAngle = (d.value / total) * 2 * Math.PI;

            // Dibujar rebanada
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            // Bordes blancos entre rebanadas
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Leyenda
            const legendX = 550;
            const legendY = 150 + (i * 45);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(legendX, legendY, 25, 25);

            ctx.fillStyle = '#1F2937';
            ctx.font = 'bold 22px Segoe UI, Arial';
            ctx.fillText(`${d.name}: ${d.value} (${((d.value / total) * 100).toFixed(0)}%)`, legendX + 40, legendY + 20);

            currentAngle += sliceAngle;
        });

        // Título del gráfico en el canvas
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 28px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DISTRIBUCIÓN DE TAREAS POR ESTADO', 400, 50);
        return canvas.toDataURL('image/png');
    }

    private static renderWorkloadChart(data: { name: string, value: number }[]): string {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const margin = { top: 80, right: 50, bottom: 50, left: 200 };
        const chartWidth = canvas.width - margin.left - margin.right;
        const chartHeight = canvas.height - margin.top - margin.bottom;

        const maxValue = Math.max(...data.map(d => d.value), 1);
        const barHeight = (chartHeight / data.length) * 0.7;
        const gap = (chartHeight / data.length) * 0.3;

        // Título
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 28px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PRODUCTIVIDAD DEL EQUIPO (PUNTOS ENTREGADOS)', 400, 50);

        data.forEach((d, i) => {
            const y = margin.top + i * (barHeight + gap);
            const barWidth = (d.value / maxValue) * chartWidth;

            // Dibujar barra con degradado simulado
            ctx.fillStyle = COLORS.primary;
            ctx.fillRect(margin.left, y, barWidth, barHeight);

            // Nombre del miembro
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 18px Segoe UI, Arial';
            ctx.textAlign = 'right';
            ctx.fillText(d.name, margin.left - 15, y + (barHeight / 2) + 7);

            // Valor numérico
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Segoe UI, Arial';
            ctx.textAlign = 'left';
            if (barWidth > 40) {
                ctx.fillText(d.value.toString(), margin.left + 10, y + (barHeight / 2) + 6);
            } else {
                ctx.fillStyle = '#111827';
                ctx.fillText(d.value.toString(), margin.left + barWidth + 10, y + (barHeight / 2) + 6);
            }
        });

        // Eje vertical
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.stroke();

        return canvas.toDataURL('image/png');
    }

    private static getTopContributors(tasks: Task[], users: User[], activeSprint: Sprint | undefined, limit: number): any[][] {
        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
        const stats = users.map(user => {
            const userTasks = sprintTasks.filter(t => t.assigneeId === user.id && t.status === TaskStatus.DONE);
            const points = userTasks.reduce((s, t) => s + t.points, 0);
            return { name: user.name, count: userTasks.length, points };
        });

        return stats
            .sort((a, b) => b.points - a.points || b.count - a.count)
            .slice(0, limit)
            .map(s => [s.name, s.count, s.points]);
    }

    private static getProgressEmoji(p: number) {
        if (p >= 100) return '🏆';
        if (p >= 80) return '🚀';
        if (p >= 50) return '📈';
        if (p >= 20) return '🚶';
        return '🚧';
    }

    private static getMainAlert(stats: any, tasks: Task[], activeSprint: Sprint | undefined, now: Date): string {
        if (stats.blockedCount > 0) return `🚨 BLOQUEO: Hay ${stats.blockedCount} tareas detenidas. ¡Requiere intervención del Scrum Master!`;
        if (stats.overdue > 0) return `🚨 CRÍTICO: Hay ${stats.overdue} tareas vencidas. Afecta el compromiso del Sprint.`;
        if (stats.criticalPendingCount > 0 && stats.daysRemaining < 3) return `⚠️ RIESGO ALTO: ${stats.criticalPendingCount} tareas Críticas pendientes con solo ${stats.daysRemaining} días restantes.`;
        if (stats.requiredVelocity > (stats.velocity / Math.max(1, stats.totalTasks - stats.done))) return `📉 TENDENCIA: La velocidad requerida (${stats.requiredVelocity.toFixed(1)} pts/día) es superior a la actual.`;

        return '✅ SALUDABLE: El equipo mantiene un ritmo sostenible y no hay bloqueos críticos.';
    }

    private static getMainRecommendation(stats: any): string {
        if (stats.blockedCount > 0) return '💡 ACCIÓN: Realizar una sesión de desbloqueo inmediata para las tareas marcadas como "Stop".';
        if (stats.requiredVelocity > 10) return '💡 ACCIÓN: Considerar reducir el alcance (Scope) del Sprint negociando con el Product Owner.';
        if (stats.overdue > 0) return '💡 ACCIÓN: Redistribuir las tareas vencidas entre los desarrolladores con mayor capacidad disponible.';
        if (stats.progressPercentage > 90) return '💡 ACCIÓN: Excelente trabajo. Comenzar a refinar el Backlog para el siguiente Sprint Planning.';

        return '💡 ACCIÓN: Mantener el enfoque en las tareas de "Prioridad Alta" para asegurar el cumplimiento del objetivo del Sprint.';
    }

    private static async createBurndownSheet(
        workbook: ExcelJS.Workbook,
        tasks: Task[],
        activeSprint: Sprint | undefined,
        now: Date
    ): Promise<void> {
        const ws = workbook.addWorksheet('📉 Burndown Chart');
        this.addNavigationMenu(ws);
        ws.addRow([]);

        const titleRow = ws.addRow(['📉 GRÁFICO DE BURNDOWN (QUEMADO DE PUNTOS)']);
        titleRow.font = { bold: true, size: 16, color: { argb: COLORS.primary } };

        ws.addRow(['Análisis de la velocidad de entrega frente a la línea ideal del sprint.']);
        ws.addRow([]);

        if (!activeSprint) {
            ws.addRow(['No hay un sprint activo para generar el gráfico de burndown.']);
            return;
        }

        // --- AGREGAR GRÁFICO VISUAL ---
        try {
            const chartBase64 = this.renderBurndownChart(activeSprint, tasks, now);
            const imageId = workbook.addImage({
                base64: chartBase64,
                extension: 'png',
            });

            ws.addImage(imageId, {
                tl: { col: 0, row: 5 },
                ext: { width: 700, height: 450 },
                editAs: 'oneCell'
            });
        } catch (e) {
            console.error("Error al renderizar Burndown:", e);
        }
    }

    private static renderBurndownChart(sprint: Sprint, tasks: Task[], now: Date): string {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        const margin = { top: 60, right: 150, bottom: 80, left: 80 };
        const chartWidth = canvas.width - margin.left - margin.right;
        const chartHeight = canvas.height - margin.top - margin.bottom;

        // Limpiar fondo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calcular días
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);
        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))));

        const totalPoints = tasks.filter(t => t.sprintId === sprint.id).reduce((s, t) => s + t.points, 0);
        const completedPoints = tasks.filter(t => t.sprintId === sprint.id && t.status === TaskStatus.DONE).reduce((s, t) => s + t.points, 0);
        const remainingPoints = totalPoints - completedPoints;

        // Dibujar Ejes
        ctx.strokeStyle = '#9CA3AF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + chartHeight);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();

        // Línea Ideal (Total -> 0)
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#94A3B8';
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Línea Real (Hasta Hoy)
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);

        const xNow = margin.left + (elapsedDays / totalDays) * chartWidth;
        const yNow = margin.top + (remainingPoints / (totalPoints || 1)) * chartHeight;

        ctx.lineTo(xNow, yNow);
        ctx.stroke();

        // Puntos en los extremos
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.arc(xNow, yNow, 6, 0, Math.PI * 2);
        ctx.fill();

        // Título y Leyenda
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 24px Segoe UI, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`BURNDOWN CHART - ${sprint.name}`, canvas.width / 2, 40);

        // Leyenda
        ctx.textAlign = 'left';
        ctx.font = '16px Segoe UI';

        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(margin.left + chartWidth + 20, margin.top + 20, 30, 15);
        ctx.fillText('Ideal (Burndown)', margin.left + chartWidth + 60, margin.top + 33);

        ctx.fillStyle = COLORS.primary;
        ctx.fillRect(margin.left + chartWidth + 20, margin.top + 50, 30, 15);
        ctx.fillText('Real (Restante)', margin.left + chartWidth + 60, margin.top + 63);

        return canvas.toDataURL('image/png');
    }

    private static calculateStatistics(tasks: Task[], activeSprint?: Sprint) {
        const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
        const totalTasks = sprintTasks.length;
        const totalPoints = sprintTasks.reduce((sum, t) => sum + t.points, 0);

        const byStatus: any = {};
        Object.values(TaskStatus).forEach(s => {
            byStatus[s] = sprintTasks.filter(t => t.status === s).length;
        });

        const done = byStatus[TaskStatus.DONE] || 0;
        const completedPoints = sprintTasks.filter(t => t.status === TaskStatus.DONE).reduce((sum, t) => sum + t.points, 0);
        const remainingPoints = totalPoints - completedPoints;

        const now = new Date();
        const overdue = sprintTasks.filter(t =>
            t.dueDate && new Date(t.dueDate) < now && t.status !== TaskStatus.DONE
        ).length;

        const blockedCount = sprintTasks.filter(t => t.isBlocked).length;
        const criticalPendingCount = sprintTasks.filter(t =>
            t.priority === Priority.CRITICAL && t.status !== TaskStatus.DONE
        ).length;

        let daysRemaining = 0;
        if (activeSprint) {
            const end = new Date(activeSprint.endDate);
            daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }

        const requiredVelocity = daysRemaining > 0 ? (remainingPoints / daysRemaining) : remainingPoints;

        return {
            totalTasks,
            totalPoints,
            remainingPoints,
            byStatus,
            done,
            completedPoints,
            overdue,
            blockedCount,
            criticalPendingCount,
            daysRemaining,
            requiredVelocity,
            progressPercentage: totalTasks > 0 ? (done / totalTasks * 100) : 0,
            completionRate: totalPoints > 0 ? (completedPoints / totalPoints * 100) : 0,
            velocity: completedPoints
        };
    }
}
