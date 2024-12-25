<script lang="ts">
    import { X, Circle } from "lucide-svelte";
    import { fileStore } from '@/stores/fileStore';
    import { editorInstanceStore } from '@/stores/editorInstanceStore';
    import TabEditor from "./TabEditor.svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let tabsContainer: HTMLDivElement;
    let editorsContainer: HTMLDivElement;

    // Convert open files to tabs
    $: tabs = Array.from($fileStore.openFiles.entries()).map(([path, file]) => ({
        id: path,
        name: path.split('/').pop() || '',
        active: path === $fileStore.activeFilePath,
        isDirty: file.isDirty
    }));

    function setActiveTab(id: string) {
        fileStore.setActiveFile(id);
        scrollToTab(id);
        dispatch('change', { id });
    }

    function handleCloseTab(id: string) {
        const file = $fileStore.openFiles.get(id);
        if (file?.isDirty) {
            dispatch('closeRequest', { id });
        } else {
            closeTab(id);
        }
    }

    function closeTab(id: string) {
        editorInstanceStore.removeEditor(id);
        fileStore.closeFile(id);
        dispatch('close', { id });
    }

    function scrollToTab(id: string) {
        if (tabsContainer) {
            const tabElement = tabsContainer.querySelector(`[data-tab-id="${id}"]`);
            if (tabElement) {
                const containerWidth = tabsContainer.offsetWidth;
                const tabWidth = (tabElement as HTMLElement).offsetWidth;
                const tabLeft = (tabElement as HTMLElement).offsetLeft;
                const scrollLeft = tabLeft - (containerWidth - tabWidth) / 2;
                
                tabsContainer.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }

    function handleWheel(event: WheelEvent) {
        if (tabsContainer) {
            event.preventDefault();
            tabsContainer.scrollLeft += event.deltaY;
        }
    }

    function handleMouseUp(event: MouseEvent, id: string) {
        if (event.button === 1) { // Middle click
            event.preventDefault();
            handleCloseTab(id);
        }
    }

    // Watch for active file changes and scroll to active tab
    $: if ($fileStore.activeFilePath) {
        setTimeout(() => scrollToTab($fileStore.activeFilePath!), 0);
    }

    // Layout all editors
    export function layout() {
        $editorInstanceStore.forEach(editor => editor?.layout());
    }
</script>

<div class="flex flex-col h-full">
    <!-- Tabs -->
    <div class="flex items-center bg-gray-900 border-b border-gray-700 overflow-x-auto scrollbar-hide relative" 
        bind:this={tabsContainer}
        on:wheel={handleWheel}>
        {#each tabs as tab (tab.id)}
            <button class="flex items-center min-w-0 group"
                class:bg-gray-800={tab.active}
                class:border-t-2={tab.active}
                class:border-blue-500={tab.active}
                class:border-transparent={!tab.active}
                data-tab-id={tab.id}
                on:click={() => setActiveTab(tab.id)}
                on:mouseup={(e) => handleMouseUp(e, tab.id)}>
                <div class="flex items-center px-3 py-1.5 gap-2 hover:bg-gray-800">
                    {#if tab.isDirty}
                        <Circle size={8} class="text-gray-500" />
                    {/if}
                    <span class="truncate text-sm">{tab.name}</span>
                    <button
                        class="opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded p-0.5"
                        on:click|stopPropagation={() => handleCloseTab(tab.id)}>
                        <X size={14} />
                    </button>
                </div>
            </button>
        {/each}
    </div>

    <!-- Editors -->
    <div class="flex-1 relative" bind:this={editorsContainer}>
        {#each tabs as tab (tab.id)}
            <TabEditor 
                filepath={tab.id}
                active={tab.active}
                on:mount={(event) => {
                    const editor = event.detail;
                    if (editor) {
                        editorInstanceStore.setEditor(tab.id, editor);
                    }
                }}
            />
        {/each}
    </div>
</div>

<style>
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
</style>
