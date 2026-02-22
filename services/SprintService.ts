import { sprintRepository } from '../repositories/SprintRepository';
import { Sprint } from '../models/types';

export const sprintsService = {
  getAll: async (): Promise<Sprint[]> => {
    return await sprintRepository.getAll();
  },

  getActive: async (): Promise<Sprint | null> => {
    return await sprintRepository.getActive();
  },

  add: async (sprint: Omit<Sprint, 'id'>): Promise<Sprint> => {
    return await sprintRepository.add(sprint);
  },

  update: async (sprintId: string, updates: Partial<Sprint>): Promise<void> => {
    return await sprintRepository.update(sprintId, updates);
  },

  delete: async (sprintId: string): Promise<void> => {
    return await sprintRepository.delete(sprintId);
  },

  onSprintsChange: (callback: (sprints: Sprint[]) => void) => {
    return sprintRepository.subscribe(callback);
  }
};
