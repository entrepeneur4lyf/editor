<script lang="ts">
    import {
        ChevronDown,
        ChevronRight,
        FolderOpen,
        Folder,
        File,
        Loader2,
    } from "lucide-svelte";
    import type { service } from '@/lib/wailsjs/go/models';
    import { fileStore } from '@/stores/fileStore';
    import { LoadDirectoryContents } from '@/lib/wailsjs/go/main/App';

    type FileNode = service.FileNode;

    export let item: FileNode;
    export let depth = 0;
    export let onContextMenu: (e: MouseEvent, item: FileNode) => void;
    export let onRename: (path: string, newName: string) => void;
    export let isAllCollapsed = false;

    let isOpen = false;
    let isLoading = false;
    let isRenaming = false;
    let editingName = item.name;
    let inputElement: HTMLInputElement;

    $: isDirectory = item.type === "directory";
    $: hasChildren = isDirectory && item.children && item.children.length > 0;
    $: isActive = $fileStore.activeFilePath === item.path;

    $: {
        if (isAllCollapsed) {
            isOpen = false;
        }
    }

    async function toggleFolder(e: MouseEvent) {
        e.stopPropagation();
        if (isDirectory) {
            if (!item.isLoaded && !isOpen) {
                isLoading = true;
                try {
                    const updatedNode = await LoadDirectoryContents(item.path);
                    if (updatedNode) {
                        item.children = updatedNode.children;
                        item.isLoaded = true;
                    }
                } catch (error) {
                    console.error('Error loading directory:', error);
                } finally {
                    isLoading = false;
                }
            }
            isOpen = !isOpen;
        } else {
            fileStore.openFile(item.path);
        }
    }

    function startRename() {
        isRenaming = true;
        editingName = item.name;
        // Focus and select text after the component updates
        setTimeout(() => {
            if (inputElement) {
                inputElement.focus();
                inputElement.select();
            }
        }, 0);
    }

    function handleRenameKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            finishRename();
        } else if (e.key === 'Escape') {
            cancelRename();
        }
    }

    function finishRename() {
        if (editingName && editingName !== item.name) {
            onRename(item.path, editingName);
        }
        isRenaming = false;
    }

    function cancelRename() {
        editingName = item.name;
        isRenaming = false;
    }
</script>

<div class="relative">
    <div
        class="flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer group rounded-sm mx-1 hover:rounded-md {isActive ? 'bg-sky-800' : ''}"
        on:click={toggleFolder}
        on:contextmenu|preventDefault={(e) => onContextMenu(e, item)}
        on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFolder(e);
            } else if (e.key === 'F2') {
                startRename();
            }
        }}
        role="button"
        tabindex="0"
        aria-expanded={item.type === 'directory' ? isOpen : undefined}
        aria-label={`${item.name} ${item.type}`}
    >
        <div class="flex items-center flex-1 overflow-hidden" style="padding-left: {depth * 0.5}rem">
            {#if isDirectory}
                <div class="w-4 h-4 flex items-center justify-center">
                    {#if isLoading}
                        <Loader2 class="animate-spin" size={16} />
                    {:else if hasChildren}
                        {#if isOpen}
                            <ChevronDown size={16} />
                        {:else}
                            <ChevronRight size={16} />
                        {/if}
                    {/if}
                </div>
                <div class="w-4 h-4 ml-1 text-sky-400">
                    {#if isOpen}
                        <FolderOpen size={16} />
                    {:else}
                        <Folder size={16} />
                    {/if}
                </div>
            {:else}
                <div class="w-4 h-4 ml-5">
                    <File size={16} />
                </div>
            {/if}

            {#if isRenaming}
                <input
                    bind:this={inputElement}
                    bind:value={editingName}
                    on:blur={finishRename}
                    on:keydown={handleRenameKeydown}
                    class="ml-2 px-1 py-0.5 bg-gray-800 border border-sky-500 rounded text-sm focus:outline-none"
                />
            {:else}
                <span class="ml-2 text-sm truncate" class:font-medium={isActive}>
                    {item.name}
                </span>
            {/if}
        </div>
    </div>

    {#if isOpen && hasChildren}
        <div>
            {#each item.children as child (child.path)}
                <svelte:self
                    item={child}
                    depth={depth + 1}
                    {onContextMenu}
                    {onRename}
                    {isAllCollapsed}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    input {
        outline: none;
    }
</style>
