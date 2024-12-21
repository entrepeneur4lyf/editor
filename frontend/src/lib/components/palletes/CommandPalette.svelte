<script lang="ts">
    import { onMount } from 'svelte';
    import BasePalette from './components/BasePalette.svelte';
    import CommandItem from './components/CommandItem.svelte';
    import ResultsList from './components/ResultsList.svelte';
    import { commandStore } from '@/stores/commandStore';
    import { focusStore } from '@/stores/focusStore';
    import type { Command } from '@/types/command';

    export let show = false;
    export let searchQuery = '';
    let selectedIndex = 0;
    let previousShow = show;
    let filteredCommands: Command[] = [];
    let paletteId = focusStore.generateId('command-palette');

    $: {
        if (searchQuery.trim() === '') {
            filteredCommands = $commandStore;
        } else {
            const query = searchQuery.toLowerCase();
            filteredCommands = $commandStore.filter(command => {
                const label = command.label.toLowerCase();
                const category = command.category?.toLowerCase() || '';
                const context = command.context?.join(' ').toLowerCase() || '';
                return label.includes(query) || category.includes(query) || context.includes(query);
            });
        }
    }

    // Reset selection when commands change
    $: {
        selectedIndex = Math.min(selectedIndex, Math.max(0, filteredCommands.length - 1));
    }

    // Initialize when opening
    $: if (show && !previousShow) {
        searchQuery = '';
        selectedIndex = 0;
        previousShow = show;
    } else if (!show) {
        previousShow = show;
    }

    function executeCommand(command: Command) {
        if (command.action) {
            command.action();
        }
        show = false;
    }

    function handleSelect() {
        if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
        }
    }
</script>

<BasePalette
    bind:show
    bind:searchQuery
    paletteId={paletteId}
    placeholder="Type a command..."
    bind:selectedIndex
    totalItems={filteredCommands.length}
    on:select={handleSelect}
>
    <ResultsList 
        {selectedIndex} 
        isEmpty={filteredCommands.length === 0}
        emptyMessage={searchQuery ? "No commands found" : "No commands available"}
    >
        {#each filteredCommands as command, index (command.id)}
            <CommandItem
                {command}
                {index}
                selected={index === selectedIndex}
                onClick={() => executeCommand(command)}
            />
        {/each}
    </ResultsList>
</BasePalette>
