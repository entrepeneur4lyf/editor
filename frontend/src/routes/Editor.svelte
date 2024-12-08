<script lang="ts">
    import { X, Circle, ChevronLeft, ChevronRight } from "lucide-svelte";
    import { onMount, onDestroy } from 'svelte';
    import type { Tab } from "@/types/editor";
    import type { SidebarState } from "@/types/ui";
    import LeftSidebar from "@/lib/editor/LeftSidebar.svelte";
    import RightSidebar from "@/lib/editor/RightSidebar.svelte";
    import ResizeHandle from "@/lib/editor/ResizeHandle.svelte";
    import Topbar from "@/lib/editor/Topbar.svelte";
    import BottomBar from "@/lib/editor/BottomBar.svelte";
    import { fileStore } from '@/stores/fileStore';
    import { projectStore } from '@/stores/project';
    import { registerCommand, setKeyboardContext } from '@/stores/keyboardStore';
    import { get } from 'svelte/store';
    import Editor from "@/lib/editor/Editor.svelte";
    import FileFinder from "@/lib/components/FileFinder.svelte";

    // Convert open files to tabs
    $: tabs = Array.from($fileStore.openFiles.entries()).map(([path, file]) => ({
        id: path,
        name: path.split('/').pop() || '',
        active: path === $fileStore.activeFilePath,
        isDirty: file.isDirty
    }));

    // Sidebar states
    let leftSidebarState: SidebarState = {
        collapsed: false,
        activeSection: 'files',
        isAllCollapsed: false
    };

    let rightSidebarCollapsed = false;
    let isSourceControlActive = false;
    let isExplorerActive = true;
    let showCommandPalette = false;
    let showFileFinder = false;

    // Sidebar widths
    let leftSidebarWidth = 300;
    let rightSidebarWidth = 600;

    // Source control state
    let modifiedFilesCount = 2;

    let tabsContainer: HTMLDivElement;

    function setActiveTab(id: string) {
        fileStore.setActiveFile(id);
    }

    function closeTab(id: string) {
        fileStore.closeFile(id);
    }

    function handleResize() {
        editor?.layout();
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
            closeTab(id);
        }
    }

    onMount(async () => {
        const state = get(projectStore);
        if (state.currentProject?.Path) {
            await fileStore.loadProjectFiles(state.currentProject.Path);
        }
        
        setKeyboardContext('editor');
        registerCommand('file.showFileFinder', () => showFileFinder = true);
    });

    onDestroy(() => {
        setKeyboardContext('global');
    });

    $: console.log($fileStore);
</script>

<div class="flex flex-col h-screen bg-gray-900 text-gray-300">
    <Topbar 
        bind:isLeftSidebarCollapsed={leftSidebarState.collapsed}
        bind:isRightSidebarCollapsed={rightSidebarCollapsed}
        bind:isSourceControlActive
        bind:isExplorerActive
        {modifiedFilesCount}
        onToggleLeftSidebar={() => leftSidebarState.collapsed = !leftSidebarState.collapsed}
        onToggleRightSidebar={() => rightSidebarCollapsed = !rightSidebarCollapsed}
        onToggleSourceControl={() => isSourceControlActive = !isSourceControlActive}
        onToggleExplorer={() => isExplorerActive = !isExplorerActive}
        showCommandPalette={() => showCommandPalette = true}
        showFileFinder={() => showFileFinder = true}
    />
    
    <div class="flex flex-1 overflow-hidden">
        {#if !leftSidebarState.collapsed}
            <div style="width: {leftSidebarWidth}px" class="flex-shrink-0">
                <LeftSidebar state={leftSidebarState} />
            </div>
            <ResizeHandle 
                side="left" 
                currentWidth={leftSidebarWidth}
                onResize={(width) => {
                    leftSidebarWidth = width;
                    handleResize();
                }}
            />
        {/if}
        
        <main class="flex-1 flex flex-col min-w-0 max-w-full">
            <div class="flex items-center border-b border-gray-800 bg-gray-900 relative">
                <div 
                    bind:this={tabsContainer}
                    class="flex overflow-x-scroll scrollbar-hide relative flex-1"
                >
                    {#each tabs as tab (tab.id)}
                        <button
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
                                on:click|stopPropagation={() => closeTab(tab.id)}
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

            <Editor/>
            
         </main>
        
        {#if !rightSidebarCollapsed}
            <ResizeHandle 
                side="right" 
                currentWidth={rightSidebarWidth}
                onResize={(width) => {
                    rightSidebarWidth = width;
                    handleResize();
                }}
            />
            <div style="width: {rightSidebarWidth}px" class="flex-shrink-0">
                <RightSidebar collapsed={rightSidebarCollapsed} />
            </div>
        {/if}
    </div>
    
    <BottomBar />

    <FileFinder bind:show={showFileFinder} on:close={() => showFileFinder = false} />
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