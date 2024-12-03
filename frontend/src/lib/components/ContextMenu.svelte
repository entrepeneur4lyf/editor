<script lang="ts">
    import type { LucideIcon } from 'lucide-svelte';
    import { onMount, onDestroy } from 'svelte';

    export let items: {
        icon?: LucideIcon;
        label: string;
        onClick: () => void;
        shortcut?: string;
        divider?: boolean;
    }[];

    let show = false;
    let x = 0;
    let y = 0;
    let menuElement: HTMLDivElement;

    function handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        x = event.clientX;
        y = event.clientY;
        show = true;

        // Adjust position if menu would go off screen
        if (menuElement) {
            const rect = menuElement.getBoundingClientRect();
            if (x + rect.width > window.innerWidth) {
                x = window.innerWidth - rect.width;
            }
            if (y + rect.height > window.innerHeight) {
                y = window.innerHeight - rect.height;
            }
        }
    }

    function handleClick(event: MouseEvent) {
        if (menuElement && !menuElement.contains(event.target as Node)) {
            show = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            show = false;
        }
    }

    onMount(() => {
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeydown);
    });

    onDestroy(() => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeydown);
    });
</script>

{#if show}
    <div
        bind:this={menuElement}
        role="menu"
        tabindex="0"
        style="left: {x}px; top: {y}px"
        class="fixed min-w-[180px] bg-gray-800 rounded-md shadow-lg border border-gray-700 py-1 z-50"
    >
        {#each items as item}
            {#if item.divider}
                <div class="border-t border-gray-700 my-1" role="separator" />
            {:else}
                <button
                    class="flex items-center justify-between w-full px-3 py-1.5 hover:bg-gray-700 text-gray-300 text-sm group"
                    on:click={() => {
                        item.onClick?.();
                        show = false;
                    }}
                    role="menuitem"
                >
                    <div class="flex items-center">
                        {#if item.icon}
                            <svelte:component this={item.icon} size={14} class="mr-2" />
                        {/if}
                        {item.label}
                    </div>
                    {#if item.shortcut}
                        <span class="ml-4 text-xs text-gray-500 group-hover:text-gray-400">{item.shortcut}</span>
                    {/if}
                </button>
            {/if}
        {/each}
    </div>
{/if}
