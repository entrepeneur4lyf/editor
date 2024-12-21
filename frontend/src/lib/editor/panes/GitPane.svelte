<script lang="ts">
    import {
        MoreVertical,
        GitBranch,
        GitCommit,
        Plus,
        RefreshCw,
        Undo,
        Trash2,
        File
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
                                    />
                                </div>
                                <span class="text-green-500 ml-2 w-4 text-center">{item.status === 'modified' ? 'M' : item.status === 'new' ? 'A' : 'D'}</span>
                            </div>
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
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Trash2}
                                        title="Discard Changes"
                                    />
                                </div>
                                <span class="text-yellow-500 ml-2 w-4 text-center">{item.status === 'modified' ? 'M' : item.status === 'new' ? 'U' : 'D'}</span>
                            </div>
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
