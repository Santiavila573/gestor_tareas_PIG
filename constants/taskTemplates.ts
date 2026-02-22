import { TaskTemplate, Priority, TaskStatus, Task } from '../types';

export const TASK_TEMPLATES: TaskTemplate[] = [
    {
        id: 'bug',
        name: 'Bug Report',
        description: 'Reportar un error o comportamiento inesperado',
        estimatedPoints: 3,
        icon: '🐛',
        defaultValues: {
            priority: Priority.HIGH,
            status: TaskStatus.TODO,
            description: '## Pasos para reproducir\n1. \n2. \n3. \n\n## Comportamiento esperado\n\n## Comportamiento actual\n'
        }
    },
    {
        id: 'feature',
        name: 'Nueva Funcionalidad',
        description: 'Desarrollar una nueva característica',
        estimatedPoints: 5,
        icon: '✨',
        defaultValues: {
            priority: Priority.MEDIUM,
            status: TaskStatus.TODO,
            description: '## Descripción General\n\n## Criterios de Aceptación\n- [ ] \n- [ ] \n'
        }
    },
    {
        id: 'refactor',
        name: 'Refactorización',
        description: 'Mejorar código existente sin cambiar comportamiento',
        estimatedPoints: 2,
        icon: '♻️',
        defaultValues: {
            priority: Priority.LOW,
            status: TaskStatus.TODO,
            description: '## Módulos afectados\n\n## Objetivo de la mejora\n'
        }
    },
    {
        id: 'docs',
        name: 'Documentación',
        description: 'Crear o actualizar documentación',
        estimatedPoints: 1,
        icon: '📚',
        defaultValues: {
            priority: Priority.LOW,
            status: TaskStatus.TODO,
            description: '## Documentos a actualizar\n\n## Cambios necesarios\n'
        }
    }
];

export const applyTemplate = (template: TaskTemplate): Partial<Task> => {
    return template.defaultValues;
};
