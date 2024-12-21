<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher<{
        select: any;
    }>();

    export let results: any[] = [];
    export let selectedIndex = 0;
    export let ItemComponent: any;

    function handleSelect(item: any) {
        dispatch('select', item);
    }
</script>

{#if results.length > 0}
    <div class="max-h-[60vh] overflow-y-auto">
        <div class="divide-y divide-gray-800">
            {#each results as item, index}
                <button
                    class="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-800 
                        {index === selectedIndex ? 'bg-gray-800' : ''}"
                    on:click={() => handleSelect(item)}
                >
                    <svelte:component 
                        this={ItemComponent} 
                        {item} 
                        selected={index === selectedIndex} 
                    />
                </button>
            {/each}
        </div>
    </div>
{/if}
