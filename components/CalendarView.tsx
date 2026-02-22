import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Flag, Users, Plus, Bell, X, Save, Type, AlignLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import Modal from './common/Modal';
import { Sprint, Task, User, Role } from '../types';

interface Reminder {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    color: string;
}

interface CalendarViewProps {
    sprints: Sprint[];
    tasks: Task[];
    currentUser: User | null;
}

const COLORS = [
    { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    { id: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    { id: 'amber', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    { id: 'rose', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
];

const SprintTimer = ({ endDate, sprintName }: { endDate: string, sprintName: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const end = parseISO(endDate);
            const now = new Date();
            const difference = differenceInSeconds(end, now);

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (3600 * 24)),
                    hours: Math.floor((difference % (3600 * 24)) / 3600),
                    minutes: Math.floor((difference % 3600) / 60),
                    seconds: difference % 60
                });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    if (!timeLeft) return <div className="text-red-500 font-bold">Sprint Finalizado</div>;

    return (
        <div className="bg-gradient-to-r from-[#7b68ee] to-violet-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-xl mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 font-jakarta w-full sm:w-auto mb-4 sm:mb-0">
                <h3 className="text-[10px] lg:text-xs font-black opacity-80 uppercase tracking-[0.2em] mb-2 lg:mb-3 font-jakarta">Tiempo Restante - {sprintName}</h3>
                <div className="flex gap-4 lg:gap-6 flex-wrap">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                        <div key={unit} className="text-center font-mono">
                            <span className="block text-xl lg:text-3xl font-black leading-none">{value.toString().padStart(2, '0')}</span>
                            <span className="text-[8px] lg:text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5 lg:mt-1 block font-jakarta">{unit}</span>
                        </div>
                    ))}
                </div>
            </div>
            <Clock className="w-12 h-12 lg:w-20 lg:h-20 opacity-10 absolute -right-2 -bottom-2 sm:-right-4 sm:-bottom-4 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>
    );
};

