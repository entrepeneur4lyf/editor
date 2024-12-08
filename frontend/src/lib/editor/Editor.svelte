<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as monaco from 'monaco-editor';
    import { fileStore } from '@/stores/fileStore';

    let editorContainer: HTMLElement;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let currentModel: monaco.editor.ITextModel | null = null;

    function getLanguageFromPath(path: string): string {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        switch (ext) {
            case 'js':
                return 'javascript';
            case 'ts':
                return 'typescript';
            case 'jsx':
            case 'tsx':
                return 'typescript';
            case 'json':
                return 'json';
            case 'css':
                return 'css';
            case 'scss':
                return 'scss';
            case 'html':
                return 'html';
            case 'svelte':
                return 'html'; // Use HTML highlighting for Svelte
            case 'go':
                return 'go';
            case 'py':
                return 'python';
            case 'md':
                return 'markdown';
            case 'yml':
            case 'yaml':
                return 'yaml';
            case 'sh':
                return 'shell';
            default:
                return 'plaintext';
        }
    }

    // Subscribe to active file changes
    $: if ($fileStore.activeFilePath && $fileStore.openFiles.has($fileStore.activeFilePath)) {
        const file = $fileStore.openFiles.get($fileStore.activeFilePath)!;
        updateEditor(file);
    }

    function updateEditor(file: { path: string; content: string; language: string }) {
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
            model.setValue(file.content);
        }

        // Set as current model
        editor.setModel(model);
        currentModel = model;

        // Listen for content changes
        const disposable = model.onDidChangeContent(() => {
            fileStore.updateFileContent(file.path, model!.getValue());
        });

        return () => disposable.dispose();
    }

    onMount(() => {
        // Create editor
        editor = monaco.editor.create(editorContainer, {
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
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

<div class="w-full h-full" bind:this={editorContainer} />
