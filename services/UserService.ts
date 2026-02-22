import { userRepository } from '../repositories/UserRepository';
import { User } from '../models/types';

export const usersService = {
  getAll: async (): Promise<User[]> => {
    return await userRepository.getAll();
  },

  getById: async (userId: string): Promise<User | null> => {
    return await userRepository.getById(userId);
  },

  update: async (userId: string, updates: Partial<User>): Promise<void> => {
    return await userRepository.update(userId, updates);
  },

  delete: async (userId: string): Promise<void> => {
    return await userRepository.delete(userId);
  },

  onUsersChange: (callback: (users: User[]) => void) => {
    return userRepository.subscribe(callback);
  }
};