const CalendarView: React.FC<CalendarViewProps> = ({ sprints, tasks, currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newReminder, setNewReminder] = useState({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '12:00',
        color: COLORS[0].id
    });

    // Load reminders from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('calendar_reminders');
        if (saved) {
            try {
                setReminders(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load reminders", e);
            }
        }
    }, []);

    // Save reminders
    useEffect(() => {
        localStorage.setItem('calendar_reminders', JSON.stringify(reminders));
    }, [reminders]);

    const activeSprint = sprints.find(s => s.status === 'Active') || sprints[sprints.length - 1];

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getDayEvents = (day: Date) => {
        const events = [];

        // Daily Scrum (Mon-Fri)
        const dayOfWeek = day.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            events.push({ title: 'Daily Scrum', time: '10:00', type: 'meeting', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' });
        }

        // Sprints
        sprints.forEach(sprint => {
            const start = parseISO(sprint.startDate);
            const end = parseISO(sprint.endDate);

            if (isSameDay(day, start)) events.push({ title: `Inicio ${sprint.name}`, type: 'sprint-start', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' });
            if (isSameDay(day, end)) events.push({ title: `Fin ${sprint.name}`, type: 'sprint-end', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' });

            if (isSameDay(day, end)) {
                events.push({ title: 'Sprint Review', time: '14:00', type: 'ceremony', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800' });
                events.push({ title: 'Sprint Retrospective', time: '16:00', type: 'ceremony', color: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-800' });
            }
        });

        // Reminders
        reminders.forEach(reminder => {
            if (isSameDay(day, parseISO(reminder.date))) {
                const colorConfig = COLORS.find(c => c.id === reminder.color) || COLORS[0];
                events.push({
                    title: reminder.title,
                    time: reminder.time,
                    type: 'reminder',
                    color: `${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`,
                    isReminder: true
                });
            }
        });

        return events;
    };

    const handleAddReminder = (e: React.FormEvent) => {
        e.preventDefault();
        const reminder: Reminder = {
            id: Date.now().toString(),
            ...newReminder
        };
        setReminders([...reminders, reminder]);
        setIsModalOpen(false);
        setNewReminder({
            title: '',
            description: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '12:00',
            color: COLORS[0].id
        });
    };

    return (
        <div className="p-4 3xl:p-6 4xl:p-8 h-full overflow-y-auto bg-slate-50 dark:bg-[#0f0f15] transition-colors duration-500 custom-scrollbar">
            <div className="w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3 lg:gap-5">
                        <div className="w-10 h-10 lg:w-12 xl:w-14 3xl:w-20 3xl:h-20 bg-gradient-to-br from-[#7b68ee] to-violet-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0 font-jakarta">
                            <CalendarIcon className="w-5 h-5 lg:w-6 xl:w-7 3xl:w-10 3xl:h-10" />
                        </div>
                        <div>
                            <h1 className="text-xl lg:text-2xl xl:text-3xl 3xl:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-outfit">Calendario</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[8px] lg:text-[9px] xl:text-[10px] 3xl:text-sm mt-0.5 font-jakarta">Gestión de Tiempos</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#7b68ee] hover:bg-[#6b58de] text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-sm uppercase tracking-wider transition-all shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo Recordatorio</span>
                            <span className="sm:hidden">Nuevo</span>
                        </button>

                        <div className="flex items-center gap-1 bg-white dark:bg-[#1e1e2d] rounded-xl lg:rounded-[2rem] p-1 border border-slate-200 dark:border-white/5 shadow-sm">
                            <button onClick={prevMonth} className="p-2 lg:p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg lg:rounded-full transition-colors">
                                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <span className="font-black text-slate-800 dark:text-slate-200 min-w-[100px] lg:min-w-[140px] text-center select-none uppercase tracking-widest text-[9px] lg:text-[11px] 3xl:text-base">
                                {format(currentDate, 'MMM yyyy', { locale: es })}
                            </span>
                            <button onClick={nextMonth} className="p-2 lg:p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg lg:rounded-full transition-colors">
                                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {activeSprint && <div className="mb-6"><SprintTimer endDate={activeSprint.endDate} sprintName={activeSprint.name} /></div>}

                <div className="bg-white dark:bg-[#1e1e2d] rounded-2xl lg:rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-slate-200 dark:border-white/5 overflow-hidden transition-all duration-500">
                    <div className="hidden lg:grid grid-cols-7 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                            <div key={day} className="py-5 text-center text-[10px] 3xl:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 lg:grid-cols-7 auto-rows-[minmax(100px,1fr)] lg:auto-rows-[minmax(140px,1fr)] xl:auto-rows-[minmax(160px,1fr)] 2xl:auto-rows-[minmax(200px,1fr)] 3xl:auto-rows-[minmax(300px,1fr)] bg-slate-200 dark:bg-white/5 gap-px transition-all">
                        {calendarDays.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());
                            const events = getDayEvents(day);

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`bg-white dark:bg-[#1e1e2d] p-3 lg:p-5 transition-all duration-300 relative group
                     ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-[#161622] text-slate-400 opacity-40' : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.03]'}
                     ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-500/[0.03]' : ''}
                   `}
                                >
                                    <div className="flex justify-between items-start mb-2 lg:mb-3 xl:mb-4 2xl:mb-6">
                                        <span className={`
                       text-[10px] lg:text-xs xl:text-sm 2xl:text-xl 3xl:text-3xl font-black w-6 h-6 lg:w-7 xl:w-9 2xl:w-14 2xl:h-14 3xl:w-20 3xl:h-20 flex items-center justify-center rounded-lg lg:rounded-xl 2xl:rounded-2xl transition-all duration-500 group-hover:scale-110 font-jakarta
                       ${isToday ? 'bg-[#7b68ee] text-white shadow-lg shadow-indigo-500/20' : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/5'}
                       ${!isCurrentMonth ? 'opacity-30' : ''}
                     `}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div className="space-y-1 lg:space-y-1.5 xl:space-y-2 2xl:space-y-3 font-inter">
                                        {events.map((evt, i) => (
                                            <div
                                                key={i}
                                                className={`text-[8px] lg:text-[9px] xl:text-[11px] 2xl:text-base 3xl:text-2xl p-1 lg:p-1.5 xl:p-2 2xl:p-5 rounded-md lg:rounded-lg xl:rounded-xl 2xl:rounded-2xl border ${evt.color} group/evt relative transition-all hover:scale-[1.02] cursor-default flex flex-col gap-0 2xl:gap-2 shadow-sm hover:shadow-md`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    {(evt as any).isReminder && <Bell className="w-2 h-2 xl:w-3 xl:h-3 2xl:w-5 2xl:h-5 3xl:w-8 3xl:h-8 opacity-60" />}
                                                    {evt.time && <span className="font-mono opacity-50 text-[6px] lg:text-[7px] xl:text-[9px] 2xl:text-sm 3xl:text-lg uppercase">{evt.time}</span>}
                                                </div>
                                                <span className="font-black truncate tracking-tight">{evt.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* New Reminder Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Configurar Alerta Operativa"
                size="md"
            >
                <form onSubmit={handleAddReminder} className="space-y-8">
                    {/* Title Field */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificador de Alerta</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Type className="h-5 w-5 text-slate-400 group-focus-within:text-[#7b68ee] transition-colors" />
                            </div>
                            <input
                                required
                                type="text"
                                value={newReminder.title}
                                onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
                                className="block w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-lg focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent focus:outline-none transition-all placeholder:text-slate-400"
                                placeholder="Ej. Reunión de diseño"
                            />
                        </div>
                    </div>

                    {/* Date and Time Fields */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha de Despliegue</label>
                            <input
                                required
                                type="date"
                                value={newReminder.date}
                                onChange={e => setNewReminder({ ...newReminder, date: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-[#7b68ee] focus:outline-none transition-all cursor-pointer appearance-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Momento Táctico</label>
                            <input
                                required
                                type="time"
                                value={newReminder.time}
                                onChange={e => setNewReminder({ ...newReminder, time: e.target.value })}
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black text-xs focus:ring-2 focus:ring-[#7b68ee] focus:outline-none transition-all cursor-pointer appearance-none"
                            />
                        </div>
                    </div>

                    {/* Color Section */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Firma de Color (Categoría)</label>
                        <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10">
                            {COLORS.map(color => (
                                <button
                                    key={color.id}
                                    type="button"
                                    onClick={() => setNewReminder({ ...newReminder, color: color.id })}
                                    className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-110 active:scale-95 ${color.bg} ${newReminder.color === color.id ? 'border-[#7b68ee] shadow-xl shadow-[#7b68ee]/30 scale-125' : 'border-transparent opacity-60'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-8 border-t border-slate-100 dark:border-white/10 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-4 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-4 bg-gradient-to-r from-[#7b68ee] to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#7b68ee]/20 flex justify-center items-center gap-2 transition-all active:scale-95"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Alerta
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CalendarView;
