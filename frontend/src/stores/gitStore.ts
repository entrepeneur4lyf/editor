import { writable } from 'svelte/store';

export type GitStatus = 'modified' | 'new' | 'deleted';

export interface GitStatusItem {
    file: string;
    status: GitStatus;
    staged: boolean;
}

interface GitState {
    gitStatus: GitStatusItem[];
    stagedExpanded: boolean;
    changesExpanded: boolean;
}

function createGitStore() {
    const { subscribe, set, update } = writable<GitState>({
        gitStatus: [],
        stagedExpanded: true,
        changesExpanded: true
    });

    return {
        subscribe,
        
        toggleStaged: () => update(state => ({
            ...state,
            stagedExpanded: !state.stagedExpanded
        })),

        toggleChanges: () => update(state => ({
            ...state,
            changesExpanded: !state.changesExpanded
        })),

        setGitStatus: (status: GitStatusItem[]) => update(state => ({
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
            changesExpanded: true
        })
    };
}

export const gitStore = createGitStore();
