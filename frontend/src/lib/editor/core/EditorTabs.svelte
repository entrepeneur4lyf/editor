<script lang="ts">
    import { X, Circle, ChevronLeft, ChevronRight } from "lucide-svelte";
    import { fileStore } from '@/stores/fileStore';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let tabsContainer: HTMLDivElement;

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

    function scrollTabs(direction: 'left' | 'right') {
        if (tabsContainer) {
            const scrollAmount = 200;
            const targetScroll = tabsContainer.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            tabsContainer.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    }

    function handleTabClick(event: MouseEvent, id: string) {
        if (event.button === 1) { // Middle click
            event.preventDefault();
            handleCloseTab(id);
        }
    }

    // Watch for active file changes
    $: if ($fileStore.activeFilePath) {
        setTimeout(() => scrollToTab($fileStore.activeFilePath!), 0);
    }
</script>

<div class="flex items-center border-b border-gray-800 bg-gray-900 relative">
    <div 
        bind:this={tabsContainer}
        class="flex overflow-x-scroll scrollbar-hide relative flex-1"
    >
        {#each tabs as tab (tab.id)}
            <button
                data-tab-id={tab.id}
                class="flex items-center h-[34px] px-4 border-r border-gray-800 cursor-pointer relative
                    {tab.active
                        ? 'bg-gray-900 before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-sky-500'
                        : 'bg-gray-800 hover:bg-gray-700'} 
                    transition-colors duration-200"
                on:click={() => setActiveTab(tab.id)}
                on:mouseup={(e) => handleTabClick(e, tab.id)}
            >
                <span class="flex items-center gap-2">
                    {#if tab.isDirty}
                        <Circle size={8} class="fill-current text-gray-300" />
                    {/if}
                    {tab.name}
                </span>
                <button
                    on:click|stopPropagation={() => handleCloseTab(tab.id)}
                    class="ml-2 text-gray-400 hover:text-gray-100 transition-colors duration-200"
                    aria-label="Close {tab.name}"
                >
                    <X size={14} />
                </button>
            </button>
        {/each}
    </div>
    <div class="flex items-center gap-1 border-gray-800 bg-gray-900 pl-1 sticky right-0">
        <button
            on:click={() => scrollTabs('left')}
            class="p-1.5 hover:bg-gray-800 transition-colors duration-200 rounded-md border border-gray-700"
            aria-label="Scroll tabs left"
        >
            <ChevronLeft size={16} />
        </button>
        <button
            on:click={() => scrollTabs('right')}
            class="p-1.5 hover:bg-gray-800 transition-colors duration-200 rounded-md border border-gray-700"
            aria-label="Scroll tabs right"
        >
            <ChevronRight size={16} />
        </button>
    </div>
</div>

<style>
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
</style>
