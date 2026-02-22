import { GoogleGenerativeAI } from "@google/generative-ai";
import { Task, Sprint, User, TaskStatus, Priority } from '../types';

const getApiKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  return '';
};

const API_KEY = getApiKey();
const genAI = new GoogleGenerativeAI(API_KEY);

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// ─────────────────────────────────────────────
//  LOCAL INTELLIGENCE ENGINE
// ─────────────────────────────────────────────
const generateLocalScrumAdvice = (
  query: string,
  context: {
    tasks: Task[]; sprints: Sprint[]; users: User[];
    projects?: any[]; roadmapItems?: any[]; retroItems?: any[];
    userRole?: string; userName?: string; agenda?: any[];
    notes?: any[]; personalNotes?: any[]; recordings?: any;
    requirementTickets?: any[]; checklistTasks?: any[];
    whiteboardElements?: any[]; umlDiagram?: any;
    teamChat?: any[]; notifications?: any[];
    timesheets?: any[]; incidents?: any[];
    auditLogs?: any[]; compliance?: any[];
  }
): string => {
  const q = query.toLowerCase();
  const {
    tasks = [], sprints = [], users = [],
    projects = [], roadmapItems = [], retroItems = [],
    userRole, userName, personalNotes = [], recordings,
    requirementTickets = [], checklistTasks = [],
    whiteboardElements = [], umlDiagram,
  } = context;

  const firstName = userName ? userName.split(' ')[0] : 'Estratega';
  const currentUser = users.find(u => u.name === userName);
  const activeSprint = sprints.find(s => s.status === 'Active') || sprints[0];
  const role = userRole || 'Miembro del Equipo';

  const sprintTasks = activeSprint ? tasks.filter(t => t.sprintId === activeSprint.id) : tasks;
  const teamChat: any[] = (context as any).teamChat || [];
  const notifications: any[] = (context as any).notifications || [];
  const timesheets: any[] = (context as any).timesheets || [];
  const incidents: any[] = (context as any).incidents || [];

  // ── Shared helpers ──────────────────────────
  const doneTasks = (list: Task[]) => list.filter(t => t.status === TaskStatus.DONE);
  const activeTasks = (list: Task[]) => list.filter(t => t.status !== TaskStatus.DONE);
  const blockedTasks = (list: Task[]) => list.filter(t => (t as any).isBlocked);
  const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

  const chart = (title: string, data: { name: string; value: number; fill: string }[]) =>
    `\`\`\`json\n{\n  "type": "chart",\n  "title": "${title}",\n  "data": ${JSON.stringify(data, null, 2)}\n}\n\`\`\``;

  const roleTag = () => {
    if (role === 'Scrum Master') return '🕵️ **(SM)**';
    if (role === 'Product Owner') return '🎯 **(PO)**';
    if (role === 'Desarrollador' || role === 'Developer') return '💻 **(Dev)**';
    return '🤖 **(Staff)**';
  };

  const divider = '\n\n---\n\n';

  // ── 1. SALUDO ────────────────────────────────
  if (q.match(/hola|buenos|saludos|presentate|quien eres|qu.*es/)) {
    const spDone = pct(doneTasks(sprintTasks).length, sprintTasks.length);
    const spBlocked = blockedTasks(sprintTasks).length;
    return `👋 **Oráculo Estratégico PIG 2026** ${roleTag()} — en línea.

Saludos, **${firstName}**. He realizado un escaneo express del ecosistema:

• 📦 **Sprint activo:** ${activeSprint?.name || 'No definido'} — ${spDone}% completado.
• 🔴 **Bloqueos detectados:** ${spBlocked} impedimentos activos.
• 💬 **Mensajes de equipo:** ${teamChat.length} conversaciones indexadas.
• 🎫 **Requerimientos:** ${requirementTickets.length} tickets en el sistema.

Tengo acceso total a tu **Arsenal de Datos**: tareas, requerimientos, chat, incidentes, timesheets y arquitectura UML.

¿Qué análisis estratégico requieres hoy?`;
  }

  // ── 2. ESTADO / PROGRESO / SPRINT ───────────
  if (q.match(/estado|status|resumen|progreso|como vamos|c.mo vamos|dashboard|informe/)) {
    const total = sprintTasks.length;
    const done = doneTasks(sprintTasks).length;
    const inProg = sprintTasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === (TaskStatus as any).REVIEW).length;
    const blocked = blockedTasks(sprintTasks).length;
    const progress = pct(done, total);

    const reqDone = requirementTickets.filter((r: any) => r.status === 'Completed' || r.status === 'Done').length;
    const reqPct = pct(reqDone, requirementTickets.length);

    const checkDone = checklistTasks.filter((c: any) => c.completed || c.done).length;
    const checkPct = pct(checkDone, checklistTasks.length);

    const overdueCount = activeTasks(sprintTasks).filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;

    let diagnosis = '';
    if (progress >= 80) diagnosis = `✅ **Diagnóstico Oráculo:** El sprint está en **zona verde**. El equipo mantiene una velocidad de entrega excepcional. Recomiendo iniciar la auditoría de cierre y la preparación del Sprint Review.`;
    else if (progress >= 50) diagnosis = `🔄 **Diagnóstico Oráculo:** Flujo estable. Sin embargo, con **${overdueCount} tareas en retraso**, es crucial proteger el ritmo. Sugiero una sesión de desbloqueamiento de 15 min.`;
    else if (progress >= 20) diagnosis = `⚠️ **Diagnóstico Oráculo:** El sprint muestra **signos de inercia**. El índice de completado es bajo para esta fase del ciclo. Se recomienda una repriorización urgente del backlog y reasignación de recursos.`;
    else diagnosis = `🚨 **Diagnóstico Oráculo:** **Alerta crítica de entrega**. El progreso indica riesgo severo de no-completado del sprint. Escalar al Product Owner y revisar el alcance comprometido de inmediato.`;

    return `📊 **Dashboard Maestro del Sprint** ${roleTag()}
Ciclo: **${activeSprint?.name || 'Sin sprint activo'}**

| Indicador | Valor |
|---|---|
| 🎯 Completado | **${progress}%** (${done}/${total} tareas) |
| ⚙️ En Ejecución | **${inProg}** tareas activas |
| 🚫 Bloqueadas | **${blocked}** impedimentos |
| ⏰ En Retraso | **${overdueCount}** tareas vencidas |
| 🎫 Requerimientos | **${reqPct}%** (${reqDone}/${requirementTickets.length}) |
| ✅ Checklist | **${checkPct}%** (${checkDone}/${checklistTasks.length}) |

${chart('VELOCIDAD DEL SPRINT', [
      { name: 'Completado', value: done, fill: '#10b981' },
      { name: 'En Ejecución', value: inProg, fill: '#7b68ee' },
      { name: 'Bloqueado', value: blocked, fill: '#ef4444' },
      { name: 'Pendiente', value: Math.max(0, total - done - inProg - blocked), fill: '#94a3b8' },
    ])}

${diagnosis}`;
  }

  // ── 3. RIESGOS / BLOQUEOS / PROBLEMAS ───────
  if (q.match(/riesgo|bloqueo|bloqueado|impedimento|problema|peligro|alerta|vulnerabilidad|critico|cr.tico/)) {
    const overdue = activeTasks(tasks).filter(t => t.dueDate && new Date(t.dueDate) < new Date());
    const critical = activeTasks(tasks).filter(t => t.priority === Priority.CRITICAL);
    const blocked = blockedTasks(tasks);
    const noAssignee = tasks.filter(t => !t.assigneeId && t.status !== TaskStatus.DONE);
    const incCount = incidents.length;

    const totalRisks = overdue.length + critical.length + blocked.length + incCount;

    if (totalRisks === 0 && noAssignee.length === 0) {
      return `🛡️ **Auditoría de Riesgos: VERDE**

No se detectan anomalías en el análisis multifuente de hoy:
• ✅ Sin tareas vencidas
• ✅ Sin tareas bloqueadas
• ✅ Sin incidentes activos
• ✅ Sin tareas críticas pendientes

La integridad del sprint es del **100%**. Excelente gestión de riesgos, ${firstName}.`;
    }

    let resp = `🚨 **Mapa de Vulnerabilidades del Proyecto**\n\nHe detectado **${totalRisks + noAssignee.length} señales de riesgo** en el análisis cruzado multi-fuente:\n\n`;

    if (overdue.length > 0) {
      resp += `### ⏰ Tareas Vencidas (${overdue.length})\n`;
      overdue.slice(0, 3).forEach(t => {
        resp += `• **${t.title}** — venció el ${new Date(t.dueDate!).toLocaleDateString('es-ES')}\n`;
      });
      if (overdue.length > 3) resp += `  _...y ${overdue.length - 3} más._\n`;
      resp += '\n';
    }
    if (blocked.length > 0) {
      resp += `### 🚫 Tareas Bloqueadas (${blocked.length})\n`;
      blocked.slice(0, 3).forEach(t => resp += `• **${t.title}**\n`);
      resp += '\n';
    }
    if (critical.length > 0) {
      resp += `### 🔴 Tareas Críticas Sin Resolver (${critical.length})\n`;
      critical.slice(0, 3).forEach(t => resp += `• **${t.title}**\n`);
      resp += '\n';
    }
    if (incCount > 0) {
      resp += `### 💥 Incidentes Técnicos (${incCount})\n`;
      incidents.slice(0, 2).forEach((i: any) => resp += `• **${i.title || i.name || 'Incidente'}** — ${i.severity || 'Alta'} severidad\n`);
      resp += '\n';
    }
    if (noAssignee.length > 0) {
      resp += `### 👥 Sin Responsable (${noAssignee.length})\n`;
      resp += `${noAssignee.length} tareas no tienen asignado, creando puntos ciegos en la ejecución.\n\n`;
    }

    resp += chart('ÍNDICE DE VULNERABILIDAD', [
      { name: 'Vencidas', value: Math.min(overdue.length * 15, 100), fill: '#ef4444' },
      { name: 'Bloqueadas', value: Math.min(blocked.length * 20, 100), fill: '#f97316' },
      { name: 'Críticas', value: Math.min(critical.length * 20, 100), fill: '#eab308' },
      { name: 'Incidentes', value: Math.min(incCount * 25, 100), fill: '#8b5cf6' },
    ]);

    resp += `\n\n**🎯 Plan de Acción Recomendado:**\n`;
    resp += `1. Realizar una **War Room de 20 min** para resolver los bloqueos críticos.\n`;
    resp += `2. Renegociar fechas de las ${overdue.length} tareas vencidas con el Product Owner.\n`;
    resp += `3. Asignar las ${noAssignee.length} tareas huérfanas antes del próximo daily.`;
    return resp;
  }

  // ── 4. MIS TAREAS / DAILY ────────────────────
  if (q.match(/mis tareas|mi trabajo|daily|que hice|que voy|pendiente|asignadas|lo mio|lo m.o/)) {
    const myActive = tasks.filter(t => t.assigneeId === currentUser?.id && t.status !== TaskStatus.DONE);
    const myDone = tasks.filter(t => t.assigneeId === currentUser?.id && t.status === TaskStatus.DONE).length;
    const myBlocked = myActive.filter(t => (t as any).isBlocked);

    if (!currentUser) return `🔐 No pude identificar tu usuario. Por favor verifica tu sesión.`;

    if (myActive.length === 0) {
      return `✨ **Estado personal: ÓPTIMO**\n\nSaludos **${firstName}**, tu tablero de responsabilidades está **despejado** — ${myDone} tareas completadas.\n\nEste es un momento estratégico: considera revisar el backlog para tomar próximas tareas o mentorizar a un compañero en las tareas bloqueadas.`;
    }

    let resp = `📋 **Foco Operativo — ${firstName}** ${roleTag()}\n\n`;
    resp += `Tienes **${myActive.length} responsabilidades activas** y **${myDone} completadas**.\n\n`;

    const byPriority: Record<string, Task[]> = {};
    myActive.forEach(t => {
      const p = t.priority || 'Sin Prioridad';
      if (!byPriority[p]) byPriority[p] = [];
      byPriority[p].push(t);
    });

    ['Critical', 'High', 'Medium', 'Low'].forEach(p => {
      if (byPriority[p]?.length) {
        const icon = p === 'Critical' ? '🔴' : p === 'High' ? '🟠' : p === 'Medium' ? '🟡' : '🟢';
        resp += `**${icon} ${p}:**\n`;
        byPriority[p].forEach(t => {
          const blocked = (t as any).isBlocked ? ' 🚫 _BLOQUEADA_' : '';
          const due = t.dueDate ? ` _(vence ${new Date(t.dueDate).toLocaleDateString('es-ES')})_` : '';
          resp += `• ${t.title}${blocked}${due}\n`;
        });
        resp += '\n';
      }
    });

    if (myBlocked.length > 0) {
      resp += `⚠️ **${myBlocked.length} de tus tareas están bloqueadas.** Repórtalo en el Daily para desescalar.`;
    }

    return resp;
  }

  // ── 5. EQUIPO / PERSONAS ─────────────────────
  if (q.match(/equipo|miembro|quien|qui.n|personas|squad|staff|capital humano/)) {
    const userStats = users.map(u => ({
      name: u.name.split(' ')[0],
      active: activeTasks(tasks.filter(t => t.assigneeId === u.id)).length,
      done: doneTasks(tasks.filter(t => t.assigneeId === u.id)).length,
      blocked: blockedTasks(tasks.filter(t => t.assigneeId === u.id)).length,
    })).sort((a, b) => b.active - a.active);

    const avgLoad = tasks.filter(t => t.status !== TaskStatus.DONE).length / (users.length || 1);
    const overloaded = userStats.filter(u => u.active > avgLoad + 2);
    const underloaded = userStats.filter(u => u.active < avgLoad - 2 && u.active === 0);

    let resp = `👥 **Análisis del Capital Humano** ${roleTag()}\n\nEscuadra de **${users.length} miembros** — Carga promedio: **${avgLoad.toFixed(1)} tareas/persona**\n\n`;

    userStats.forEach(u => {
      const bar = '█'.repeat(Math.min(u.active, 10)) + '░'.repeat(Math.max(0, 10 - u.active));
      resp += `• **${u.name}** — [${bar}] ${u.active} activas | ${u.done} completadas${u.blocked > 0 ? ` | 🚫 ${u.blocked} bloqueadas` : ''}\n`;
    });

    resp += `\n${chart('CARGA DE TRABAJO ACTIVA', userStats.map(u => ({
      name: u.name,
      value: u.active,
      fill: u.active > avgLoad + 2 ? '#ef4444' : u.active > avgLoad ? '#f59e0b' : '#10b981'
    })))}`;

    if (overloaded.length > 0) {
      resp += `\n⚠️ **Sobrecarga detectada:** **${overloaded.map(u => u.name).join(', ')}** superan la capacidad nominal. Riesgo de burnout. Considere redistribuir tareas de baja prioridad.`;
    }
    if (underloaded.length > 0) {
      resp += `\n💡 **Capacidad libre:** **${underloaded.map(u => u.name).join(', ')}** pueden absorber tareas adicionales del backlog.`;
    }
    return resp;
  }

  // ── 6. RETROSPECTIVA ─────────────────────────
  if (q.match(/retro|retrospectiva|aprend|mejorar como equipo|que salio|qu. sali./)) {
    if (retroItems.length === 0) {
      return `📝 **Retrospectiva: Sin datos**\n\nEl repositorio de retrospectiva está vacío. Para mantener una cultura de **mejora continua**, te sugiero registrar al menos:\n• 2 fortalezas del sprint actual\n• 2 áreas de mejora concretas\n• 1 acción de mejora comprometida\n\nLa calidad de la próxima retrospectiva determina la calidad del próximo sprint.`;
    }
    const good = retroItems.filter((i: any) => i.type === 'good' || i.category === 'good');
    const bad = retroItems.filter((i: any) => i.type === 'bad' || i.category === 'bad' || i.type === 'improve');
    const ideas = retroItems.filter((i: any) => i.type === 'idea' || i.type === 'action');

    let resp = `🔄 **Auditoría de Retrospectiva** ${roleTag()}\n\nAnálisis de **${retroItems.length} ítems** del repositorio de mejora continua:\n\n`;
    if (good.length > 0) {
      resp += `### ✅ Fortalezas del Equipo (${good.length})\n`;
      good.slice(0, 3).forEach((i: any) => resp += `• ${i.content || i.text || i.description}\n`);
      resp += '\n';
    }
    if (bad.length > 0) {
      resp += `### 🔧 Áreas de Mejora (${bad.length})\n`;
      bad.slice(0, 3).forEach((i: any) => resp += `• ${i.content || i.text || i.description}\n`);
      resp += '\n';
    }
    if (ideas.length > 0) {
      resp += `### 💡 Acciones Comprometidas (${ideas.length})\n`;
      ideas.slice(0, 2).forEach((i: any) => resp += `• ${i.content || i.text || i.description}\n`);
      resp += '\n';
    }
    resp += `**Índice de Salud Cultural:** ${pct(good.length, retroItems.length)}% positivo — ${good.length > bad.length ? 'Equipo en momentum positivo ✅' : 'Se requiere atención en las fricciones del equipo ⚠️'}`;
    return resp;
  }

  // ── 7. ROADMAP / PROYECTOS ───────────────────
  if (q.match(/roadmap|hoja de ruta|proyecto|objetivo|futuro|q|estrategia/)) {
    if (projects.length === 0 && roadmapItems.length === 0) {
      return `🗺️ **Roadmap: Sin definir**\n\nNo se han registrado proyectos ni hitos estratégicos. Para una organización ágil efectiva, te recomiendo definir al menos:\n• **OKRs del trimestre** (3-5 objetivos clave)\n• **Hitos de release** con fechas tentativas\n• **Dependencias críticas** entre equipos`;
    }
    let resp = `🚀 **Visión Estratégica y Roadmap** ${roleTag()}\n\n`;
    if (projects.length > 0) {
      resp += `### Proyectos Activos (${projects.length})\n`;
      projects.forEach((p: any) => resp += `• **${p.name}** — \`${p.status || 'Activo'}\`\n`);
      resp += '\n';
    }
    if (roadmapItems.length > 0) {
      resp += `### Hitos del Roadmap (${roadmapItems.length})\n`;
      roadmapItems.slice(0, 5).forEach((r: any) => resp += `• **${r.title}** — ${r.date || 'Fecha TBD'}\n`);
    }
    return resp;
  }

  // ── 8. ARSENAL / DATOS / CHAT / NOTAS ────────
  if (q.match(/arsenal|datos|chat|nota|apunte|grabac|requerimiento|ticket|checklist|pizarra|diagrama|tiempo|hora|incidente|auditoria|cumplimiento/)) {
    const recCount = recordings?.meta?.length || 0;

    let resp = `🧠 **Arsenal de Inteligencia — Inventario Total**\n\nVisibilidad estratégica completa del ecosistema PIG 2026:\n\n`;

    resp += `| Fuente | Volumen | Estado |\n|---|---|---|\n`;
    resp += `| 📋 Tareas | ${tasks.length} | ${activeTasks(tasks).length} activas |\n`;
    resp += `| 🎫 Requerimientos | ${requirementTickets.length} | ${requirementTickets.filter((r: any) => r.status === 'Completed').length} completados |\n`;
    resp += `| ✅ Checklist | ${checklistTasks.length} | ${checklistTasks.filter((c: any) => c.completed || c.done).length} verificados |\n`;
    resp += `| 💬 Chat | ${teamChat.length} | Últimos indexados |\n`;
    resp += `| 🔔 Alertas | ${notifications.length} | Procesadas |\n`;
    resp += `| ⏱️ Timesheets | ${timesheets.length} | Registros de esfuerzo |\n`;
    resp += `| 🚨 Incidentes | ${incidents.length} | Bajo supervisión |\n`;
    resp += `| 🎙️ Grabaciones | ${recCount} | Archivadas |\n`;
    if (umlDiagram) resp += `| 🏛️ Arquitectura UML | 1 | Diagrama "${umlDiagram.diagramType}" |\n`;
    if (whiteboardElements.length > 0) resp += `| 🎨 Pizarra | ${whiteboardElements.length} | Elementos activos |\n`;

    if (q.includes('chat') && teamChat.length > 0) {
      resp += `\n**💬 Últimas Conversaciones:**\n`;
      teamChat.slice(-3).forEach((m: any) => resp += `  > _"${m.content || m.text}"_ — ${m.sender || m.author || 'Equipo'}\n`);
    }
    if ((q.includes('tiempo') || q.includes('hora') || q.includes('timesheet')) && timesheets.length > 0) {
      resp += `\n**⏱️ Registros de Esfuerzo Recientes:**\n`;
      timesheets.slice(0, 3).forEach((t: any) => resp += `  • ${t.duration || t.hours || '?'}h — "${t.description || t.task || 'No especificado'}"\n`);
    }
    if (q.includes('incidente') && incidents.length > 0) {
      resp += `\n**🚨 Incidentes Activos:**\n`;
      incidents.slice(0, 3).forEach((i: any) => resp += `  • **${i.title || i.name}** [${i.severity || 'Alta'}] — ${i.status || 'Abierto'}\n`);
    }

    resp += `\n\n¿Deseas un **análisis cruzado** entre estas fuentes? Por ejemplo: impacto de incidentes en el sprint, o correlación entre timesheets y bloqueos.`;
    return resp;
  }

  // ── 9. PREDICCIÓN DE ENTREGA ─────────────────
  if (q.match(/predic|terminamos|entrega|cuando acab|cu.ndo acab|fecha real|cuanto falta|cu.nto falta/)) {
    const remaining = activeTasks(tasks).length;
    const overdueCount = activeTasks(tasks).filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
    const blockedCount = blockedTasks(tasks).length;

    if (remaining === 0) {
      return `🎉 **Entrega: COMPLETADA**\n\nEl trabajo actual está **100% finalizado**. El equipo ha ejecutado con excelencia. Momento ideal para consolidar la retrospectiva y planificar el próximo sprint.`;
    }

    const velocityFactor = Math.max(0.5, 1.5 - (blockedCount * 0.2) - (overdueCount * 0.1));
    const daysBase = Math.ceil(remaining / velocityFactor);

    return `🔮 **Predicción Oráculo de Entrega**\n\nAnalizando **${remaining} tareas pendientes** con **${blockedCount} bloqueos** activos:\n\n| Escenario | Días Estimados | Fecha Aprox. |\n|---|---|---|\n| 🟢 Optimista | **${Math.ceil(daysBase * 0.7)}** días | ${new Date(Date.now() + Math.ceil(daysBase * 0.7) * 86400000).toLocaleDateString('es-ES')} |\n| 🟡 Realista | **${daysBase}** días | ${new Date(Date.now() + daysBase * 86400000).toLocaleDateString('es-ES')} |\n| 🔴 Conservador | **${Math.ceil(daysBase * 1.5)}** días | ${new Date(Date.now() + Math.ceil(daysBase * 1.5) * 86400000).toLocaleDateString('es-ES')} |\n\n${blockedCount > 0 ? `⚠️ **Factor de riesgo:** Los ${blockedCount} bloqueos activos están reduciendo la velocidad del equipo en un ~${Math.round(blockedCount * 20)}%. Priorizarlos acortaría la entrega significativamente.` : '✅ Sin bloqueos activos — la proyección es altamente confiable.'}`;
  }

  // ── 10. NOTAS PERSONALES ─────────────────────
  if (q.match(/nota personal|apunte|mis nota|cuaderno/)) {
    if (personalNotes.length === 0) {
      return `📒 **Notas Personales: Vacío**\n\nNo hay notas registradas. El módulo de notas personales está disponible en tu workspace para capturar decisiones, aprendizajes y observaciones estratégicas del sprint.`;
    }
    let resp = `📒 **Notas Personales de ${firstName}** (${personalNotes.length} registros)\n\n`;
    personalNotes.slice(0, 3).forEach((n: any, i: number) => {
      resp += `**${i + 1}.** ${n.title || n.content?.substring(0, 60) || 'Nota sin título'}\n`;
    });
    if (personalNotes.length > 3) resp += `\n_...y ${personalNotes.length - 3} notas más en el sistema._`;
    return resp;
  }

  // ── 11. CONSEJO / MOTIVACIÓN ─────────────────
  if (q.match(/consejo|tip|sugerencia|motiva|bienestar|productividad|zen|calma/)) {
    const remaining = activeTasks(tasks).length;
    const sprintProgress = pct(doneTasks(sprintTasks).length, sprintTasks.length);

    const insights = [
      `**Ley de los Grandes Números Ágiles**: Con ${remaining} tareas pendientes, el mayor impacto viene del **20% de tareas de mayor valor**. ¿Las tienes identificadas?`,
      `**Deuda Técnica Invisible**: ${blockedTasks(tasks).length > 0 ? `Hay ${blockedTasks(tasks).length} tareas bloqueadas acumulando deuda de proceso.` : 'Sin deuda de proceso actualmente.'} Cada bloqueo sin resolver al final del día cuesta el doble al día siguiente.`,
      `**Principio de Parkinson**: El trabajo expande para llenar el tiempo disponible. Con un sprint al **${sprintProgress}%**, ¿el equipo está avanzando por urgencia o por sistema?`,
      `**Flow State**: Los desarrolladores necesitan bloques de **90 minutos sin interrupciones** para alcanzar máxima productividad. ¿El Daily protege esos bloques?`,
      `**Regla del 1-3-5**: Ejecuta **1 cosa grande, 3 medianas, 5 pequeñas** por día. Ayuda a mantener momentum sin fragmentar el foco.`,
    ];

    return `💡 **Cápsula Estratégica — ${firstName}**\n\n"${pick(insights)}"\n\n*— Oráculo Estratégico PIG 2026*`;
  }

  // ── 12. BUSCAR ───────────────────────────────
  if (q.match(/busca|buscar|encuentra|donde est|d.nde est|dime sobre/)) {
    const term = query.replace(/busca[r]?|encuentra|donde est[a-zá]?|dime sobre/gi, '').trim().toLowerCase();
    if (term.length < 2) return `🔍 Especifica el término de búsqueda. Ejemplos: *"busca login"*, *"encuentra autenticación"*, *"dime sobre el módulo de reportes"*.`;

    const foundTasks = tasks.filter(t =>
      t.title.toLowerCase().includes(term) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
    const foundReqs = requirementTickets.filter((r: any) =>
      (r.title || r.name || '').toLowerCase().includes(term) ||
      (r.description || '').toLowerCase().includes(term)
    );

    if (foundTasks.length === 0 && foundReqs.length === 0) {
      return `🔍 **Búsqueda: "${term}"**\n\nSin coincidencias en tareas ni requerimientos. ¿Deseas que amplíe la búsqueda a notas personales o mensajes de chat?`;
    }

    let resp = `🔍 **Resultados para "${term}"**\n\n`;
    if (foundTasks.length > 0) {
      resp += `**Tareas (${foundTasks.length}):**\n`;
      foundTasks.slice(0, 5).forEach(t => resp += `• **${t.title}** — \`${t.status}\` | ${t.priority}\n`);
      if (foundTasks.length > 5) resp += `  _...${foundTasks.length - 5} más._\n`;
    }
    if (foundReqs.length > 0) {
      resp += `\n**Requerimientos (${foundReqs.length}):**\n`;
      foundReqs.slice(0, 3).forEach((r: any) => resp += `• **${r.title || r.name}** — \`${r.status || 'Pendiente'}\`\n`);
    }
    return resp;
  }

  // ── 13. AUDITORÍA / LIMPIEZA DEL BACKLOG ─────
  if (q.match(/auditoria del backlog|auditor.a del backlog|limpieza|limpia|calidad del backlog/)) {
    const noAssignee = tasks.filter(t => !t.assigneeId && t.status !== TaskStatus.DONE).length;
    const noPriority = tasks.filter(t => !t.priority && t.status !== TaskStatus.DONE).length;
    const noPoints = tasks.filter(t => !t.points && t.status !== TaskStatus.DONE).length;
    const noDueDate = activeTasks(tasks).filter(t => !t.dueDate).length;
    const score = Math.max(0, 100 - (noAssignee * 10) - (noPriority * 8) - (noPoints * 5) - (noDueDate * 3));

    let resp = `🔍 **Auditoría de Salud del Backlog**\n\n`;
    resp += `**Puntuación de Calidad: ${score}/100** ${score >= 80 ? '✅' : score >= 50 ? '⚠️' : '🚨'}\n\n`;
    if (noAssignee === 0 && noPriority === 0 && noPoints === 0 && noDueDate === 0) {
      return resp + `¡Backlog impecable! Todas las tareas están correctamente definidas, asignadas y estimadas. Excelente disciplina de equipo, ${firstName}.`;
    }
    resp += `Puntos de mejora encontrados:\n\n`;
    if (noAssignee > 0) resp += `• 👥 **${noAssignee} tareas** sin responsable asignado — riesgo de punto ciego.\n`;
    if (noPriority > 0) resp += `• 🚩 **${noPriority} tareas** sin prioridad — imposible priorizar el sprint.\n`;
    if (noPoints > 0) resp += `• 🔢 **${noPoints} tareas** sin estimación de puntos — planificación imprecisa.\n`;
    if (noDueDate > 0) resp += `• 📅 **${noDueDate} tareas** sin fecha límite — sin sentido de urgencia.\n`;
    resp += `\n**Recomendación:** Dedica **20 minutos de Backlog Refinement** para completar estos metadatos. Un backlog limpio es un sprint exitoso.`;
    return resp;
  }

  // ── FALLBACK ─────────────────────────────────
  const done = doneTasks(tasks).length;
  const active = activeTasks(tasks).length;
  const sprintPct = pct(doneTasks(sprintTasks).length, sprintTasks.length);

  return `🧐 **Oráculo PIG 2026** ${roleTag()}

He recibido tu consulta: _"${query}"_

Estado actual del ecosistema mientras proceso tu solicitud:
• 🏃 Sprint **${activeSprint?.name || 'activo'}** al **${sprintPct}%**
• ✅ **${done}** tareas completadas | 📋 **${active}** en progreso
• 🚨 **${incidents.length}** incidentes | 💬 **${teamChat.length}** mensajes de equipo

Para análisis específicos, puedes pedirme:
• _"Estado del sprint"_ — Dashboard completo
• _"Riesgos del proyecto"_ — Mapa de vulnerabilidades  
• _"Mis tareas"_ — Foco operativo personal
• _"Predicción de entrega"_ — Proyección matemática
• _"Analiza el equipo"_ — Balance de carga`;
};


