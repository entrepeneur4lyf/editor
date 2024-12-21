import { writable, get } from 'svelte/store';
import { IsGitRepository, InitGitRepository } from '@/lib/wailsjs/go/main/App';
import { fileStore } from '@/stores/fileStore';


export interface GitStatus {
    file: string;
    status: 'modified' | 'new' | 'deleted';
    staged: boolean;
}

interface GitState {
    gitStatus: GitStatus[];
    stagedExpanded: boolean;
    changesExpanded: boolean;
    isRepository: boolean;
    isLoading: boolean;
    error: string | null;
}

function createGitStore() {
    const { subscribe, set, update } = writable<GitState>({
        gitStatus: [],
        stagedExpanded: true,
        changesExpanded: true,
        isRepository: false,
        isLoading: true,
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
            } catch (error) {
                update(state => ({ 
                    ...state, 
                    isLoading: false, 
                    error: `Failed to check repository status: ${error.message}` 
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

        setGitStatus: (status: GitStatus[]) => update(state => ({
            ...state,
            gitStatus: status
        })),

        stageFile: (file: string) => update(state => ({
            ...state,
            gitStatus: state.gitStatus.map(item =>
                item.file === file ? { ...item, staged: true } : item
            )
        })),

        unstageFile: (file: string) => update(state => ({
            ...state,
            gitStatus: state.gitStatus.map(item =>
                item.file === file ? { ...item, staged: false } : item
            )
        })),

        discardChanges: (file: string) => update(state => ({
            ...state,
            gitStatus: state.gitStatus.filter(item => item.file !== file)
        })),

        reset: () => set({
            gitStatus: [],
            stagedExpanded: true,
            changesExpanded: true,
            isRepository: false,
            isLoading: false,
            error: null
        })
    };
}

export const gitStore = createGitStore();
