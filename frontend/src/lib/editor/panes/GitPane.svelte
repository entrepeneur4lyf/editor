<script lang="ts">
    import {
        MoreVertical,
        GitBranch,
        GitCommit,
        Plus,
        RefreshCw,
        Undo,
        Trash2,
        File,
        ChevronDown,
        ChevronRight
    } from 'lucide-svelte';
    import Button from '../../components/Button.svelte';
    import Input from '../../components/Input.svelte';
    import { gitStore } from '@/stores/gitStore';
    import DropdownMenu from '@/lib/components/DropdownMenu.svelte';

    let commitMessage = '';

    // Subscribe to gitStore
    $: stagedChanges = $gitStore.gitStatus.filter(item => item.staged);
    $: unstagedChanges = $gitStore.gitStatus.filter(item => !item.staged);
    $: stagedExpanded = $gitStore.stagedExpanded;
    $: changesExpanded = $gitStore.changesExpanded;

    function handleCommit() {
        // Implement commit functionality
        commitMessage = '';
    }

    // Mock data - Replace with actual Git integration later
    $: if (!$gitStore.gitStatus.length) {
        gitStore.setGitStatus([
            { status: 'modified', file: 'src/App.tsx', staged: true },
            { status: 'new', file: 'src/LeftSidebar.tsx', staged: false }
        ]);
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex items-center justify-between h-[35px] px-4 border-b border-gray-800">
        <div class="flex items-center space-x-2">
            <GitBranch size={16} />
            <span class="text-sm font-medium">Source Control</span>
        </div>
        <div class="flex items-center space-x-1">
            <Button
                variant="ghost"
                size="sm"
                icon={Plus}
                title="Stage All Changes"
                on:click={() => gitStore.stageAll()}
            />
            <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                title="Refresh"
            />
            <div class="relative">
                <Button
                    variant="ghost"
                    size="sm"
                    icon={MoreVertical}
                />
                <DropdownMenu
                    items={[
                        {
                            label: 'Stage All Changes',
                            icon: Plus,
                            onClick: () => gitStore.stageAll()
                        },
                        {
                            label: 'Unstage All Changes',
                            icon: Undo,
                            onClick: () => gitStore.unstageAll()
                        },
                        {
                            label: 'Discard All Changes',
                            icon: Trash2,
                            onClick: () => gitStore.discardAll(),
                            danger: true
                        }
                    ]}
                    onClose={() => {}}
                    show={false}
                />
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-auto flex flex-col">
        <div class="p-1 pt-2 flex-1">
            <!-- Staged Changes Section -->
            {#if stagedChanges.length > 0}
                <div class="mb-4">
                    <div 
                        class="flex items-center text-sm text-gray-500 mb-1 px-2 cursor-pointer hover:text-gray-400"
                        on:click={() => gitStore.toggleStaged()}
                    >
                        <span class="w-4 h-4 flex items-center justify-center">
                            {#if stagedExpanded}
                                <ChevronDown class="w-4 h-4" />
                            {:else}
                                <ChevronRight class="w-4 h-4" />
                            {/if}
                        </span>
                        <span class="font-bold ml-2">Staged Changes ({stagedChanges.length})</span>
                    </div>
                    {#if stagedExpanded}
                        <div>
                            {#each stagedChanges as item}
                                <div class="flex items-center text-sm py-1 group hover:bg-gray-800 rounded-sm mx-1 hover:rounded-md">
                                    <div class="flex items-center px-2 w-full">
                                        <File class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                                        <span 
                                            class="text-gray-300 truncate flex-1" 
                                            title={`${item.file} - ${item.status === 'modified' ? 'modified' : item.status === 'new' ? 'added' : 'deleted'}`}
                                        >
                                            {item.file}
                                        </span>
                                        <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Undo}
                                                title="Unstage Changes"
                                                on:click={() => gitStore.unstageFile(item.file)}
                                            />
                                        </div>
                                        <span class="text-green-500 ml-2 w-4 text-center">{item.status === 'modified' ? 'M' : item.status === 'new' ? 'A' : 'D'}</span>
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
                    <div 
                        class="flex items-center text-sm text-gray-500 mb-1 px-2 cursor-pointer hover:text-gray-400"
                        on:click={() => gitStore.toggleChanges()}
                    >
                        <span class="w-4 h-4 flex items-center justify-center">
                            {#if changesExpanded}
                                <ChevronDown class="w-4 h-4" />
                            {:else}
                                <ChevronRight class="w-4 h-4" />
                            {/if}
                        </span>
                        <span class="font-bold ml-2">Changes ({unstagedChanges.length})</span>
                    </div>
                    {#if changesExpanded}
                        <div>
                            {#each unstagedChanges as item}
                                <div class="flex items-center text-sm py-1 group hover:bg-gray-800 rounded-sm mx-1 hover:rounded-md">
                                    <div class="flex items-center px-2 w-full">
                                        <File class="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                                        <span 
                                            class="text-gray-300 truncate flex-1" 
                                            title={`${item.file} - ${item.status === 'modified' ? 'modified' : item.status === 'new' ? 'untracked' : 'deleted'}`}
                                        >
                                            {item.file}
                                        </span>
                                        <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Plus}
                                                title="Stage Changes"
                                                on:click={() => gitStore.stageFile(item.file)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={Trash2}
                                                title="Discard Changes"
                                                on:click={() => gitStore.discardChanges(item.file)}
                                            />
                                        </div>
                                        <span class="text-yellow-500 ml-2 w-4 text-center">{item.status === 'modified' ? 'M' : item.status === 'new' ? 'U' : 'D'}</span>
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
            />
            <Button
                variant="primary"
                size="sm"
                icon={GitCommit}
                on:click={handleCommit}
                disabled={!commitMessage || (stagedChanges.length === 0)}
            >
                Commit
            </Button>
        </div>
    </div>
</div>
