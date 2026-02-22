import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, Save, Eye, AlertCircle, Lightbulb } from 'lucide-react';
import { Task, User, Sprint, Priority, TaskStatus, TaskTemplate } from '../types';
import { TASK_TEMPLATES, applyTemplate } from '../constants/taskTemplates';
import MentionInput from './MentionInput';

interface TaskWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Omit<Task, 'id'>) => Promise<void>;
    users: User[];
    currentUser: User;
    activeSprint: Sprint;
    existingTask?: Task;
}

type WizardStep = 'template' | 'details' | 'config' | 'review';

const TaskWizard: React.FC<TaskWizardProps> = ({
    isOpen,
    onClose,
    onSubmit,
    users,
    currentUser,
    activeSprint,
    existingTask
}) => {
    const [currentStep, setCurrentStep] = useState<WizardStep>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<Partial<Task>>({
        title: '',
        description: '',
        priority: Priority.MEDIUM,
        points: 3,
        status: TaskStatus.TODO,
        assigneeId: '',
        sprintId: activeSprint.id,
        dueDate: ''
    });

    useEffect(() => {
        if (existingTask) {
            setFormData(existingTask);
            setCurrentStep('details');
        }
    }, [existingTask]);

    useEffect(() => {
        if (!isOpen) {
            // Reset on close
            setTimeout(() => {
                setCurrentStep('template');
                setSelectedTemplate(null);
                setFormData({
                    title: '',
                    description: '',
                    priority: Priority.MEDIUM,
                    points: 3,
                    status: TaskStatus.TODO,
                    assigneeId: '',
                    sprintId: activeSprint.id,
                    dueDate: ''
                });
                setValidationErrors({});
            }, 300);
        }
    }, [isOpen, activeSprint.id]);

    const steps: { id: WizardStep; title: string; icon: React.ReactNode }[] = [
        { id: 'template', title: 'Tipo de Tarea', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'details', title: 'Detalles', icon: <AlertCircle className="w-4 h-4" /> },
        { id: 'config', title: 'Configuración', icon: <Lightbulb className="w-4 h-4" /> },
        { id: 'review', title: 'Revisión', icon: <Eye className="w-4 h-4" /> }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const handleTemplateSelect = (template: TaskTemplate) => {
        setSelectedTemplate(template);
        const templateData = applyTemplate(template);
        setFormData(prev => ({
            ...prev,
            ...templateData
        }));
        setCurrentStep('details');
    };

    const handleSkipTemplate = () => {
        setSelectedTemplate(null);
        setCurrentStep('details');
    };

    const validateStep = (step: WizardStep): boolean => {
        const errors: Record<string, string> = {};

        if (step === 'details') {
            if (!formData.title || formData.title.trim().length < 10) {
                errors.title = 'El título debe tener al menos 10 caracteres';
            }
            if (!formData.description || formData.description.trim().length < 20) {
                errors.description = 'La descripción debe tener al menos 20 caracteres';
            }
        }

        if (step === 'config') {
            if (!formData.points || formData.points < 1 || formData.points > 20) {
                errors.points = 'Los story points deben estar entre 1 y 20';
            }
            if (formData.points && formData.points > 13) {
                errors.pointsWarning = 'Advertencia: Tareas mayores a 13 puntos deberían dividirse';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).filter(k => !k.includes('Warning')).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            const nextIndex = currentStepIndex + 1;
            if (nextIndex < steps.length) {
                setCurrentStep(steps[nextIndex].id);
            }
        }
    };

    const handleBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep('config')) return;

        setIsSubmitting(true);
        try {
            await onSubmit({
                title: formData.title!,
                description: formData.description || '',
                priority: formData.priority as Priority,
                points: formData.points || 3,
                status: TaskStatus.TODO,
                assigneeId: formData.assigneeId,
                sprintId: activeSprint.id,
                dueDate: formData.dueDate
            } as Omit<Task, 'id'>);
            onClose();
        } catch (error) {
            console.error('Error creating task:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            />

            <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/50 dark:border-white/10 transform transition-all animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 ease-out flex flex-col">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#7b68ee]/10 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />

                {/* Header */}
                <div className="relative px-8 py-6 sm:px-10 sm:py-8 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-[#7b68ee]/5 to-indigo-500/5 dark:from-[#7b68ee]/10 dark:to-indigo-500/10 shrink-0">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.05em]">
                                {existingTask ? 'Editar Tarea' : 'Nueva Misión'}
                            </h2>
                            <div className="h-1 w-12 bg-[#7b68ee] rounded-full"></div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/50 dark:bg-white/5 rounded-2xl transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between relative px-2 sm:px-10">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <div className="flex flex-col items-center relative z-10 group">
                                    <div
                                        className={`
                                            w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ring-4
                                            ${index <= currentStepIndex
                                                ? 'bg-[#7b68ee] text-white shadow-xl shadow-[#7b68ee]/30 ring-[#7b68ee]/10'
                                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 ring-transparent'
                                            }
                                        `}
                                    >
                                        {index < currentStepIndex ? (
                                            <Check className="w-5 h-5 sm:w-7 sm:h-7 stroke-[3]" />
                                        ) : (
                                            React.cloneElement(step.icon as React.ReactElement, { className: "w-5 h-5 sm:w-7 sm:h-7" })
                                        )}
                                    </div>
                                    <span className={`hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] mt-3 transition-colors ${index <= currentStepIndex ? 'text-[#7b68ee]' : 'text-slate-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`
                                            flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-all duration-700
                                            ${index < currentStepIndex ? 'bg-[#7b68ee]' : 'bg-slate-100 dark:bg-white/5'}
                                        `}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="relative p-8 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
                    {/* Step 1: Template Selection */}
                    {currentStep === 'template' && (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="text-center mb-10">
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    ¿Qué tipo de tarea deseas crear?
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest">
                                    Selecciona una plantilla táctica o comienza desde cero
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {TASK_TEMPLATES.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleTemplateSelect(template)}
                                        className="group relative p-6 rounded-[2rem] border-2 border-slate-100 dark:border-white/5 hover:border-[#7b68ee] hover:shadow-2xl hover:shadow-[#7b68ee]/10 transition-all duration-500 text-left bg-white dark:bg-white/[0.02] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#7b68ee]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative">
                                            <div className="text-5xl mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">{template.icon}</div>
                                            <h4 className="font-black text-sm mb-1 text-slate-900 dark:text-white uppercase tracking-tight">
                                                {template.name}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed line-clamp-2">
                                                {template.description}
                                            </p>
                                            <div className="mt-4 inline-flex items-center gap-2 bg-[#7b68ee]/10 text-[#7b68ee] px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                {template.estimatedPoints} Effort
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="text-center pt-8 border-t border-slate-100 dark:border-white/5">
                                <button
                                    onClick={handleSkipTemplate}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-[#7b68ee] transition-colors"
                                >
                                    Omitir plantillas y crear manual →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {currentStep === 'details' && (
                        <div className="space-y-8 animate-in slide-in-from-right-10 fade-in duration-500">
                            {selectedTemplate && (
                                <div className="bg-[#7b68ee]/5 dark:bg-[#7b68ee]/10 border border-[#7b68ee]/20 dark:border-[#7b68ee]/30 rounded-3xl p-6 flex items-center gap-4">
                                    <span className="text-4xl transform animate-bounce-subtle">{selectedTemplate.icon}</span>
                                    <div>
                                        <p className="text-[10px] font-black text-[#7b68ee] dark:text-[#7b68ee] uppercase tracking-[0.2em]">
                                            Plantilla Activa: {selectedTemplate.name}
                                        </p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-indigo-100/70 mt-1">
                                            {selectedTemplate.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]">
                                        Título del Objetivo *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className={`w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border ${validationErrors.title ? 'border-red-500' : 'border-slate-100 dark:border-white/10'
                                            } rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#7b68ee] focus:outline-none transition-all placeholder:text-slate-400 text-lg`}
                                        placeholder="Define el alcance principal..."
                                    />
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                                            {formData.title?.length || 0} / 100 Caracteres
                                        </p>
                                        {validationErrors.title && (
                                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-none">{validationErrors.title}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]">
                                        Descripción Táctica *
                                    </label>
                                    <MentionInput
                                        value={formData.description || ''}
                                        onChange={(value) => setFormData({ ...formData, description: value })}
                                        users={users}
                                        placeholder="Detalla los requisitos... Usa @ para reclutar miembros"
                                        className={`w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border ${validationErrors.description ? 'border-red-500' : 'border-slate-100 dark:border-white/10'
                                            } rounded-2xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-[#7b68ee] focus:outline-none min-h-[200px] transition-all scrollbar-hide`}
                                    />
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">
                                            {formData.description?.length || 0} Caracteres Escritos
                                        </p>
                                        {validationErrors.description && (
                                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest leading-none">{validationErrors.description}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Configuration */}
                    {currentStep === 'config' && (
                        <div className="space-y-8 animate-in slide-in-from-right-10 fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]">
                                        Nivel de Prioridad
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#7b68ee] focus:outline-none appearance-none cursor-pointer uppercase tracking-widest text-xs"
                                        >
                                            {Object.values(Priority).map(p => (
                                                <option key={p} value={p} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{p}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]">
                                        Esfuerzo Estimado (Story Points)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                                        className={`w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border ${validationErrors.points ? 'border-red-500' : 'border-slate-100 dark:border-white/10'
                                            } rounded-2xl text-slate-900 dark:text-white font-black text-xl text-center focus:ring-2 focus:ring-[#7b68ee] focus:outline-none transition-all`}
                                    />
                                    {validationErrors.pointsWarning && (
                                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {validationErrors.pointsWarning}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]">
                                    Reclutar Responsable (Asignación)
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.assigneeId}
                                        onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#7b68ee] focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="" className="bg-white dark:bg-slate-900">Reservar para más tarde (Sin asignar)</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900">{u.name} — {u.role}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-[0.2em]">
                                    Deadline Estratégico
                                </label>
                                <input
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black focus:ring-2 focus:ring-[#7b68ee] focus:outline-none transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {currentStep === 'review' && (
                        <div className="space-y-8 animate-in zoom-in-95 fade-in duration-500">
                            <div className="bg-gradient-to-br from-[#7b68ee]/10 via-[#7b68ee]/5 to-indigo-500/5 dark:from-[#7b68ee]/20 dark:via-transparent dark:to-indigo-900/10 rounded-[2.5rem] p-8 sm:p-10 border border-[#7b68ee]/20 dark:border-[#7b68ee]/30 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#7b68ee]/10 blur-3xl rounded-full -mr-16 -mt-16" />

                                <div className="flex flex-col sm:flex-row items-start gap-8 relative">
                                    <div className="shrink-0 flex flex-col items-center gap-4">
                                        {selectedTemplate ? (
                                            <span className="text-7xl transform transition-transform hover:scale-110 duration-500">{selectedTemplate.icon}</span>
                                        ) : (
                                            <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center">
                                                <Sparkles className="w-10 h-10 text-[#7b68ee]" />
                                            </div>
                                        )}
                                        <div className="bg-[#7b68ee] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#7b68ee]/30">
                                            {formData.points} Points
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-current ${formData.priority === Priority.CRITICAL ? 'text-red-500 bg-red-500/10' :
                                                formData.priority === Priority.HIGH ? 'text-orange-500 bg-orange-500/10' :
                                                    formData.priority === Priority.MEDIUM ? 'text-blue-500 bg-blue-500/10' :
                                                        'text-slate-400 bg-slate-400/10'
                                                }`}>
                                                Prioridad {formData.priority}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#7b68ee] bg-[#7b68ee]/10 px-3 py-1 rounded-full">
                                                Active Sprint
                                            </span>
                                        </div>

                                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                                            {formData.title}
                                        </h3>

                                        <div className="prose dark:prose-invert max-w-none">
                                            <p className="text-sm sm:text-base text-slate-600 dark:text-indigo-100/70 leading-relaxed font-medium whitespace-pre-wrap italic">
                                                "{formData.description}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl">
                                                    <AlertCircle className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Responsable</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                                                        {users.find(u => u.id === formData.assigneeId)?.name || 'Pendiente de Reclutamiento'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-xl">
                                                    <Lightbulb className="w-4 h-4 text-[#7b68ee]" />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Deadline</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1 uppercase tracking-tighter">
                                                        {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString('es-ES', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        }) : 'Ciclo Abierto'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#7b68ee]/5 dark:bg-amber-900/10 border border-[#7b68ee]/10 dark:border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
                                <Sparkles className="w-5 h-5 text-[#7b68ee] animate-pulse" />
                                <p className="text-[10px] font-black text-slate-500 dark:text-amber-200 uppercase tracking-widest">
                                    Verifica los parámetros tácticos antes de desplegar la misión en el backlog.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 sm:px-10 sm:py-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between shrink-0">
                    <button
                        onClick={handleBack}
                        disabled={currentStepIndex === 0}
                        className="px-6 py-3.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white dark:hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Atrás
                    </button>

                    <div className="flex items-center gap-4">
                        {currentStep !== 'review' ? (
                            <button
                                onClick={handleNext}
                                className="px-8 py-3.5 bg-[#7b68ee] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 shadow-xl shadow-[#7b68ee]/20 transition-all flex items-center gap-2 active:scale-95"
                            >
                                Siguiente
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3.5 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl hover:shadow-[#7b68ee]/30 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Desplegando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Confirmar Misión
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskWizard;