// ─────────────────────────────────────────────
//  BUG SOLUTION (Cloud)
// ─────────────────────────────────────────────
export const generateBugSolution = async (
  query: string,
  images: string[] = [],
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> => {
  if (!API_KEY) {
    return `🛠️ **Diagnóstico Local (Sin API Key)**

No puedo conectar con el motor cloud. Pasos sugeridos basados en patrones comunes:

1. **Consola del Desarrollador** (F12): Los errores en rojo son el punto de partida.
2. **Variables de Entorno**: Verifica que \`.env.local\` tenga las claves configuradas.
3. **Estado de Firebase**: Revisa \`services/firebase.ts\` si el error es de datos.
4. **Hard Reload** (Ctrl+F5): Limpia la caché del navegador.

¿Tienes el mensaje de error exacto? Compártelo para un diagnóstico más preciso.`;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const systemInstruction = `Actúa como un Desarrollador Senior y Experto en Debugging.
Proporciona soluciones completas y paso a paso.
ESTRUCTURA: 1.Diagnóstico 2.Solución paso a paso (con código) 3.Explicación técnica 4.Prevención.
Tono: profesional, empático, técnico. Cita fuentes simuladas cuando sea relevante.`;

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemInstruction }] },
      { role: "model", parts: [{ text: "Entendido. Listo para diagnosticar. Compárteme el código o error." }] },
      ...history
    ],
  });

  try {
    const parts: any[] = [{ text: query }];
    if (images?.length > 0) {
      images.forEach(img => {
        const matches = img.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
        } else {
          parts.push({ inlineData: { mimeType: "image/png", data: img.split(',')[1] || img } });
        }
      });
    }
    const result = await chat.sendMessage(parts);
    return result.response.text();
  } catch (error) {
    console.error("Error generating bug solution:", error);
    return "Error al procesar la solicitud de debugging. Verifica tu conexión e intenta con menos imágenes.";
  }
};


