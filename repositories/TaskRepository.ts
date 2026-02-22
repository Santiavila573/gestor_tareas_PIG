import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Task } from '../models/types';

const COLLECTION_NAME = 'tasks';

export const taskRepository = {
  getAll: async (): Promise<Task[]> => {
    try {
      const tasksSnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  },

  getBySprintId: async (sprintId: string): Promise<Task[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('sprintId', '==', sprintId)
      );
      const tasksSnapshot = await getDocs(q);
      return tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
    } catch (error) {
      console.error('Error getting tasks by sprint:', error);
      return [];
    }
  },

  add: async (task: Omit<Task, 'id'>): Promise<Task> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), task);
      return {
        id: docRef.id,
        ...task
      };
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  update: async (taskId: string, updates: Partial<Task>): Promise<void> => {
    try {
      const taskRef = doc(db, COLLECTION_NAME, taskId);
      await updateDoc(taskRef, updates);
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  delete: async (taskId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  subscribe: (callback: (tasks: Task[]) => void) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      callback(tasks);
    });
  }
};
