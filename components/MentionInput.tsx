import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    users: User[];
    placeholder?: string;
    className?: string;
    onSubmit?: () => void;
}

const MentionInput: React.FC<MentionInputProps> = ({
    value,
    onChange,
    users,
    placeholder = 'Escribe un comentario...',
    className = '',
    onSubmit
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Detect @ mentions
        const cursorPos = textareaRef.current?.selectionStart || 0;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

            // Check if there's a space after @, if so, don't show suggestions
            if (textAfterAt.includes(' ')) {
                setShowSuggestions(false);
                return;
            }

            const searchTerm = textAfterAt.toLowerCase();
            const filtered = users.filter(user =>
                user.name.toLowerCase().includes(searchTerm)
            );

            if (filtered.length > 0) {
                setFilteredUsers(filtered);
                setShowSuggestions(true);
                setMentionStart(lastAtIndex);
                setSelectedIndex(0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    }, [value, users]);

    const insertMention = (user: User) => {
        if (mentionStart === -1) return;

        const cursorPos = textareaRef.current?.selectionStart || 0;
        const beforeMention = value.substring(0, mentionStart);
        const afterCursor = value.substring(cursorPos);

        // Format: @[Name](userId)
        const mention = `@[${user.name}](${user.id})`;
        const newValue = beforeMention + mention + ' ' + afterCursor;

        onChange(newValue);
        setShowSuggestions(false);

        // Set cursor position after mention
        setTimeout(() => {
            const newCursorPos = beforeMention.length + mention.length + 1;
            textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current?.focus();
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(filteredUsers[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        } else if (e.key === 'Enter' && e.ctrlKey && onSubmit) {
            e.preventDefault();
            onSubmit();
        }
    };

    // Render text with highlighted mentions
    const renderHighlightedText = () => {
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(value)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push(value.substring(lastIndex, match.index));
            }
            // Add highlighted mention
            parts.push(`@${match[1]}`);
            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < value.length) {
            parts.push(value.substring(lastIndex));
        }

        return parts.join('');
    };

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`w-full resize-none ${className}`}
                rows={3}
            />

            {showSuggestions && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                    {filteredUsers.map((user, index) => (
                        <button
                            key={user.id}
                            onClick={() => insertMention(user)}
                            className={`w-full text-left px-4 py-2 flex items-center gap-3 transition-colors ${index === selectedIndex
                                    ? 'bg-[#7b68ee]/5 dark:bg-[#7b68ee]/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7b68ee] to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                {user.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-sm text-slate-800 dark:text-white">
                                    {user.name}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {user.role}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Usa @ para mencionar • Ctrl+Enter para enviar
            </div>
        </div>
    );
};

export default MentionInput;
