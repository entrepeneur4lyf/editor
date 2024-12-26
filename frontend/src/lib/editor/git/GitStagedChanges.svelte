<script lang="ts">
    import { ChevronDown, ChevronRight } from "lucide-svelte";
    import { gitStore } from "@/stores/gitStore";
    import GitStatusItem from "./GitStatusItem.svelte";

    function compareFiles(a: string, b: string) {
        const aName = a.split('/').pop() || '';
        const bName = b.split('/').pop() || '';
        
        // Helper to check if string starts with dot or number
        const startsWithDotOrNumber = (str: string) => /^[.0-9]/.test(str);
        
        const aHasDotOrNumber = startsWithDotOrNumber(aName);
        const bHasDotOrNumber = startsWithDotOrNumber(bName);
        
        // If one has dot/number and other doesn't, prioritize dot/number
        if (aHasDotOrNumber && !bHasDotOrNumber) return -1;
        if (!aHasDotOrNumber && bHasDotOrNumber) return 1;
        
        // Otherwise, normal alphabetical sort
        return a.localeCompare(b);
    }

    $: stagedChanges = $gitStore.gitStatus?.filter((item) => item.staged)
        .sort((a, b) => compareFiles(a.file, b.file)) || [];
</script>

{#if stagedChanges.length > 0}
    <div class="mb-4">
        <button
            class="flex items-center text-sm text-gray-500 mb-1 px-2 cursor-pointer hover:text-gray-400"
            on:click={() => gitStore.toggleStagedExpanded()}
        >
            <span class="w-4 h-4 flex items-center justify-center">
                {#if $gitStore.stagedExpanded}
                    <ChevronDown class="w-4 h-4" />
                {:else}
                    <ChevronRight class="w-4 h-4" />
                {/if}
            </span>
            <span class="font-bold ml-2">Staged Changes ({stagedChanges.length})</span>
        </button>
        {#if $gitStore.stagedExpanded}
            <div>
                {#each stagedChanges as item}
                    <GitStatusItem {item} isStaged={true} />
                {/each}
            </div>
        {/if}
    </div>
{/if}
