import { writable } from 'svelte/store';
import { AddProject, GetRecentProjects, OpenProjectFolder } from '@/lib/wailsjs/go/main/App';
import { fileStore } from './fileStore';
import type { db } from '@/lib/wailsjs/go/models';

export interface ProjectState {
    currentProject: db.Project | null;
    recentProjects: db.Project[];
    loading: boolean;
    error: string | null;
}

const initialState: ProjectState = {
    currentProject: null,
    recentProjects: [],
    loading: false,
    error: null
};

function createProjectStore() {
    const { subscribe, set, update } = writable<ProjectState>(initialState);

    return {
        subscribe,

        // Load recent projects
        async loadRecentProjects() {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const projects = await GetRecentProjects();
                update(state => ({ ...state, recentProjects: projects, loading: false }));
            } catch (err) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to load recent projects'
                }));
            }
        },

        // Open project folder dialog
        async openProjectFolder() {
            try {
                const path = await OpenProjectFolder();
                if (!path) return null;

                // Extract project name from path
                const name = path.split('/').pop() || path;
                return { name, path };
            } catch (err) {
                update(state => ({
                    ...state,
                    error: err instanceof Error ? err.message : 'Failed to open project folder'
                }));
                return null;
            }
        },

        // Add or update project
        async addProject(name: string, path: string) {
            update(state => ({ ...state, loading: true, error: null }));
            try {
                const project = await AddProject(name, path);
                update(state => ({
                    ...state,
                    currentProject: project,
                    recentProjects: [project, ...state.recentProjects.filter(p => p.Path !== project.Path)],
                    loading: false
                }));

                // Load project files
                await fileStore.loadProjectFiles(path);

                return project;
            } catch (err) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to add project'
                }));
                return null;
            }
        },

        // Set current project
        async setCurrentProject(project: db.Project) {
            update(state => ({ ...state, currentProject: project, loading: true }));
            try {
                await fileStore.loadProjectFiles(project.Path);
                update(state => ({ ...state, loading: false }));
            } catch (err) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to load project files'
                }));
            }
        },

        // Reset store
        reset() {
            set(initialState);
            fileStore.reset();
        }
    };
}

export const projectStore = createProjectStore();
