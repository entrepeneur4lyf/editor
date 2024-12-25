<script lang="ts">
    import * as monaco from 'monaco-editor';
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    import { fileStore } from '@/stores/fileStore';
    import { editorConfigStore } from '@/stores/editorConfigStore';
    import { editorStateStore } from '@/stores/editorStateStore';
    import { initVimMode, VimMode } from 'monaco-vim';
    import { focusStore } from '@/stores/focusStore';
    import Breadcrumbs from "@/lib/editor/Breadcrumbs.svelte";
    import DiffHeader from "@/lib/editor/git/changes/DiffHeader.svelte";
    import { addKeyboardContext } from '@/stores/keyboardStore';
    import { get } from 'svelte/store';

    const dispatch = createEventDispatcher();

    export let filepath: string;
    export let active = false;

    let editorContainer: HTMLElement;
    let editor: monaco.editor.IStandaloneCodeEditor;
    let vimMode: { dispose: () => void } | null = null;
    let vimStatusBar: HTMLElement;
    let vimEnabled = false;
    let editorId = focusStore.generateId('editor');

    // Get file content and language
    $: file = $fileStore.openFiles.get(filepath);
    $: content = file?.content || '';
    $: language = file?.language || 'plaintext';
    $: state = $editorStateStore[filepath];

    // Export layout function for parent to call
    export function layout() {
        if (editor) {
            editor.layout();
        }
    }

    onMount(() => {
        if (!editorContainer) return;

        // Create editor with initial config
        const config = $editorConfigStore.editor;
        editor = monaco.editor.create(editorContainer, {
            value: content,
            language,
            theme: config.theme,
            fontSize: config.fontSize,
            tabSize: config.tabSize,
            wordWrap: config.wordWrap ? 'on' : 'off',
            lineNumbers: config.lineNumbers ? (config.relativeLines ? 'relative' : 'on') : 'off',
            minimap: {
                enabled: config.minimap
            },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            renderLineHighlight: 'all',
            scrollbar: {
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            },
            stickyScroll: {
                enabled: config.stickyScroll
            }
        });

        // Setup vim mode if enabled
        if (config.vimMode) {
            vimStatusBar = document.createElement('div');
            vimStatusBar.className = 'vim-status-bar absolute bottom-0 left-0 bg-gray-800 text-gray-300 px-2 py-0.5 text-sm';
            editorContainer.appendChild(vimStatusBar);
            vimMode = initVimMode(editor, vimStatusBar);
            vimEnabled = true;
        }

        // Add keyboard context
        addKeyboardContext('editor');

        // Save file on Ctrl+S
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
            try {
                await fileStore.saveFile(filepath);
            } catch (error) {
                console.error('Error saving file:', error);
            }
        });

        // Watch for content changes
        const disposable = editor.onDidChangeModelContent(() => {
            const value = editor.getValue();
            fileStore.updateFileContent(filepath, value);
        });

        // Restore editor state if exists
        if ($editorStateStore[filepath]) {
            editorStateStore.restoreState(filepath, editor);
        }

        return () => {
            disposable.dispose();
        };
    });

    onDestroy(() => {
        if (editor) {
            // Save editor state before destroying
            editorStateStore.saveState(filepath, editor);
            
            // Cleanup vim mode
            if (vimMode) {
                vimMode.dispose();
            }

            // Dispose editor
            editor.dispose();
        }
    });

    // Watch for config changes
    $: if (editor && $editorConfigStore) {
        const config = $editorConfigStore.editor;
        editor.updateOptions({
            theme: config.theme,
            fontSize: config.fontSize,
            tabSize: config.tabSize,
            wordWrap: config.wordWrap ? 'on' : 'off',
            lineNumbers: config.lineNumbers ? (config.relativeLines ? 'relative' : 'on') : 'off',
            minimap: {
                enabled: config.minimap
            }
        });
    }

    // Watch for content changes from fileStore
    $: if (editor && content !== editor.getValue()) {
        const position = editor.getPosition();
        editor.setValue(content);
        if (position) {
            editor.setPosition(position);
        }
    }

    // Handle active state
    $: if (editor && active) {
        editor.focus();
        focusStore.focus('editor', editorId);
    }
</script>

<div class="h-full relative flex flex-col" class:hidden={!active}>
    {#if filepath}
        {#if filepath.startsWith('[diff]')}
            <DiffHeader {filepath} />
        {:else}
            <Breadcrumbs {filepath} />
        {/if}
    {/if}

    <div class="flex-1 relative" bind:this={editorContainer}></div>
    
    {#if vimEnabled}
        <div class="vim-status-bar" bind:this={vimStatusBar}></div>
    {/if}
</div>

<style>
    .hidden {
        display: none;
    }
    .vim-status-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 20px;
        background-color: #1e1e1e;
        color: #d4d4d4;
        padding: 0 8px;
        font-family: monospace;
        font-size: 12px;
        line-height: 20px;
        z-index: 1;
    }
</style>
