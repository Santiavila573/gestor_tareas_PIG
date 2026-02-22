import { taskRepository } from '../repositories/TaskRepository';
import { Task } from '../models/types';

export const tasksService = {
  getAll: async (): Promise<Task[]> => {
    return await taskRepository.getAll();
  },

  getBySprintId: async (sprintId: string): Promise<Task[]> => {
    return await taskRepository.getBySprintId(sprintId);
  },

  add: async (task: Omit<Task, 'id'>): Promise<Task> => {
    // Business logic can be added here (e.g. validation)
    return await taskRepository.add(task);
  },

  update: async (taskId: string, updates: Partial<Task>): Promise<void> => {
    return await taskRepository.update(taskId, updates);
  },

  delete: async (taskId: string): Promise<void> => {
    return await taskRepository.delete(taskId);
  },

  onTasksChange: (callback: (tasks: Task[]) => void) => {
    return taskRepository.subscribe(callback);
  }
};