// ─────────────────────────────────────────────
//  SCRUM ADVICE (Local-first, Cloud fallback)
// ─────────────────────────────────────────────
export const generateScrumAdvice = async (
  query: string,
  context: {
    tasks: Task[]; sprints: Sprint[]; users: User[];
    userRole?: string; userName?: string; agenda?: any[]; notes?: any[];
    personalNotes?: any[]; requirementTickets?: any[]; checklistTasks?: any[];
    whiteboardElements?: any[]; umlDiagram?: any; recordings?: any;
    teamChat?: any[]; notifications?: any[]; timesheets?: any[];
    incidents?: any[]; auditLogs?: any[]; compliance?: any[];
    projects?: any[]; roadmapItems?: any[]; retroItems?: any[];
  }
): Promise<string> => {
  const q = query.toLowerCase();

  const isLocalIntent =
    !API_KEY ||
    q.match(/hola|buenos|saludos|presentate|quien eres/) ||
    q.match(/estado|status|resumen|progreso|como vamos|dashboard|informe/) ||
    q.match(/riesgo|bloqueo|impedimento|problema|peligro|alerta|vulnerabilidad/) ||
    q.match(/mis tareas|mi trabajo|daily|pendiente|asignadas|lo mio/) ||
    q.match(/equipo|miembro|quien|squad|capital humano/) ||
    q.match(/retro|retrospectiva|aprend|mejorar como equipo/) ||
    q.match(/roadmap|proyecto|objetivo|futuro|estrategia/) ||
    q.match(/arsenal|datos|chat|grabac|requerimiento|ticket|checklist|pizarra|diagrama|tiempo|hora|incidente|auditoria/) ||
    q.match(/predic|terminamos|entrega|cuando acab|fecha real|cuanto falta/) ||
    q.match(/nota personal|apunte|mis nota/) ||
    q.match(/consejo|tip|sugerencia|motiva|bienestar|productividad|zen/) ||
    q.match(/busca|buscar|encuentra|donde est|dime sobre/) ||
    q.match(/auditoria del backlog|limpieza|limpia|calidad del backlog/);

  if (isLocalIntent) {
    return generateLocalScrumAdvice(query, context);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const projectContext = JSON.stringify({
    ...context,
    notes: context.notes?.map((n: any) => n.content) || []
  }, null, 2);

  let roleInstruction = "Actúa como un experto en gestión de proyectos ágiles.";
  if (context.userRole === 'Scrum Master') {
    roleInstruction = `Actúa como un Agile Coach y Scrum Master Senior. Enfócate en flujo, cuellos de botella y salud del equipo. Habla de Velocidad, Burndown y Mejora Continua.`;
  } else if (context.userRole === 'Product Owner') {
    roleInstruction = `Actúa como un Product Manager estratégico. Enfócate en ROI, backlog, roadmap y valor de negocio.`;
  } else if (context.userRole === 'Desarrollador' || context.userRole === 'Developer') {
    roleInstruction = `Actúa como un Tech Lead Senior. Enfócate en viabilidad técnica, deuda técnica, calidad de código y patrones de diseño.`;
  }

  const prompt = `
Eres el **ORÁCULO ESTRATÉGICO PIG 2026**: una IA de alto nivel para gestión de proyectos.
Tu tono: sofisticado, analítico, proactivo, ejecutivo.
Acceso total a: tareas, sprints, requerimientos, checklists, notas, grabaciones, UML, chat, notificaciones, timesheets, incidentes.

PENSAMIENTO:
1. Correlación de Datos — conecta fuentes aparentemente separadas.
2. Diagnóstico Predictivo — anticipa consecuencias si no se actúa.
3. Acción Táctica — propón soluciones de nivel senior.

${roleInstruction}
Dirigido a: ${context.userName || 'Estratega'} (${context.userRole || 'Staff'})
Fecha: ${new Date().toLocaleDateString('es-ES')}

FORMATO: Usa tablas Markdown, **negritas**, emojis estratégicos y bloques JSON para gráficos cuando aplique.
JSON chart format: { "type": "chart", "title": "...", "data": [{ "name": "...", "value": N, "fill": "#hex" }] }

ARSENAL DE DATOS:
${projectContext}

CONSULTA: "${query}"

Idioma: Español de alto nivel. Sé el Oráculo que este proyecto merece.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return generateLocalScrumAdvice(query, context);
  }
};


// ─────────────────────────────────────────────
//  UML DIAGRAM GENERATOR
// ─────────────────────────────────────────────
export const generateUmlDiagram = async (prompt: string): Promise<any> => {
  if (!API_KEY) {
    return {
      error: "No hay API Key configurada.",
      diagramType: "Nota",
      elements: [{ id: 'e1', type: 'note', x: 100, y: 100, width: 300, height: 100, text: "Configura VITE_GEMINI_API_KEY en .env.local para generar diagramas UML." }],
      connectors: []
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const systemInstruction = `Eres un Arquitecto de Software Senior especialista en UML.
Transforma el prompt en un diagrama UML profesional en JSON estricto.

Detecta automáticamente el tipo: Clases, Casos de Uso, Componentes, Actividad.
Tipos de elementos: 'class','interface','abstract','actor','usecase','package','component','database','note','decision','activity','startEnd','parallelogram','hexagon','star','callout','pill'
Tipos de conectores: 'association','dependency','inheritance','realization','aggregation','composition'

JSON de salida (ESTRICTO, sin texto fuera del JSON):
{
  "diagramType": "Nombre",
  "explanation": "Por qué este diagrama",
  "elements": [{ "id":"string","type":"ElementType","x":number,"y":number,"width":number,"height":number,"text":"string" }],
  "connectors": [{ "id":"string","fromId":"id","toId":"id","type":"ConnectorType" }]
}
Canvas: 1000x800. Evita solapamientos. Usa PascalCase para clases.`;

  try {
    const result = await model.generateContent(`${systemInstruction}\n\nPrompt: "${prompt}"\n\nResponde ÚNICAMENTE con el JSON:`);
    let jsonStr = result.response.text().trim();

    if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0].trim();

    const first = jsonStr.indexOf('{');
    const last = jsonStr.lastIndexOf('}');
    if (first !== -1 && last !== -1) jsonStr = jsonStr.substring(first, last + 1);

    const parsed = JSON.parse(jsonStr);
    if (!parsed.elements || !Array.isArray(parsed.elements)) throw new Error("Formato JSON inválido.");
    return parsed;
  } catch (error: any) {
    console.error("Error generating UML:", error);
    let msg = "Error técnico al generar el diagrama.";
    if (error.message?.includes('API_KEY_INVALID')) msg = "API Key de Gemini inválida.";
    else if (error.message?.includes('quota')) msg = "Cuota de API agotada.";
    else if (error.message) msg = `Error: ${error.message}`;
    return { error: msg, elements: [], connectors: [] };
  }
};


export const analyzeSprintRisks = async (tasks: Task[], sprint: Sprint): Promise<string> => {
  return "";
};