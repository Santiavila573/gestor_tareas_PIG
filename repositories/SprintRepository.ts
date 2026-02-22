import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Sprint } from '../models/types';

const COLLECTION_NAME = 'sprints';

export const sprintRepository = {
  getAll: async (): Promise<Sprint[]> => {
    try {
      const sprintsSnapshot = await getDocs(
        query(collection(db, COLLECTION_NAME), orderBy('startDate', 'desc'))
      );
      return sprintsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Sprint));
    } catch (error) {
      console.error('Error getting sprints:', error);
      return [];
    }
  },

  getActive: async (): Promise<Sprint | null> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'Active')
      );
      const sprintsSnapshot = await getDocs(q);
      if (sprintsSnapshot.empty) return null;
      
      const doc = sprintsSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Sprint;
    } catch (error) {
      console.error('Error getting active sprint:', error);
      return null;
    }
  },

  add: async (sprint: Omit<Sprint, 'id'>): Promise<Sprint> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), sprint);
      return {
        id: docRef.id,
        ...sprint
      };
    } catch (error) {
      console.error('Error adding sprint:', error);
      throw error;
    }
  },

  update: async (sprintId: string, updates: Partial<Sprint>): Promise<void> => {
    try {
      const sprintRef = doc(db, COLLECTION_NAME, sprintId);
      await updateDoc(sprintRef, updates);
    } catch (error) {
      console.error('Error updating sprint:', error);
      throw error;
    }
  },

  delete: async (sprintId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, sprintId));
    } catch (error) {
      console.error('Error deleting sprint:', error);
      throw error;
    }
  },

  subscribe: (callback: (sprints: Sprint[]) => void) => {
    return onSnapshot(
      query(collection(db, COLLECTION_NAME), orderBy('startDate', 'desc')),
      (snapshot) => {
        const sprints = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Sprint));
        callback(sprints);
      }
    );
  }
};
