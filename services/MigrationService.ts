import {
  collection,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Sprint, Project } from '../models/types';

const COLLECTIONS = {
  TASKS: 'tasks',
  SPRINTS: 'sprints',
  PROJECTS: 'projects',
  USERS: 'users',
  NOTES: 'personalNotes'
};

export const migrationService = {
  // Migrate data from localStorage to Firebase
  migrateFromLocalStorage: async () => {
    try {
      const batch = writeBatch(db);

      // Migrate Tasks
      const localTasks = localStorage.getItem('scrum_tasks_v2');
      if (localTasks) {
        const tasks: Task[] = JSON.parse(localTasks);
        for (const task of tasks) {
          const { id, ...taskData } = task;
          const taskRef = doc(collection(db, COLLECTIONS.TASKS));
          batch.set(taskRef, taskData);
        }
      }

      // Migrate Sprints
      const localSprints = localStorage.getItem('scrum_sprints_v2');
      if (localSprints) {
        const sprints: Sprint[] = JSON.parse(localSprints);
        for (const sprint of sprints) {
          const { id, ...sprintData } = sprint;
          const sprintRef = doc(collection(db, COLLECTIONS.SPRINTS));
          batch.set(sprintRef, sprintData);
        }
      }

      // Migrate Projects
      const localProjects = localStorage.getItem('scrum_projects_v2');
      if (localProjects) {
        const projects: Project[] = JSON.parse(localProjects);
        for (const project of projects) {
          const { id, ...projectData } = project;
          const projectRef = doc(collection(db, COLLECTIONS.PROJECTS));
          batch.set(projectRef, projectData);
        }
      }

      await batch.commit();
      
      console.log('Migration completed successfully!');
      return true;
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }
};
