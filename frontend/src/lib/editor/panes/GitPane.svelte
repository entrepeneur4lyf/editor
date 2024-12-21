<script lang="ts">
    import {
        GitBranch,
        GitCommit,
        RefreshCw,
        ChevronDown,
        ChevronRight,
        File,
        Undo,
        Plus,
        Trash2,
        Loader,
    } from "lucide-svelte";
    import Button from "@/lib/components/Button.svelte";
    import Input from "@/lib/components/Input.svelte";
    import { gitStore } from "@/stores/gitStore";
    import { onMount } from "svelte";

    let commitMessage = "";
    let commitInProgress = false;

    // Derived values for staged and unstaged changes
    $: stagedChanges = $gitStore.gitStatus?.filter((item) => item.staged) || [];
    $: unstagedChanges =
        $gitStore.gitStatus?.filter((item) => !item.staged) || [];

    // Refresh both status and branches
    async function refreshAll() {
        await Promise.all([
            gitStore.refreshStatus(),
            gitStore.refreshBranches(),
        ]);
    }

    onMount(async () => {
        await gitStore.checkRepository();
    });

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case "D":
                return "text-rose-500"; // Deleted
            case "M":
                return "text-blue-500"; // Modified
            case "?":
                return "text-gray-500"; // Untracked
            case "A":
                return "text-green-500"; // Added
            case "R":
                return "text-purple-500"; // Renamed
            case "C":
                return "text-yellow-500"; // Copied
            case "U":
                return "text-orange-500"; // Unmerged
            default:
                return "text-gray-500";
        }
    };

    // Handle commit action
    async function handleCommit() {
        if (!commitMessage || stagedChanges.length === 0 || commitInProgress)
            return;

        commitInProgress = true;
        try {
            await gitStore.commit(commitMessage);
            commitMessage = "";
        } catch (error) {
            console.error("Failed to commit:", error);
        } finally {
            commitInProgress = false;
        }
    }

    // Handle keyboard shortcuts
    function handleKeydown(event: KeyboardEvent) {
        // ⌘Enter or Ctrl+Enter to commit
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            handleCommit();
        }
    }
</script>

