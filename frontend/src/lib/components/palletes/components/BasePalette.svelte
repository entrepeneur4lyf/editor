<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { Search } from 'lucide-svelte';
    import Input from '../../Input.svelte';
    import { focusStore } from '@/stores/focusStore';

    const dispatch = createEventDispatcher<{
        close: void;
        search: { query: string };
        keydown: KeyboardEvent;
    }>();

    export let show = false;
    export let searchQuery = '';
    export let placeholder = 'Search...';
    export let paletteId: string;
    export let autofocus = true;

    let inputElement: HTMLInputElement;
    let vimModeEnabled = false;

    // Initialize when opening
    $: if (show) {
        focusStore.focus('palette', paletteId);
        // Focus input after a short delay to ensure DOM is ready
        if (autofocus) {
            setTimeout(() => {
                inputElement?.focus();
            }, 0);
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (!show) return;

        // Enable vim mode when Alt+J are pressed together
        if (event.altKey && event.key.toLowerCase() === 'j') {
            event.preventDefault();
            vimModeEnabled = true;
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closePalette();
            return;
        }

        dispatch('keydown', event);
    }

    function handleSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        dispatch('search', { query: target.value });
    }

    function closePalette() {
        show = false;
        dispatch('close');
    }

    function handleClickOutside() {
        closePalette();
    }

    function handleClickInside(event: MouseEvent) {
        event.stopPropagation();
    }

    onMount(() => {
        window.addEventListener('keydown', handleKeyDown);
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });
</script>

{#if show}
    <button 
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]"
        on:click={handleClickOutside}
    >
        <div 
            class="palette-content w-[600px] bg-gray-900 rounded-lg shadow-xl border border-gray-700"
            on:click={handleClickInside}
        >
            <div class="relative">
                <div class="pl-10">
                    <Input
                        bind:value={searchQuery}
                        {placeholder}
                        bind:this={inputElement}
                        {autofocus}
                        on:input={handleSearchInput}
                    />
                </div>
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={16} />
                </div>
            </div>

            <slot />
        </div>
    </button>
{/if}
