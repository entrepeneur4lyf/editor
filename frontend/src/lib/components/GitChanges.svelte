<script lang="ts">
    import { Check } from 'lucide-svelte';
    import { gitStore } from '@/lib/stores/gitStore';
    import Input from './Input.svelte';
    import Button from './Button.svelte';

    let commitMessage = '';

    $: stagedChanges = $gitStore.status.filter(item => item.staged);
    $: unstagedChanges = $gitStore.status.filter(item => !item.staged);

    function handleCommit() {
        if (commitMessage.trim()) {
            gitStore.commit(commitMessage);
            commitMessage = '';
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            handleCommit();
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'modified':
                return 'M';
            case 'added':
                return 'A';
            case 'deleted':
                return 'D';
            case 'renamed':
                return 'R';
            default:
                return '?';
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'modified':
                return 'text-yellow-500';
            case 'added':
                return 'text-green-500';
            case 'deleted':
                return 'text-red-500';
            case 'renamed':
                return 'text-blue-500';
            default:
                return 'text-gray-500';
        }
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex-1 overflow-auto">
        <!-- Staged Changes -->
        {#if stagedChanges.length > 0}
            <div class="mb-4">
                <h3 class="text-sm font-medium px-3 py-1">Staged Changes</h3>
                {#each stagedChanges as item}
                    <button
                        class="flex items-center w-full px-3 py-1 hover:bg-gray-800 text-left"
                        on:click={() => gitStore.unstageFile(item.file)}
                        on:keydown={e => e.key === 'Enter' && gitStore.unstageFile(item.file)}
                    >
                        <span class="{getStatusColor(item.status)} mr-2">{getStatusIcon(item.status)}</span>
                        <span class="truncate">{item.file}</span>
                    </button>
                {/each}
            </div>
        {/if}

        <!-- Unstaged Changes -->
        {#if unstagedChanges.length > 0}
            <div>
                <h3 class="text-sm font-medium px-3 py-1">Changes</h3>
                {#each unstagedChanges as item}
                    <button
                        class="flex items-center w-full px-3 py-1 hover:bg-gray-800 text-left"
                        on:click={() => gitStore.stageFile(item.file)}
                        on:keydown={e => e.key === 'Enter' && gitStore.stageFile(item.file)}
                    >
                        <span class="{getStatusColor(item.status)} mr-2">{getStatusIcon(item.status)}</span>
                        <span class="truncate">{item.file}</span>
                    </button>
                {/each}
            </div>
        {/if}

        {#if stagedChanges.length === 0 && unstagedChanges.length === 0}
            <div class="text-sm text-gray-500 px-3 py-2">
                No changes detected
            </div>
        {/if}
    </div>

    <!-- Commit Section -->
    <div class="p-2 border-t border-gray-800">
        <Input
            variant="textarea"
            bind:value={commitMessage}
            placeholder="Message (⌘Enter to commit)"
            rows={2}
            on:keydown={handleKeyDown}
        />
        <div class="flex justify-end mt-2">
            <Button
                variant="primary"
                size="sm"
                icon={Check}
                disabled={!commitMessage.trim() || stagedChanges.length === 0}
                on:click={handleCommit}
            >
                Commit
            </Button>
        </div>
    </div>
</div>
