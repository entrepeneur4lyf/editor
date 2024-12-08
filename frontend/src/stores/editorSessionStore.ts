import { writable } from 'svelte/store';

interface EditorSession {
    vim: {
        enabled: boolean;
        mode: string;
        statusBarElement: HTMLElement | null;
    };
}

const defaultSession: EditorSession = {
    vim: {
        enabled: false,
        mode: 'normal',
        statusBarElement: null
    }
};

function createEditorSessionStore() {
    const { subscribe, update, set } = writable<EditorSession>(defaultSession);

    return {
        subscribe,
        
        // Toggle Vim mode
        toggleVim: (enabled: boolean) => {
            update(session => ({
                ...session,
                vim: {
                    ...session.vim,
                    enabled
                }
            }));
        },

        // Update Vim mode
        setVimMode: (mode: string) => {
            update(session => ({
                ...session,
                vim: {
                    ...session.vim,
                    mode
                }
            }));
        },

        // Set status bar element
        setVimStatusBar: (element: HTMLElement | null) => {
            update(session => ({
                ...session,
                vim: {
                    ...session.vim,
                    statusBarElement: element
                }
            }));
        },

        // Reset session
        reset: () => set(defaultSession)
    };
}

export const editorSessionStore = createEditorSessionStore();
