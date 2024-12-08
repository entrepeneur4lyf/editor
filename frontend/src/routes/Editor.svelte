<script lang="ts">
    import { X } from "lucide-svelte";
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
    import { setKeyboardContext } from '@/stores/keyboardStore';
    import { get } from 'svelte/store';
    import Editor from "@/lib/editor/Editor.svelte";

    // Tab state
    let tabs = [
        { id: 1, name: "Current File", active: true },
    ] satisfies Tab[];

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

    function setActiveTab(id: number) {
        tabs = tabs.map((tab) => ({ ...tab, active: tab.id === id }));
    }

    function closeTab(id: number) {
        const newTabs = tabs.filter((tab) => tab.id !== id);
        if (newTabs.length > 0 && !newTabs.some((tab) => tab.active)) {
            newTabs[0].active = true;
        }
        tabs = newTabs;
    }

    function handleResize() {
        editor?.layout();
    }

    onMount(async () => {
        const state = get(projectStore);
        if (state.currentProject?.Path) {
            await fileStore.loadProjectFiles(state.currentProject.Path);
        }

        setKeyboardContext('editor');
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
            <div class="flex items-center border-b border-gray-800 bg-gray-900">
                <div class="flex overflow-x-auto">
                    {#each tabs as tab (tab.id)}
                        <button
                            class="flex items-center h-[34px] px-4 border-r border-gray-800 cursor-pointer {tab.active
                                ? 'bg-gray-900'
                                : 'bg-gray-800 hover:bg-gray-700'} transition-colors duration-200"
                            on:click={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.name}</span>
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
</div>