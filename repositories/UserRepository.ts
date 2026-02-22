import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { User } from '../models/types';

const COLLECTION_NAME = 'users';

export const userRepository = {
  getAll: async (): Promise<User[]> => {
    try {
      const usersSnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  getById: async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, COLLECTION_NAME, userId));
      if (!userDoc.exists()) return null;
      
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  update: async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const userRef = doc(db, COLLECTION_NAME, userId);
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  delete: async (userId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  subscribe: (callback: (users: User[]) => void) => {
    return onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      callback(users);
    });
  }
};
