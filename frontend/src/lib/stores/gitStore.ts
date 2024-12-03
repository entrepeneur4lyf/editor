import { writable } from 'svelte/store';

export interface GitStatusItem {
    status: 'modified' | 'new' | 'deleted' | 'renamed';
    file: string;
    staged: boolean;
}

interface GitStore {
    changes: GitStatusItem[];
    loading: boolean;
    error: string | null;
}

function createGitStore() {
    const { subscribe, set, update } = writable<GitStore>({
        changes: [],
        loading: false,
        error: null
    });

    return {
        subscribe,
        
        // Set the entire list of changes
        setChanges: (changes: GitStatusItem[]) => {
            update(store => ({ ...store, changes }));
        },

        // Stage a file
        stageFile: (file: string) => {
            update(store => ({
                ...store,
                changes: store.changes.map(item => 
                    item.file === file ? { ...item, staged: true } : item
                )
            }));
        },

        // Unstage a file
        unstageFile: (file: string) => {
            update(store => ({
                ...store,
                changes: store.changes.map(item => 
                    item.file === file ? { ...item, staged: false } : item
                )
            }));
        },

        // Stage all files
        stageAll: () => {
            update(store => ({
                ...store,
                changes: store.changes.map(item => ({ ...item, staged: true }))
            }));
        },

        // Unstage all files
        unstageAll: () => {
            update(store => ({
                ...store,
                changes: store.changes.map(item => ({ ...item, staged: false }))
            }));
        },

        // Set loading state
        setLoading: (loading: boolean) => {
            update(store => ({ ...store, loading }));
        },

        // Set error state
        setError: (error: string | null) => {
            update(store => ({ ...store, error }));
        },

        // Clear error state
        clearError: () => {
            update(store => ({ ...store, error: null }));
        }
    };
}

export const gitStore = createGitStore();
