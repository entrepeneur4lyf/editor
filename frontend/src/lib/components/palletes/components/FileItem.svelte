<script lang="ts">
    import { File, Folder } from 'lucide-svelte';
    import type { service } from '@/lib/wailsjs/go/models';

    export let file: service.FileNode & { isOpen: boolean };
    export let selected = false;
</script>

<div class="flex items-center justify-between w-full">
    <div class="flex items-center space-x-2">
        {#if file.type === 'directory'}
            <Folder size={16} class="text-gray-500" />
        {:else}
            <File size={16} class="text-gray-500" />
        {/if}
        <span class="text-gray-300">{file.name}</span>
        {#if file.isOpen}
            <span class="text-xs text-gray-500">(open)</span>
        {/if}
    </div>
    <span class="text-xs text-gray-600">{file.path}</span>
</div>
