<script lang="ts">
    import { Files, RefreshCw, Plus, ChevronLeft } from 'lucide-svelte';
    import FileTreeItem from '../editor/FileTreeItem.svelte';
    import Button from '../components/Button.svelte';
    import type { FileNode } from '../../types';
    import { setKeyboardContext } from '../stores/keyboardStore';
    import { createEventDispatcher } from 'svelte';
    import { tooltip } from '@/lib/actions/tooltip';

    export let isActive = false;
    const dispatch = createEventDispatcher();

    $: if (isActive) {
        setKeyboardContext('fileManager');
    }

    const initialFileTree: FileNode[] = [
        {
            id: '1',
            name: 'src',
            type: 'folder',
            path: '/src',
            expanded: true,
            children: [
                { id: '2', name: 'lib', type: 'folder', path: '/src/lib', children: [] },
                { id: '3', name: 'routes', type: 'folder', path: '/src/routes', children: [] },
                { id: '4', name: 'App.tsx', type: 'file', path: '/src/App.tsx' }
            ]
        }
    ];

    let fileTree = initialFileTree;
    let isAllCollapsed = false;

    function collapseAll() {
        isAllCollapsed = true;
        fileTree = fileTree.map(item => ({
            ...item,
            expanded: false,
            children: item.children?.map(child => ({ ...child, expanded: false })) || []
        }));
        dispatch('collapseAll');
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
        <div class="flex items-center space-x-2">
            <Files size={16} />
            <span class="text-sm font-medium">Explorer</span>
        </div>
        <div class="flex items-center space-x-1">
            <div use:tooltip={{ content: "Collapse All", shortcut: "Ctrl+←" }}>
                <Button
                    variant="ghost"
                    size="sm"
                    on:click={collapseAll}
                >
                    <ChevronLeft size={16} />
                </Button>
            </div>
            <div use:tooltip={{ content: "Refresh Explorer" }}>
                <Button
                    variant="ghost"
                    size="sm"
                >
                    <RefreshCw size={16} />
                </Button>
            </div>
            <div use:tooltip={{ content: "New File" }}>
                <Button
                    variant="ghost"
                    size="sm"
                >
                    <Plus size={16} />
                </Button>
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-auto">
        {#each fileTree as item}
            <FileTreeItem {item} />
        {/each}
    </div>
</div>
