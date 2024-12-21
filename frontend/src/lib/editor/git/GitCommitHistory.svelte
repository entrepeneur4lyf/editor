<script lang="ts">
    import { ChevronDown, ChevronRight, GitCommit, Loader } from "lucide-svelte";
    import { gitStore } from "@/stores/gitStore";
    import { onMount } from "svelte";
    import ResizeHandle from "../ResizeHandle.svelte";
    import { formatRelativeTime } from "@/lib/utils/time";

    export let expanded = false;
    let historyHeight = 240; // Default height

    // Load initial commits
    onMount(async () => {
        if (!$gitStore.commits || $gitStore.commits.length === 0) {
            await gitStore.getCommits({ limit: 20 });
        }
    });
</script>

<div class="relative">
    <div class="border-t border-gray-800">
        {#if expanded}
            <ResizeHandle 
                orientation="horizontal"
                side="top"
                bind:size={historyHeight}
                minSize={100}
                maxSize={600}
            />
        {/if}
        <button
            class="flex items-center text-sm text-gray-500 p-2 w-full cursor-pointer hover:text-gray-400 hover:bg-gray-800/50"
            on:click={() => expanded = !expanded}
        >
            <span class="w-4 h-4 flex items-center justify-center">
                {#if expanded}
                    <ChevronDown class="w-4 h-4" />
                {:else}
                    <ChevronRight class="w-4 h-4" />
                {/if}
            </span>
            <span class="font-bold ml-2">Recent Commits</span>
        </button>

        {#if expanded}
            <div class="relative" style="height: {historyHeight}px">
                <div class="absolute inset-0 overflow-y-auto">
                    {#if $gitStore.commitsLoading}
                        <div class="flex items-center justify-center py-4">
                            <Loader class="w-4 h-4 text-gray-500 animate-spin" />
                        </div>
                    {:else if $gitStore.commits && $gitStore.commits.length > 0}
                        {#each $gitStore.commits as commit}
                            <div class="flex items-start p-2 text-sm hover:bg-gray-800/50 group">
                                <GitCommit class="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                                <div class="ml-2 flex-1 min-w-0">
                                    <div class="flex items-center justify-between">
                                        <span class="font-mono text-xs text-gray-500">{commit.hash.substring(0, 7)}</span>
                                        <span class="text-xs text-gray-500">{formatRelativeTime(commit.date)}</span>
                                    </div>
                                    <p class="text-gray-300 truncate" title={commit.message}>
                                        {commit.message}
                                    </p>
                                    <p class="text-xs text-gray-500 truncate">
                                        {commit.author}
                                    </p>
                                </div>
                            </div>
                        {/each}
                    {:else}
                        <div class="text-sm text-gray-500 p-2">No commits found</div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>
