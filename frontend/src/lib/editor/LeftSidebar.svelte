<script lang="ts">
    import ExplorerPane from '../panes/ExplorerPane.svelte';
    import SourceControlPane from '../panes/SourceControlPane.svelte';
    import { Files, GitBranch } from 'lucide-svelte';

    export let state: {
        collapsed: boolean;
        activeSection: string;
    };

    const sections = [
        { id: 'files', icon: Files, component: ExplorerPane },
        { id: 'git', icon: GitBranch, component: SourceControlPane }
    ];
</script>

<div class="h-full flex flex-col bg-gray-900 border-r border-gray-800 {state.collapsed ? 'w-12' : 'w-64'}">
    {#if state.collapsed}
        <div class="flex flex-col items-center py-2 space-y-2">
            {#each sections as section}
                <button
                    class="p-2 hover:bg-gray-800 rounded-sm {state.activeSection === section.id ? 'bg-gray-800 text-gray-200' : 'text-gray-400'}"
                    on:click={() => state.activeSection = section.id}
                >
                    <svelte:component this={section.icon} size={16} />
                </button>
            {/each}
        </div>
    {:else}
        {#if state.activeSection === 'files'}
            <ExplorerPane isActive={true} />
        {:else if state.activeSection === 'git'}
            <SourceControlPane isActive={true} />
        {/if}
    {/if}
</div>