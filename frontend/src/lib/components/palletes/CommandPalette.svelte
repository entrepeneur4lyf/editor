<script lang="ts">
    import { onMount, createEventDispatcher, afterUpdate, onDestroy } from 'svelte';
    import BasePalette from './components/BasePalette.svelte';
    import ResultsList from './components/ResultsList.svelte';
    import CommandItem from './components/CommandItem.svelte';
    import { fuzzySearch } from '@/lib/utils/fuzzySearch';
    import { commandStore, type Command } from '@/stores/commandStore';
    import { keyBindings, formatKeybinding, addKeyboardContext, removeKeyboardContext, type KeyBinding } from '@/stores/keyboardStore';
    import { focusStore } from '@/stores/focusStore';

    const dispatch = createEventDispatcher();

    export let show = false;
    let previousShow = show;

    let searchQuery = '';
    let selectedIndex = 0;
    let filteredCommands: Command[] = [];
    let vimModeEnabled = false;

    let paletteId = focusStore.generateId('command-palette');

    // Convert keyboard bindings to commands
    $: allCommands = Object.entries($keyBindings).map(([id, binding]) => ({
        id,
        label: binding.description || id,
        category: binding.category,
        context: binding.context?.join(', ') || 'global',
        shortcut: formatKeybinding(binding),
        action: binding.action
    }));

    // Update filtered commands whenever commands or searchQuery changes
    $: {
        if (searchQuery?.length > 0) {
            filteredCommands = fuzzySearch(allCommands, searchQuery, (cmd) => `${cmd.label} ${cmd.category} ${cmd.context}`);
        } else {
            filteredCommands = [...allCommands];
        }
        selectedIndex = Math.min(selectedIndex, filteredCommands.length - 1);
    }

    // Initialize when opening
    $: if (show) {
        addKeyboardContext('commandPalette');
        filteredCommands = [...allCommands];
        selectedIndex = 0;
    }

    // Reset state when closing
    $: if (!show && previousShow) {
        removeKeyboardContext('commandPalette');
        searchQuery = '';
        selectedIndex = 0;
        focusStore.restorePrevious();
    }

    afterUpdate(() => {
        // If command palette was showing and is now hidden, disable vim mode
        if (previousShow && !show) {
            vimModeEnabled = false;
        }
        previousShow = show;
    });

    function handleKeyDown(event: CustomEvent<KeyboardEvent>) {
        const keyboardEvent = event.detail;
        switch(keyboardEvent.key) {
            case 'ArrowDown':
            case 'j':
                if (keyboardEvent.key === 'j' && !vimModeEnabled) break;
                keyboardEvent.preventDefault();
                selectedIndex = (selectedIndex + 1) % filteredCommands.length;
                break;
            case 'ArrowUp':
            case 'k':
                if (keyboardEvent.key === 'k' && !vimModeEnabled) break;
                keyboardEvent.preventDefault();
                selectedIndex = selectedIndex - 1 < 0 
                    ? filteredCommands.length - 1 
                    : selectedIndex - 1;
                break;
            case 'Enter':
                keyboardEvent.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    executeCommand(filteredCommands[selectedIndex]);
                }
                break;
        }
    }

    function executeCommand(command: Command) {
        if (command.action) {
            command.action();
        }
        show = false;
        dispatch('close');
    }

    onDestroy(() => {
        removeKeyboardContext('commandPalette');
    });
</script>

<BasePalette
    bind:show
    bind:searchQuery
    paletteId={paletteId}
    placeholder="Type a command or search..."
    on:keydown={handleKeyDown}
    on:close
>
    <ResultsList
        results={filteredCommands}
        {selectedIndex}
        ItemComponent={CommandItem}
        on:select={({ detail }) => executeCommand(detail)}
    />
</BasePalette>
