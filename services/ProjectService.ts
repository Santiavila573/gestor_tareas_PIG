import { projectRepository } from '../repositories/ProjectRepository';
import { Project } from '../models/types';

export const projectsService = {
  getAll: async (): Promise<Project[]> => {
    return await projectRepository.getAll();
  },

  add: async (project: Omit<Project, 'id'>): Promise<Project> => {
    return await projectRepository.add(project);
  },

  update: async (projectId: string, updates: Partial<Project>): Promise<void> => {
    return await projectRepository.update(projectId, updates);
  },

  delete: async (projectId: string): Promise<void> => {
    return await projectRepository.delete(projectId);
  },

  onProjectsChange: (callback: (projects: Project[]) => void) => {
    return projectRepository.subscribe(callback);
  }
};
