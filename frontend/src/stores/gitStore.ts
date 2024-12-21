import { writable, get } from 'svelte/store';
import { IsGitRepository, InitGitRepository, GetGitStatus, StageFile, UnstageFile } from '@/lib/wailsjs/go/main/App';
import { fileStore } from '@/stores/fileStore';
import type { service } from '@/lib/wailsjs/go/models';

interface GitState {
    gitStatus: service.FileStatus[];
    stagedExpanded: boolean;
    changesExpanded: boolean;
    isRepository: boolean;
    isLoading: boolean;
    loadingFiles: Set<string>;
    error: string | null;
}

function createGitStore() {
    const { subscribe, set, update } = writable<GitState>({
        gitStatus: [],
        stagedExpanded: true,
        changesExpanded: true,
        isRepository: false,
        isLoading: true,
        loadingFiles: new Set(),
        error: null
    });

    return {
        subscribe,
        
        async checkRepository() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ ...state, isLoading: true, error: null }));
                const isRepo = await IsGitRepository(projectPath);
                update(state => ({ ...state, isRepository: isRepo, isLoading: false }));

                // If it's a repository, get the initial status
                if (isRepo) {
                    await this.refreshStatus();
                }
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    isLoading: false, 
                    error: `Failed to check repository status: ${error.message}` 
                }));
            }
        },

        async refreshStatus() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ ...state, isLoading: true, error: null }));
                const status = await GetGitStatus(projectPath);
                update(state => ({ 
                    ...state, 
                    gitStatus: status,
                    isLoading: false 
                }));
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    isLoading: false, 
                    error: `Failed to get Git status: ${error.message}` 
                }));
            }
        },

        async initRepository() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ ...state, isLoading: true, error: null }));
                await InitGitRepository(projectPath);
                update(state => ({ ...state, isRepository: true, isLoading: false }));
                
                // Get initial status after initialization
                await this.refreshStatus();
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    isLoading: false, 
                    error: `Failed to initialize repository: ${error.message}` 
                }));
            }
        },

        toggleStagedExpanded: () => update(state => ({
            ...state,
            stagedExpanded: !state.stagedExpanded
        })),

        toggleChangesExpanded: () => update(state => ({
            ...state,
            changesExpanded: !state.changesExpanded
        })),

        setGitStatus: (status: service.FileStatus[]) => update(state => ({
            ...state,
            gitStatus: status
        })),

        stageFile: async (file: string) => {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ 
                    ...state, 
                    loadingFiles: new Set([...state.loadingFiles, file])
                }));
                
                await StageFile(projectPath, file);
                const status = await GetGitStatus(projectPath);
                
                update(state => {
                    const newLoadingFiles = new Set(state.loadingFiles);
                    newLoadingFiles.delete(file);
                    return { 
                        ...state, 
                        gitStatus: status,
                        loadingFiles: newLoadingFiles,
                        error: null
                    };
                });
            } catch (error) {
                update(state => {
                    const newLoadingFiles = new Set(state.loadingFiles);
                    newLoadingFiles.delete(file);
                    return { 
                        ...state, 
                        loadingFiles: newLoadingFiles,
                        error: `Failed to stage file: ${error.message}` 
                    };
                });
            }
        },

        unstageFile: async (file: string) => {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ 
                    ...state, 
                    loadingFiles: new Set([...state.loadingFiles, file])
                }));
                
                await UnstageFile(projectPath, file);
                const status = await GetGitStatus(projectPath);
                
                update(state => {
                    const newLoadingFiles = new Set(state.loadingFiles);
                    newLoadingFiles.delete(file);
                    return { 
                        ...state, 
                        gitStatus: status,
                        loadingFiles: newLoadingFiles,
                        error: null
                    };
                });
            } catch (error) {
                update(state => {
                    const newLoadingFiles = new Set(state.loadingFiles);
                    newLoadingFiles.delete(file);
                    return { 
                        ...state, 
                        loadingFiles: newLoadingFiles,
                        error: `Failed to unstage file: ${error.message}` 
                    };
                });
            }
        },

        discardChanges: async (file: string) => {
            // TODO: Implement with backend
            console.log('Discarding changes:', file);
        },

        reset: () => set({
            gitStatus: [],
            stagedExpanded: true,
            changesExpanded: true,
            isRepository: false,
            isLoading: false,
            loadingFiles: new Set(),
            error: null
        })
    };
}

export const gitStore = createGitStore();
