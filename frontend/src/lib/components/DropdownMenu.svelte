<script lang="ts">
    import type { LucideIcon } from 'lucide-svelte';

    export let show: boolean;
    export let onClose: () => void;
    export let items: {
        icon: LucideIcon;
        label: string;
        onClick: () => void;
        divider?: boolean;
    }[];
    export let position: 'top' | 'bottom' = 'bottom';
    export let align: 'left' | 'right' = 'right';
    export let width: string = '12rem';
</script>

{#if show}
    <div
        role="menu"
        tabindex="0"
        on:mouseleave={() => show = false}
        on:keydown={e => {
            if (e.key === 'Escape') {
                show = false;
            }
        }}
        class="absolute {position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} {align === 'right' ? 'right-0' : 'left-0'} min-w-[180px] bg-gray-800 rounded-md shadow-lg border border-gray-700 py-1 z-50"
    >
        {#each items as item}
            {#if item.divider}
                <div class="border-t border-gray-700 my-1" role="separator" />
            {:else}
                <button
                    class="flex items-center w-full px-3 py-1.5 hover:bg-gray-700 text-gray-300 text-sm"
                    on:click={() => {
                        item.onClick?.();
                        onClose();
                    }}
                    role="menuitem"
                >
                    {#if item.icon}
                        <svelte:component this={item.icon} size={14} class="mr-2" />
                    {/if}
                    {item.label}
                </button>
            {/if}
        {/each}
    </div>
{/if}
