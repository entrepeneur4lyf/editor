<script lang="ts">
    import { Archive, GitBranch, GitCommit, GitMerge, GitPullRequest, MoreVertical, Upload } from 'lucide-svelte';
    import { gitStore } from '@/lib/stores/gitStore';
    import { setKeyboardContext } from '@/lib/stores/keyboardStore';
    import GitChanges from '@/lib/components/GitChanges.svelte';
    import DropdownMenu from '@/lib/components/DropdownMenu.svelte';

    export let isActive = false;
    let showActions = false;

    $: if (isActive) {
        setKeyboardContext('git');
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex items-center justify-between p-2 text-gray-400">
        <div class="flex items-center space-x-2">
            <GitBranch size={16} />
            <span class="text-sm font-medium">Source Control</span>
        </div>
        <div class="relative">
            <button
                class="p-1 hover:bg-gray-800 rounded-sm"
                on:click={() => showActions = !showActions}
            >
                <MoreVertical size={14} />
            </button>
            <DropdownMenu
                show={showActions}
                onClose={() => showActions = false}
                items={[
                    { icon: GitCommit, label: 'Commit', onClick: () => gitStore.commit() },
                    { icon: GitPullRequest, label: 'Pull', onClick: () => gitStore.pull() },
                    { icon: Upload, label: 'Push', onClick: () => gitStore.push() },
                    { icon: Archive, label: 'Stash', onClick: () => gitStore.stash() }
                ]}
            />
        </div>
    </div>

    <div class="flex-1 overflow-auto">
        <GitChanges />
    </div>
</div>
