<script lang="ts">
    import { ChevronDown, ChevronRight, GitCommit, Loader } from "lucide-svelte";
    import { gitStore } from "@/stores/gitStore";
    import { onMount } from "svelte";
    import ResizeHandle from "../ResizeHandle.svelte";
    import { formatRelativeTime } from "@/lib/utils/time";

    export let expanded = false;
    let historyHeight = 240; // Default height
    let loadingMore = false;
    let scrollContainer: HTMLDivElement;

    // Load initial commits
    onMount(async () => {
        if (!$gitStore.commits || $gitStore.commits.length === 0) {
            await gitStore.getCommits({ limit: 20 });
        }
    });

    async function loadMoreCommits() {
        if (loadingMore || !$gitStore.commits?.length) return;
        
        const lastCommit = $gitStore.commits[$gitStore.commits.length - 1];
        if (!lastCommit.hasMore) return;

        loadingMore = true;
        try {
            await gitStore.getCommitsAfter(lastCommit.hash, 20);
        } catch (error) {
            console.error('Failed to load more commits:', error);
        } finally {
            loadingMore = false;
        }
    }

    function handleScroll(event: Event) {
        const target = event.target as HTMLDivElement;
        const bottom = target.scrollHeight - target.scrollTop - target.clientHeight;
        
        // Load more when within 50px of the bottom
        if (bottom < 50) {
            loadMoreCommits();
        }
    }
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
                <div 
                    bind:this={scrollContainer}
                    on:scroll={handleScroll}
                    class="absolute inset-0 overflow-y-auto"
                >
                    {#if $gitStore.commitsLoading && !loadingMore}
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
                        {#if loadingMore}
                            <div class="flex items-center justify-center py-2 text-sm text-gray-500">
                                <Loader class="w-4 h-4 animate-spin mr-2" />
                                Loading more commits...
                            </div>
                        {:else if $gitStore.commits[$gitStore.commits.length - 1]?.hasMore}
                            <div class="text-center py-2 text-xs text-gray-500">
                                Scroll to load more commits
                            </div>
                        {:else}
                            <div class="text-center py-2 text-xs text-gray-500">
                                No more commits to load
                            </div>
                        {/if}
                    {:else}
                        <div class="text-sm text-gray-500 p-2">No commits found</div>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
</div>
