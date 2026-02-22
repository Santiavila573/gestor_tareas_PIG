import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    doc,
    deleteDoc,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { TaskComment, TaskActivity, TaskActivityAction, CollaborationNotification } from '../types';

// ============================================
// TASK COMMENTS
// ============================================

export const addTaskComment = async (
    taskId: string,
    authorId: string,
    content: string,
    mentions: string[] = []
): Promise<TaskComment> => {
    try {
        const commentData = {
            taskId,
            authorId,
            content,
            mentions,
            createdAt: new Date().toISOString(),
            isEdited: false
        };

        const docRef = await addDoc(collection(db, 'taskComments'), commentData);

        const newComment: TaskComment = {
            id: docRef.id,
            ...commentData
        };

        // Create notifications for mentioned users
        if (mentions.length > 0) {
            await createMentionNotifications(mentions, taskId, authorId);
        }

        // Log activity
        await logTaskActivity(taskId, authorId, TaskActivityAction.COMMENTED, `Añadió un comentario`);

        return newComment;
    } catch (error) {
        console.error('Error adding task comment:', error);
        throw error;
    }
};

export const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
    try {
        const q = query(
            collection(db, 'taskComments'),
            where('taskId', '==', taskId),
            orderBy('createdAt', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const comments: TaskComment[] = [];

        querySnapshot.forEach((doc) => {
            comments.push({
                id: doc.id,
                ...doc.data()
            } as TaskComment);
        });

        return comments;
    } catch (error) {
        console.error('Error getting task comments:', error);
        return [];
    }
};

export const updateComment = async (commentId: string, newContent: string): Promise<void> => {
    try {
        const commentRef = doc(db, 'taskComments', commentId);
        await updateDoc(commentRef, {
            content: newContent,
            updatedAt: new Date().toISOString(),
            isEdited: true
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        throw error;
    }
};

export const deleteComment = async (commentId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'taskComments', commentId));
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};

// ============================================
// NOTIFICATIONS
// ============================================

export const createMentionNotifications = async (
    mentions: string[],
    taskId: string,
    triggeredBy: string
): Promise<void> => {
    try {
        const notificationPromises = mentions.map(async (userId) => {
            // Don't notify yourself
            if (userId === triggeredBy) return;

            const notificationData = {
                userId,
                type: 'mention',
                taskId,
                triggeredBy,
                message: 'Te mencionó en un comentario',
                read: false,
                createdAt: new Date().toISOString()
            };

            await addDoc(collection(db, 'collaborationNotifications'), notificationData);
        });

        await Promise.all(notificationPromises);
    } catch (error) {
        console.error('Error creating mention notifications:', error);
    }
};

export const getUserNotifications = async (userId: string): Promise<CollaborationNotification[]> => {
    try {
        const q = query(
            collection(db, 'collaborationNotifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const notifications: CollaborationNotification[] = [];

        querySnapshot.forEach((doc) => {
            notifications.push({
                id: doc.id,
                ...doc.data()
            } as CollaborationNotification);
        });

        return notifications;
    } catch (error) {
        console.error('Error getting user notifications:', error);
        return [];
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        const notificationRef = doc(db, 'collaborationNotifications', notificationId);
        await updateDoc(notificationRef, {
            read: true
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    try {
        const q = query(
            collection(db, 'collaborationNotifications'),
            where('userId', '==', userId),
            where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        const updatePromises = querySnapshot.docs.map(doc =>
            updateDoc(doc.ref, { read: true })
        );

        await Promise.all(updatePromises);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};

// ============================================
// ACTIVITY TRACKING
// ============================================

export const logTaskActivity = async (
    taskId: string,
    userId: string,
    action: TaskActivityAction,
    details: string
): Promise<void> => {
    try {
        const activityData = {
            taskId,
            userId,
            action,
            details,
            timestamp: new Date().toISOString()
        };

        await addDoc(collection(db, 'taskActivity'), activityData);
    } catch (error) {
        console.error('Error logging task activity:', error);
    }
};

export const getTaskActivity = async (taskId: string): Promise<TaskActivity[]> => {
    try {
        const q = query(
            collection(db, 'taskActivity'),
            where('taskId', '==', taskId),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const activities: TaskActivity[] = [];

        querySnapshot.forEach((doc) => {
            activities.push({
                id: doc.id,
                ...doc.data()
            } as TaskActivity);
        });

        return activities;
    } catch (error) {
        console.error('Error getting task activity:', error);
        return [];
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const extractMentions = (content: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[2]); // Extract user ID from @[Name](userId)
    }

    return mentions;
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    try {
        const q = query(
            collection(db, 'collaborationNotifications'),
            where('userId', '==', userId),
            where('read', '==', false)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
    } catch (error) {
        console.error('Error getting unread notifications count:', error);
        return 0;
    }
};
