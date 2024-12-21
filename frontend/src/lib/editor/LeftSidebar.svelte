<script lang="ts">
    import type { SidebarState } from "@/types/ui";
    import ExplorerPane from './panes/ExplorerPane.svelte';
    import GitPane from './panes/GitPane.svelte';
    import { fileStore } from '@/stores/fileStore';

    export let state: SidebarState;

    // Subscribe to fileStore
    $: fileTree = $fileStore.fileTree || undefined;
</script>

<div class="h-full w-full flex flex-col overflow-hidden border-r border-gray-800">
    <div class="flex flex-col h-full">
        {#if state.activeSection === 'files'}
            <ExplorerPane {fileTree} />
        {/if}

        {#if state.activeSection === 'git'}
            <GitPane />
        {/if}
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