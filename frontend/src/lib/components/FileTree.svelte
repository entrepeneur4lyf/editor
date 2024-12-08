<script lang="ts">
    import { RefreshCw, ChevronsUp, Plus } from 'lucide-svelte';
    import FileTreeItem from '../editor/FileTreeItem.svelte';
    import ContextMenu from '../editor/ContextMenu.svelte';
    import Button from './Button.svelte';
    import type { service } from '@/lib/wailsjs/go/models';
    import { fileStore } from '@/stores/fileStore';

    type FileNode = service.FileNode;

    export let fileTree: FileNode[] = [];
    export let isAllCollapsed = false;

    let contextMenu = {
        show: false,
        x: 0,
        y: 0,
        targetItem: null as FileNode | null
    };

    function handleContextMenu(e: MouseEvent, item: FileNode) {
        e.preventDefault();
        contextMenu = {
            show: true,
            x: e.clientX,
            y: e.clientY,
            targetItem: item
        };
    }

    function handleRename(path: string, newName: string) {
        // TODO: Implement rename functionality
        console.log('Rename', path, 'to', newName);
    }

    function handleCloseContextMenu() {
        contextMenu.show = false;
    }

    function handleContextMenuAction(action: string) {
        if (!contextMenu.targetItem) return;

        switch (action) {
            case 'rename':
                // TODO: Implement rename
                break;
            case 'delete':
                // TODO: Implement delete
                break;
            case 'newFile':
                // TODO: Implement new file
                break;
            case 'newFolder':
                // TODO: Implement new folder
                break;
        }
        handleCloseContextMenu();
    }
</script>

<div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-2 py-1 border-b border-gray-800">
        <div class="flex items-center space-x-1">
            <Button
                variant="ghost"
                size="icon-sm"
                title="Refresh"
                on:click={() => fileStore.refreshFiles()}
            >
                <RefreshCw size={14} />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                title="Collapse All"
                on:click={() => {
                    isAllCollapsed = true;
                    fileTree = fileTree.map(item => ({
                        ...item,
                        expanded: false,
                        children: item.children?.map(child => ({ ...child, expanded: false }))
                    }));
                }}
            >
                <ChevronsUp size={14} />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                title="Expand All"
                on:click={() => {
                    isAllCollapsed = false;
                    fileTree = fileTree.map(item => ({
                        ...item,
                        expanded: true,
                        children: item.children?.map(child => ({ ...child, expanded: true }))
                    }));
                }}
            >
                <ChevronsUp size={14} class="rotate-180" />
            </Button>
        </div>
        <Button
            variant="ghost"
            size="icon-sm"
            title="New File"
            on:click={() => handleContextMenuAction('newFile')}
        >
            <Plus size={14} />
        </Button>
    </div>

    <!-- File Tree -->
    <div class="flex-1 overflow-auto">
        {#if $fileStore.loading}
            <div class="p-4 text-sm text-gray-500">Loading files...</div>
        {:else if $fileStore.error}
            <div class="p-4 text-sm text-red-500">{$fileStore.error}</div>
        {:else if fileTree && fileTree.length > 0}
            {#each fileTree as item (item.path)}
                <FileTreeItem
                    {item}
                    onContextMenu={handleContextMenu}
                    onRename={handleRename}
                    {isAllCollapsed}
                />
            {/each}
        {:else}
            <div class="p-4 text-sm text-gray-500">No files found</div>
        {/if}
    </div>

    <!-- Context Menu -->
    {#if contextMenu.show}
        <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={handleCloseContextMenu}
            items={[
                { label: 'New File', action: () => handleContextMenuAction('newFile') },
                { label: 'New Folder', action: () => handleContextMenuAction('newFolder') },
                { label: 'Rename', action: () => handleContextMenuAction('rename') },
                { label: 'Delete', action: () => handleContextMenuAction('delete') }
            ]}
        />
    {/if}
</div>