<div class="flex flex-col h-full">
    <div
        class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800"
    >
        <div class="flex items-center space-x-2">
            {#if $gitStore.isLoading}
                <Loader class="w-4 h-4 text-gray-500 animate-spin" />
            {:else}
                <GitBranch size={16} />
            {/if}
            <span class="text-sm font-medium">Source Control</span>
        </div>
        <div class="flex items-center space-x-1">
            <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                title="Refresh"
                on:click={() => refreshAll()}
                disabled={$gitStore.isLoading}
            />
        </div>
    </div>

    <div class="flex-1 overflow-auto flex flex-col">
        {#if $gitStore.isLoading}
            <div
                class="flex flex-col items-center justify-center h-full space-y-3"
            >
                <Loader class="w-6 h-6 text-gray-500 animate-spin" />
                <span class="text-sm text-gray-500"
                    >Loading Git Repository...</span
                >
            </div>
        {:else if !$gitStore.isRepository}
            <div
                class="flex flex-col items-center justify-center h-full p-4 space-y-4"
            >
                <div class="text-center">
                    This directory is not a Git repository
                </div>
                <Button
                    variant="primary"
                    on:click={() => gitStore.initRepository()}
                >
                    Initialize Repository
                </Button>
            </div>
        {:else if $gitStore.error}
            <div
                class="flex flex-col items-center justify-center h-full p-4 space-y-4"
            >
                <div class="text-error text-center">
                    {$gitStore.error}
                </div>
                <Button
                    variant="primary"
                    on:click={() => gitStore.checkRepository()}
                >
                    Retry
                </Button>
            </div>
        {:else}
            <!-- Staged and Unstaged Changes Section -->
            <div class="p-1 pt-2 flex-1">
                <!-- Staged Changes Section -->
                {#if stagedChanges.length > 0}
                    <div class="mb-4">
                        <button
                            class="flex items-center text-sm text-gray-500 mb-1 px-2 cursor-pointer hover:text-gray-400"
                            on:click={() => gitStore.toggleStagedExpanded()}
                        >
                            <span
                                class="w-4 h-4 flex items-center justify-center"
                            >
                                {#if $gitStore.stagedExpanded}
                                    <ChevronDown class="w-4 h-4" />
                                {:else}
                                    <ChevronRight class="w-4 h-4" />
                                {/if}
                            </span>
                            <span class="font-bold ml-2"
                                >Staged Changes ({stagedChanges.length})</span
                            >
                        </button>
                        {#if $gitStore.stagedExpanded}
                            <div>
                                {#each stagedChanges as item}
                                    <div
                                        class="flex items-center text-sm py-1 group hover:bg-gray-800 rounded-sm mx-1 hover:rounded-md"
                                    >
                                        <div
                                            class="flex items-center px-2 w-full"
                                        >
                                            {#if $gitStore.loadingFiles.has(item.file)}
                                                <Loader
                                                    class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0 animate-spin"
                                                />
                                            {:else}
                                                <File
                                                    class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0"
                                                />
                                            {/if}
                                            <span
                                                class="text-gray-300 truncate flex-1"
                                                title={item.file}
                                            >
                                                {item.file}
                                            </span>
                                            <div
                                                class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Undo}
                                                    title="Unstage Changes"
                                                    on:click={() =>
                                                        gitStore.unstageFile(
                                                            item.file,
                                                        )}
                                                    disabled={$gitStore.loadingFiles.has(
                                                        item.file,
                                                    )}
                                                />
                                            </div>
                                            <span
                                                class={`ml-2 w-4 font-semibold text-center ${getStatusColor(item.status)}`}
                                            >
                                                {#if $gitStore.loadingFiles.has(item.file)}
                                                    <span
                                                        class="loading loading-spinner loading-xs"
                                                    ></span>
                                                {:else}
                                                    {item.status}
                                                {/if}
                                            </span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}

                <!-- Changes Section -->
                {#if unstagedChanges.length > 0}
                    <div class="mb-4">
                        <button
                            class="flex items-center text-sm text-gray-500 mb-1 px-2 cursor-pointer hover:text-gray-400"
                            on:click={() => gitStore.toggleChangesExpanded()}
                        >
                            <span
                                class="w-4 h-4 flex items-center justify-center"
                            >
                                {#if $gitStore.changesExpanded}
                                    <ChevronDown class="w-4 h-4" />
                                {:else}
                                    <ChevronRight class="w-4 h-4" />
                                {/if}
                            </span>
                            <span class="font-bold ml-2"
                                >Changes ({unstagedChanges.length})</span
                            >
                        </button>
                        {#if $gitStore.changesExpanded}
                            <div>
                                {#each unstagedChanges as item}
                                    <div
                                        class="flex items-center text-sm py-1 group hover:bg-gray-800 rounded-sm mx-1 hover:rounded-md"
                                    >
                                        <div
                                            class="flex items-center px-2 w-full"
                                        >
                                            {#if $gitStore.loadingFiles.has(item.file)}
                                                <Loader
                                                    class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0 animate-spin"
                                                />
                                            {:else}
                                                <File
                                                    class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0"
                                                />
                                            {/if}
                                            <span
                                                class="text-gray-300 truncate flex-1"
                                                title={item.file}
                                            >
                                                {item.file}
                                            </span>
                                            <div
                                                class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Plus}
                                                    title="Stage Changes"
                                                    on:click={() =>
                                                        gitStore.stageFile(
                                                            item.file,
                                                        )}
                                                    disabled={$gitStore.loadingFiles.has(
                                                        item.file,
                                                    )}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Trash2}
                                                    title="Discard Changes"
                                                    on:click={() =>
                                                        gitStore.discardChanges(
                                                            item.file,
                                                        )}
                                                    disabled={$gitStore.loadingFiles.has(
                                                        item.file,
                                                    )}
                                                />
                                            </div>
                                            <span
                                                class={`ml-2 w-4 font-semibold text-center ${getStatusColor(item.status)}`}
                                            >
                                                {#if $gitStore.loadingFiles.has(item.file)}
                                                    <span
                                                        class="loading loading-spinner loading-xs"
                                                    ></span>
                                                {:else}
                                                    {item.status}
                                                {/if}
                                            </span>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Commit Section -->
            <div class="p-2 border-t border-gray-800">
                <Input
                    variant="textarea"
                    bind:value={commitMessage}
                    placeholder="Message (⌘Enter to commit)"
                    on:keydown={handleKeydown}
                />
                <Button
                    variant="primary"
                    size="sm"
                    icon={GitCommit}
                    on:click={handleCommit}
                    disabled={!commitMessage ||
                        stagedChanges.length === 0 ||
                        commitInProgress}
                >
                    {#if commitInProgress}
                        <Loader class="w-4 h-4 animate-spin" />
                        Committing...
                    {:else}
                        Commit
                    {/if}
                </Button>
            </div>
        {/if}
    </div>
</div>
