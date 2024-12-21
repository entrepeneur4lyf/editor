import { writable, get } from 'svelte/store';
import { IsGitRepository, InitGitRepository, GetGitStatus, StageFile, UnstageFile, DiscardChanges } from '@/lib/wailsjs/go/main/App';
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

                // Don't clear the list immediately, just set loading state
                update(state => ({ ...state, isLoading: true, error: null }));

                const status = await GetGitStatus(projectPath);

                // Only update once we have the new data
                update(state => ({ 
                    ...state, 
                    gitStatus: status,
                    isLoading: false,
                    error: null 
                }));
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    isLoading: false,
                    error: `Failed to get repository status: ${error.message}` 
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

        async stageFile(file: string) {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                // Add to loading set but keep existing status
                update(state => ({ 
                    ...state, 
                    loadingFiles: new Set([...state.loadingFiles, file])
                }));

                // Optimistically update the UI by moving the file to staged
                update(state => ({
                    ...state,
                    gitStatus: state.gitStatus.map(item => 
                        item.file === file 
                            ? { ...item, staged: true }
                            : item
                    )
                }));

                await StageFile(projectPath, file);
                // No need to refresh if the operation succeeded
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    error: `Failed to stage file: ${error.message}` 
                }));
                // Only refresh if there was an error
                await this.refreshStatus();
            } finally {
                update(state => {
                    const loadingFiles = new Set(state.loadingFiles);
                    loadingFiles.delete(file);
                    return { ...state, loadingFiles };
                });
            }
        },

        async unstageFile(file: string) {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ 
                    ...state, 
                    loadingFiles: new Set([...state.loadingFiles, file])
                }));

                // Optimistically update the UI by moving the file to unstaged
                update(state => ({
                    ...state,
                    gitStatus: state.gitStatus.map(item => 
                        item.file === file 
                            ? { ...item, staged: false }
                            : item
                    )
                }));

                await UnstageFile(projectPath, file);
                // No need to refresh if the operation succeeded
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    error: `Failed to unstage file: ${error.message}` 
                }));
                // Only refresh if there was an error
                await this.refreshStatus();
            } finally {
                update(state => {
                    const loadingFiles = new Set(state.loadingFiles);
                    loadingFiles.delete(file);
                    return { ...state, loadingFiles };
                });
            }
        },

        async discardChanges(file: string) {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                update(state => ({ 
                    ...state, 
                    loadingFiles: new Set([...state.loadingFiles, file])
                }));

                // Optimistically update the UI by removing the file from the list
                update(state => ({
                    ...state,
                    gitStatus: state.gitStatus.filter(item => item.file !== file)
                }));

                await DiscardChanges(projectPath, file);
                // No need to refresh if the operation succeeded
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    error: `Failed to discard changes: ${error.message}` 
                }));
                // Only refresh if there was an error
                await this.refreshStatus();
            } finally {
                update(state => {
                    const loadingFiles = new Set(state.loadingFiles);
                    loadingFiles.delete(file);
                    return { ...state, loadingFiles };
                });
            }
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
