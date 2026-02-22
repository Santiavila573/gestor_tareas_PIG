import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Project } from '../models/types';

const COLLECTION_NAME = 'projects';

export const projectRepository = {
  getAll: async (): Promise<Project[]> => {
    try {
      const projectsSnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  },

  add: async (project: Omit<Project, 'id'>): Promise<Project> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), project);
      return {
        id: docRef.id,
        ...project
      };
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  },

  update: async (projectId: string, updates: Partial<Project>): Promise<void> => {
    try {
      const projectRef = doc(db, COLLECTION_NAME, projectId);
      await updateDoc(projectRef, updates);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  delete: async (projectId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  subscribe: (callback: (projects: Project[]) => void) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      callback(projects);
    });
  }
};
