import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { PersonalNote } from '../models/types';

const COLLECTION_NAME = 'personalNotes';

export const noteRepository = {
  getByUserId: async (userId: string): Promise<PersonalNote[]> => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const notesSnapshot = await getDocs(q);
      return notesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PersonalNote));
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  },

  add: async (note: Omit<PersonalNote, 'id'>): Promise<PersonalNote> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), note);
      return {
        id: docRef.id,
        ...note
      };
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  },

  update: async (noteId: string, updates: Partial<PersonalNote>): Promise<void> => {
    try {
      const noteRef = doc(db, COLLECTION_NAME, noteId);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  },

  delete: async (noteId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  subscribe: (userId: string, callback: (notes: PersonalNote[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PersonalNote));
      callback(notes);
    });
  }
};
