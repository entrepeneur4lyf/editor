<script lang="ts">
    import * as monaco from 'monaco-editor';
    import { onMount, onDestroy } from 'svelte';
    import { fileStore } from '@/stores/fileStore';

    let editorContainer: HTMLElement;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let currentModel: monaco.editor.ITextModel | null = null;

    function getLanguageFromPath(path: string): string {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        switch (ext) {
            case 'js':
                return 'javascript';
            case 'jsx':
                return 'javascript';
            case 'ts':
                return 'typescript';
            case 'tsx':
                return 'typescript';
            case 'html':
                return 'html';
            case 'svelte':
                return 'html'; // Use HTML highlighting for Svelte
            case 'go':
                return 'go';
            case 'py':
                return 'python';
            case 'json':
                return 'json';
            case 'md':
                return 'markdown';
            case 'css':
                return 'css';
            default:
                return 'plaintext';
        }
    }

    // Subscribe to active file changes
    $: if ($fileStore.activeFilePath && $fileStore.openFiles.has($fileStore.activeFilePath)) {
        const file = $fileStore.openFiles.get($fileStore.activeFilePath)!;
        updateEditor(file);
    }

    async function updateEditor(file: { path: string; content: string; language: string }) {
        if (!editor) return;

        // Create or get model for this file
        let model = monaco.editor.getModel(monaco.Uri.file(file.path));
        if (!model) {
            model = monaco.editor.createModel(
                file.content,
                getLanguageFromPath(file.path),
                monaco.Uri.file(file.path)
            );
        } else {
            const currentValue = model.getValue();
            // Only update if content actually changed
            if (currentValue !== file.content) {
                model.setValue(file.content);
            }
        }

        // Set as current model
        editor.setModel(model);
        currentModel = model;

        // Listen for content changes
        const disposable = model.onDidChangeContent(() => {
            const currentContent = model.getValue();
            if (currentContent !== file.content) {
                fileStore.updateFileContent(file.path, currentContent, true);
            }
        });

        // Add command for saving
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            if (file.path) {
                try {
                    await fileStore.saveFile(file.path);
                } catch (error) {
                    console.error('Error saving file:', error);
                }
            }
        });

        return () => disposable.dispose();
    }

    onMount(() => {
        // Create editor
        editor = monaco.editor.create(editorContainer, {
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: {
                enabled: false
            },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            renderLineHighlight: 'all',
            scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            }
        });

        // Set initial content if there's an active file
        if ($fileStore.activeFilePath) {
            const file = $fileStore.openFiles.get($fileStore.activeFilePath);
            if (file) updateEditor(file);
        }
    });

    onDestroy(() => {
        if (currentModel) {
            currentModel.dispose();
        }
        if (editor) {
            editor.dispose();
        }
    });
</script>

<div
    bind:this={editorContainer}
    class="w-full h-full"
/>
