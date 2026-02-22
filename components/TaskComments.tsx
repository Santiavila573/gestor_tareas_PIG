import React, { useState } from 'react';
import { MessageSquare, Send, Edit2, Trash2, Clock } from 'lucide-react';
import { TaskComment, User } from '../types';
import MentionInput from './MentionInput';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskCommentsProps {
    taskId: string;
    comments: TaskComment[];
    users: User[];
    currentUser: User;
    onAddComment: (content: string, mentions: string[]) => Promise<void>;
    onEditComment: (commentId: string, newContent: string) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
}

const TaskComments: React.FC<TaskCommentsProps> = ({
    taskId,
    comments,
    users,
    currentUser,
    onAddComment,
    onEditComment,
    onDeleteComment
}) => {
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const extractMentions = (content: string): string[] => {
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const mentions: string[] = [];
        let match: RegExpExecArray | null;

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[2]); // Extract user ID
        }

        return mentions;
    };

    const renderCommentContent = (content: string) => {
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = mentionRegex.exec(content)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push(
                    <span key={`text-${lastIndex}`}>
                        {content.substring(lastIndex, match.index)}
                    </span>
                );
            }

            // Add highlighted mention
            const userName = match[1];
            parts.push(
                <span
                    key={`mention-${match.index}`}
                    className="bg-[#7b68ee]/10 dark:bg-[#7b68ee]/20 text-[#7b68ee] dark:text-[#7b68ee] px-1.5 py-0.5 rounded font-medium"
                >
                    @{userName}
                </span>
            );

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < content.length) {
            parts.push(
                <span key={`text-${lastIndex}`}>
                    {content.substring(lastIndex)}
                </span>
            );
        }

        return <div className="whitespace-pre-wrap break-words">{parts}</div>;
    };

    const handleSubmit = async () => {
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const mentions = extractMentions(newComment);
            await onAddComment(newComment, mentions);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            await onEditComment(commentId, editContent);
            setEditingId(null);
            setEditContent('');
        } catch (error) {
            console.error('Error editing comment:', error);
        }
    };

    const startEdit = (comment: TaskComment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const getUserById = (userId: string): User | undefined => {
        return users.find(u => u.id === userId);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay comentarios aún</p>
                        <p className="text-xs mt-1">Sé el primero en comentar</p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const author = getUserById(comment.authorId);
                        const isOwner = comment.authorId === currentUser.id;
                        const isEditing = editingId === comment.id;

                        return (
                            <div
                                key={comment.id}
                                className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
                            >
                                {/* Comment Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7b68ee] to-[#c026d3] flex items-center justify-center text-white font-semibold text-sm">
                                            {author?.name.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-slate-800 dark:text-white">
                                                {author?.name || 'Usuario Desconocido'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(comment.createdAt), {
                                                    addSuffix: true,
                                                    locale: es
                                                })}
                                                {comment.isEdited && (
                                                    <span className="text-slate-400 dark:text-slate-500">(editado)</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions (only for comment owner) */}
                                    {isOwner && !isEditing && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => startEdit(comment)}
                                                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteComment(comment.id)}
                                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Comment Content */}
                                {isEditing ? (
                                    <div className="mt-2">
                                        <MentionInput
                                            value={editContent}
                                            onChange={setEditContent}
                                            users={users}
                                            placeholder="Editar comentario..."
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent"
                                            onSubmit={() => handleEdit(comment.id)}
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleEdit(comment.id)}
                                                className="px-3 py-1.5 bg-[#7b68ee] hover:bg-[#6b58de] text-white text-xs rounded-md transition-colors"
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs rounded-md transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                                        {renderCommentContent(comment.content)}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* New Comment Input */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <MentionInput
                    value={newComment}
                    onChange={setNewComment}
                    users={users}
                    placeholder="Escribe un comentario... Usa @ para mencionar"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#7b68ee] focus:border-transparent"
                    onSubmit={handleSubmit}
                />
                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || isSubmitting}
                        className="px-4 py-2 bg-[#7b68ee] hover:bg-[#6b58de] disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Enviando...' : 'Comentar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskComments;
