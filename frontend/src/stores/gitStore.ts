import { writable, get } from 'svelte/store';
import { 
    IsGitRepository, 
    InitGitRepository, 
    GetGitStatus, 
    StageFile, 
    UnstageFile, 
    DiscardChanges, 
    Commit, 
    ListBranches, 
    GetCurrentBranch,
    ListCommits,
    ListCommitsAfter,
    ListCommitsByBranch,
    ListCommitsByAuthor,
    SearchCommits
} from '@/lib/wailsjs/go/main/App';
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
    branches: service.BranchInfo[];
    currentBranch: string | null;
    commits: service.CommitInfo[];
    commitsLoading: boolean;
    commitsError: string | null;
}

function createGitStore() {
    const { subscribe, set, update } = writable<GitState>({
        gitStatus: [],
        stagedExpanded: true,
        changesExpanded: true,
        isRepository: false,
        isLoading: true,
        loadingFiles: new Set(),
        error: null,
        branches: [],
        currentBranch: null,
        commits: [],
        commitsLoading: false,
        commitsError: null
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
                update(state => ({ ...state, isRepository: isRepo }));

                // If it's a repository, get the initial status and branches
                if (isRepo) {
                    await Promise.all([
                        this.refreshStatus(),
                        this.refreshBranches()
                    ]);
                }
                
                update(state => ({ ...state, isLoading: false }));
            } catch (error) {
                update(state => ({
                    ...state,
                    isLoading: false,
                    error: `Failed to check repository status: ${error}`
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
                    error: `Failed to get repository status: ${error}`
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
                    error: `Failed to initialize repository: ${error}`
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

        async stageFile(file: string): Promise<void> {
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

                // Optimistically update the UI
                update(state => {
                    const gitStatus = state.gitStatus?.map(item => {
                        if (item.file === file) {
                            return {
                                ...item,
                                staged: true,
                                // Change status from '?' to 'A' for untracked files
                                status: item.status === '?' ? 'A' : item.status
                            };
                        }
                        return item;
                    }) || [];
                    return { ...state, gitStatus };
                });

                await StageFile(projectPath, file);
                // No need to refresh if the operation succeeded
            } catch (error) {
                update(state => ({
                    ...state,
                    error: `Failed to stage file: ${error}`
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
                    error: `Failed to unstage file: ${error}`
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

        async discardChanges(file: string): Promise<void> {
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
                    gitStatus: state.gitStatus?.filter(item => item.file !== file) || []
                }));

                await DiscardChanges(projectPath, file);
            } catch (error) {
                update(state => ({
                    ...state,
                    error: `Failed to discard changes: ${error}`
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

        async commit(message: string): Promise<void> {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                // After successful commit, refresh the git status
                update(state => ({ ...state, isLoading: true, error: null }));
                await Commit(projectPath, message);
                await this.refreshStatus();
            } catch (error) {
                update(state => ({
                    ...state,
                    isLoading: false,
                    error: `Failed to commit changes: ${error}`
                }));
            }
        },

        async refreshBranches() {
            try {
                const projectPath = get(fileStore).currentProjectPath;
                if (!projectPath) {
                    return;
                }

                const [branches, currentBranch] = await Promise.all([
                    ListBranches(projectPath),
                    GetCurrentBranch(projectPath)
                ]);

                update(state => ({
                    ...state,
                    branches,
                    currentBranch,
                    error: null
                }));
            } catch (error) {
                update(state => ({
                    ...state,
                    error: `Failed to get branch information: ${error}`
                }));
            }
        },

        async getCommits(filter: service.CommitFilter) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await ListCommits(projectPath, filter);
                update(state => ({ ...state, commits }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async getCommitsAfter(offsetHash: string, limit: number) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await ListCommitsAfter(projectPath, offsetHash, limit);
                update(state => ({ ...state, commits }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async getBranchCommits(branch: string, limit: number) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await ListCommitsByBranch(projectPath, branch, limit);
                update(state => ({ ...state, commits }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async getAuthorCommits(author: string, limit: number) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await ListCommitsByAuthor(projectPath, author, limit);
                update(state => ({ ...state, commits }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async searchCommits(query: string, limit: number) {
            const projectPath = get(fileStore).currentProjectPath;
            if (!projectPath) {
                return;
            }

            update(state => ({ ...state, commitsLoading: true, commitsError: null }));
            try {
                const commits = await SearchCommits(projectPath, query, limit);
                update(state => ({ ...state, commits }));
            } catch (error) {
                update(state => ({ ...state, commitsError: error.message }));
            } finally {
                update(state => ({ ...state, commitsLoading: false }));
            }
        },

        async loadMoreCommits(limit: number) {
            const state = get(this);
            if (state.commits.length === 0) {
                return;
            }

            const lastCommit = state.commits[state.commits.length - 1];
            const newCommits = await this.getCommitsAfter(lastCommit.hash, limit);
            
            if (newCommits) {
                update(state => ({ 
                    ...state, 
                    commits: [...state.commits, ...newCommits]
                }));
            }
        },

        reset: () => set({
            gitStatus: [],
            stagedExpanded: true,
            changesExpanded: true,
            isRepository: false,
            isLoading: false,
            loadingFiles: new Set(),
            error: null,
            branches: [],
            currentBranch: null,
            commits: [],
            commitsLoading: false,
            commitsError: null
        })
    };
}

export const gitStore = createGitStore();
