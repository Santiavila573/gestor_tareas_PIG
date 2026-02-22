import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                ref={modalRef}
                className={`relative w-full ${sizeClasses[size]} bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] transform transition-all animate-in slide-in-from-bottom-10 zoom-in-95 duration-500 ease-out border border-white/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#7b68ee]/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -ml-32 -mb-32 pointer-events-none" />

                {/* Header */}
                <div className="relative px-8 py-6 sm:px-10 sm:py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-[0.05em]">{title}</h3>
                        <div className="h-1 w-12 bg-[#7b68ee] rounded-full"></div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl transition-all duration-300 hover:rotate-90 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="relative p-8 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="relative flex items-center justify-end gap-3 px-8 py-6 sm:px-10 sm:py-8 bg-slate-50/50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
