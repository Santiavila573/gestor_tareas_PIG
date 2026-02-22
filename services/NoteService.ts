import { noteRepository } from '../repositories/NoteRepository';
import { PersonalNote } from '../models/types';

export const notesService = {
  getByUserId: async (userId: string): Promise<PersonalNote[]> => {
    return await noteRepository.getByUserId(userId);
  },

  add: async (note: Omit<PersonalNote, 'id'>): Promise<PersonalNote> => {
    return await noteRepository.add(note);
  },

  update: async (noteId: string, updates: Partial<PersonalNote>): Promise<void> => {
    return await noteRepository.update(noteId, updates);
  },

  delete: async (noteId: string): Promise<void> => {
    return await noteRepository.delete(noteId);
  },

  onNotesChange: (userId: string, callback: (notes: PersonalNote[]) => void) => {
    return noteRepository.subscribe(userId, callback);
  }
};
