import { writable } from 'svelte/store';
import type { FileNode, FileState, OpenFile, Tab } from '@/types/files';
import { GetProjectFiles, GetFileContent } from '@/lib/wailsjs/go/main/App';

const initialState: FileState = {
    fileTree: null,
    activeFilePath: null,
    openFiles: new Map(),
    loading: false,
    error: null,
};

function createFileStore() {
    const { subscribe, set, update } = writable<FileState>(initialState);

    return {
        subscribe,
        
        // Load project files
        async loadProjectFiles(projectPath: string) {
            update(state => ({ ...state, loading: true, error: null }));
            
            try {
                const fileTree = await GetProjectFiles(projectPath);
                // Convert the Go FileNode to our FileNode type
                const convertedTree = convertGoFileNode(fileTree);
                update(state => ({ ...state, fileTree: convertedTree, loading: false }));
            } catch (err) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to load project files'
                }));
            }
        },

        // Open a file
        async openFile(path: string) {
            update(state => {
                if (state.openFiles.has(path)) {
                    return { ...state, activeFilePath: path };
                }
                return { ...state, loading: true, error: null };
            });

            try {
                const content = await GetFileContent(path);
                update(state => {
                    const newOpenFiles = new Map(state.openFiles);
                    const openFile: OpenFile = {
                        path,
                        content,
                        isDirty: false,
                        language: path.split('.').pop() || 'text',
                        cursor: { line: 0, column: 0 }
                    };
                    newOpenFiles.set(path, openFile);
                    return {
                        ...state,
                        openFiles: newOpenFiles,
                        activeFilePath: path,
                        loading: false
                    };
                });
            } catch (err) {
                update(state => ({
                    ...state,
                    loading: false,
                    error: err instanceof Error ? err.message : 'Failed to open file'
                }));
            }
        },

        // Close a file
        closeFile(path: string) {
            update(state => {
                const newOpenFiles = new Map(state.openFiles);
                newOpenFiles.delete(path);
                
                const activeFilePath = state.activeFilePath === path
                    ? Array.from(newOpenFiles.keys())[0] || null
                    : state.activeFilePath;
                
                return { ...state, openFiles: newOpenFiles, activeFilePath };
            });
        },

        // Set files (for example, from the initial file tree)
        setFiles(files: FileNode[]) {
            const rootNode: FileNode = {
                id: 'root',
                name: '',
                path: '',
                type: 'folder',
                children: files
            };
            update(state => ({ ...state, fileTree: rootNode }));
        },

        // Add a file
        addFile(file: FileNode) {
            update(state => {
                if (!state.fileTree?.children) return state;
                return {
                    ...state,
                    fileTree: {
                        ...state.fileTree,
                        children: [...state.fileTree.children, file]
                    }
                };
            });
        },

        // Update file content
        updateFileContent(path: string, content: string) {
            update(state => {
                const openFile = state.openFiles.get(path);
                if (!openFile) return state;

                const newOpenFiles = new Map(state.openFiles);
                newOpenFiles.set(path, { ...openFile, content, isDirty: true });
                return { ...state, openFiles: newOpenFiles };
            });
        },

        // Update cursor position
        updateCursor(path: string, line: number, column: number) {
            update(state => {
                const openFile = state.openFiles.get(path);
                if (!openFile) return state;

                const newOpenFiles = new Map(state.openFiles);
                newOpenFiles.set(path, { ...openFile, cursor: { line, column } });
                return { ...state, openFiles: newOpenFiles };
            });
        },

        // Reset store
        reset() {
            set(initialState);
        },
    };
}

// Helper function to convert Go FileNode to our FileNode type
function convertGoFileNode(node: any): FileNode {
    return {
        id: node.path, // Use path as id since it's unique
        name: node.name,
        path: node.path,
        type: node.type === 'directory' ? 'folder' : 'file',
        expanded: false,
        metadata: {
            size: node.size,
            modified: new Date(node.lastModified),
            type: node.type
        },
        children: node.children?.map(convertGoFileNode)
    };
}

export const fileStore = createFileStore();
