<script lang="ts">
    import {
        MoreVertical,
        GitBranch,
        Plus,
        RefreshCw,
        Undo,
        GitCommit,
        Trash2
    } from 'lucide-svelte';
    import Button from '../../components/Button.svelte';
    import Input from '../../components/Input.svelte';
    import DropdownMenu from '../../components/DropdownMenu.svelte';
    import type { GitStatusItem } from '@/types';

    // Mock data for now - will be replaced with actual git integration
    const gitStatus: GitStatusItem[] = [
        { status: 'modified', file: 'src/App.tsx', staged: true },
        { status: 'new', file: 'src/LeftSidebar.tsx', staged: false }
    ];

    let commitMessage = '';
    $: stagedChanges = gitStatus.filter(item => item.staged);
    $: unstagedChanges = gitStatus.filter(item => !item.staged);

    function handleCommit() {
        // Implement commit functionality
        commitMessage = '';
    }

    function handleStageAll() {
        // Implement stage all functionality
    }

    function handleUnstageAll() {
        // Implement unstage all functionality
    }

    function handleDiscardAll() {
        // Implement discard all functionality
    }

    // Mock data for commits - replace with actual git log data
    const recentCommits = [
        {
            hash: 'abc1234',
            message: 'feat: Add source control panel',
            author: 'John Doe',
            date: '2 hours ago',
            files: ['src/lib/editor/LeftSidebar.svelte', 'src/lib/editor/Editor.svelte']
        },
        {
            hash: 'def5678',
            message: 'fix: Resolve sidebar collapse issues',
            author: 'Jane Smith',
            date: '3 hours ago',
            files: ['src/lib/editor/LeftSidebar.svelte']
        }
    ];
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
                on:click={handleStageAll}
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
                            onClick: handleStageAll
                        },
                        {
                            label: 'Unstage All Changes',
                            icon: Undo,
                            onClick: handleUnstageAll
                        },
                        {
                            label: 'Discard All Changes',
                            icon: Trash2,
                            onClick: handleDiscardAll,
                            danger: true
                        }
                    ]}
                />
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-auto flex flex-col">
        <div class="p-1 pt-2 flex-1">
            <!-- Staged Changes -->
            {#if stagedChanges.length > 0}
                <div class="mb-4">
                    <div class="text-xs text-gray-500 font-medium px-4 py-1">
                        Staged Changes
                    </div>
                    {#each stagedChanges as item}
                        <div class="flex items-center px-4 py-1 hover:bg-gray-800 cursor-pointer text-sm">
                            <span class="text-green-500 mr-2">M</span>
                            {item.file}
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Unstaged Changes -->
            {#if unstagedChanges.length > 0}
                <div>
                    <div class="text-xs text-gray-500 font-medium px-4 py-1">
                        Changes
                    </div>
                    {#each unstagedChanges as item}
                        <div class="flex items-center px-4 py-1 hover:bg-gray-800 cursor-pointer text-sm">
                            <span class="text-yellow-500 mr-2">M</span>
                            {item.file}
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Commit Section -->
        <div class="p-2 border-t border-gray-800">
            <Input
                variant="textarea"
                bind:value={commitMessage}
                placeholder="Message (⌘Enter to commit)"
                class="mb-2"
            />
            <Button
                variant="primary"
                size="sm"
                icon={GitCommit}
                class="w-full"
                on:click={handleCommit}
                disabled={!commitMessage || (stagedChanges.length === 0)}
            >
                Commit
            </Button>
        </div>
    </div>
</div>
