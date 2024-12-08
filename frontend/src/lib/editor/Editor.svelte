<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as monaco from 'monaco-editor';
    import { fileStore } from '@/stores/fileStore';

    let editorContainer: HTMLElement;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let currentModel: monaco.editor.ITextModel | null = null;
    let currentPath: string | null = null;

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
                return 'html';
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

    let isInitialized = false;

    function initializeEditor() {
        if (isInitialized || !editorContainer) return;
        
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

        editor.onDidChangeModelContent(() => {
            if (currentPath) {
                const isDirty = editor.getValue() !== $fileStore.openFiles.get(currentPath)?.content;
                if (isDirty) {
                    fileStore.markAsDirty(currentPath);
                }
            }
        });

        isInitialized = true;
    }

    function updateEditorContent(file: { path: string; content: string; language: string }) {
        if (!editor || !file) return;

        const uri = monaco.Uri.file(file.path);
        
        // Only create/update model if it's a different file
        if (currentPath !== file.path) {
            let model = monaco.editor.getModel(uri);
            
            if (!model) {
                model = monaco.editor.createModel(
                    file.content,
                    getLanguageFromPath(file.path),
                    uri
                );
            }
            
            if (currentModel && currentModel !== model) {
                currentModel.dispose();
            }
            
            currentModel = model;
            editor.setModel(model);
            currentPath = file.path;
        }
    }

    $: if ($fileStore.activeFilePath && $fileStore.openFiles.has($fileStore.activeFilePath)) {
        const file = $fileStore.openFiles.get($fileStore.activeFilePath)!;
        if (!isInitialized) {
            initializeEditor();
        }
        if (file.path !== currentPath) {
            updateEditorContent(file);
        }
    }

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
