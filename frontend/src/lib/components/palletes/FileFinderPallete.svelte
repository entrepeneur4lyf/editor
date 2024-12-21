<script lang="ts">
    import {
        onMount,
        createEventDispatcher,
        afterUpdate,
        onDestroy,
    } from "svelte";
    import { Search } from "lucide-svelte";
    import BasePalette from './components/BasePalette.svelte';
    import ResultsList from './components/ResultsList.svelte';
    import FileItem from './components/FileItem.svelte';
    import { SearchFiles } from "@/lib/wailsjs/go/main/App";
    import { projectStore } from "@/stores/project";
    import { fileStore } from "@/stores/fileStore";
    import { focusStore } from "@/stores/focusStore";
    import { keyBindings, addKeyboardContext, removeKeyboardContext, registerCommand } from "@/stores/keyboardStore";
    import type { service } from "../wailsjs/go/models";

    const dispatch = createEventDispatcher<{
        close: void;
        select: { path: string };
    }>();

    export let show = false;
    let previousShow = show;
    let vimModeEnabled = false;
    let searchQuery = "";
    let previousBaseQuery = ""; // Store the previous base query
    let baseResults: (service.FileNode & { isOpen: boolean })[] = []; // Store base results
    let results: (service.FileNode & { isOpen: boolean })[] = [];
    let selectedIndex = 0;
    let loading = false;
    let error = null;
    let debounceTimer: number | null = null;
    let currentSearch: Promise<any> | null = null;
    let searchCounter = 0;
    let mounted = false;
    let finderId = focusStore.generateId('file-finder');

    // Convert open files to search results format
    function getOpenFilesAsResults() {
        return Array.from($fileStore.openFiles.entries()).map(([path, file]) => ({
            name: path.split('/').pop() || '',
            path,
            type: 'file',
            isOpen: true
        }));
    }

    // Reset all states
    function resetState() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        results = getOpenFilesAsResults();
        baseResults = [];
        previousBaseQuery = "";
        selectedIndex = 0;
        loading = false;
        error = null;
    }

    // Filter existing results with additional terms
    function filterResults(terms: string[]): (service.FileNode & { isOpen: boolean })[] {
        return baseResults.filter(file => {
            const lowerPath = file.path.toLowerCase();
            return terms.every(term => lowerPath.includes(term.toLowerCase()));
        });
    }

    // Perform search
    async function performSearch(query: string, counter: number) {
        if (!show || counter !== searchCounter) {
            loading = false;
            return;
        }

        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        
        // If we have a previous base query and this query starts with it
        if (previousBaseQuery && 
            query.toLowerCase().startsWith(previousBaseQuery.toLowerCase()) && 
            terms.length > 1) {
            // Filter existing results instead of doing a new search
            results = filterResults(terms);
            loading = false;
            return;
        }

        try {
            // This is a new base search
            const thisSearch = SearchFiles(
                $projectStore.currentProject!.Path,
                terms[0] // Use only the first term for backend search
            );
            currentSearch = thisSearch;

            const searchResults = await thisSearch;
            if (counter === searchCounter && show) {
                // Get open files for merging
                const openFiles = new Set($fileStore.openFiles.keys());
                
                // Mark open files and sort them to top
                baseResults = (searchResults || []).map(file => ({
                    ...file,
                    isOpen: openFiles.has(file.path)
                })).sort((a, b) => {
                    if (a.isOpen && !b.isOpen) return -1;
                    if (!a.isOpen && b.isOpen) return 1;
                    return 0;
                });

                // Store the base query for future refinements
                previousBaseQuery = terms[0];

                // If there are additional terms, filter the results
                if (terms.length > 1) {
                    results = filterResults(terms);
                } else {
                    results = baseResults;
                }

                selectedIndex = Math.min(
                    selectedIndex,
                    Math.max(0, results.length - 1)
                );
            }
        } catch (err) {
            if (counter === searchCounter && show) {
                results = [];
                baseResults = [];
                previousBaseQuery = "";
                error = err.message;
            }
        } finally {
            if (counter === searchCounter) {
                loading = false;
            }
        }
    }

    // Watch for show changes
    $: if (show && !previousShow) {
        searchQuery = "";
        resetState();
        previousShow = show;
    } else if (!show) {
        previousShow = show;
    }

    // Handle search query changes
    $: {
        if (mounted && show && searchQuery !== undefined) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }

            searchCounter++; // Increment counter for new search attempt
            const currentCounter = searchCounter;

            if (searchQuery === "") {
                resetState();
            } else {
                loading = true;
                error = null;
                debounceTimer = setTimeout(() => {
                    if (show && currentCounter === searchCounter) {
                        performSearch(searchQuery, currentCounter);
                    } else {
                        loading = false;
                    }
                }, 200);
            }
        }
    }

    function handleKeyDown(event: CustomEvent<KeyboardEvent>) {
        const keyboardEvent = event.detail;
        if (!show) return;

        // Enable vim mode when Alt+J are pressed together
        if (keyboardEvent.altKey && keyboardEvent.key.toLowerCase() === "j") {
            vimModeEnabled = !vimModeEnabled;
            keyboardEvent.preventDefault();
            return;
        }

        // Close modal on Alt + Number
        if (keyboardEvent.altKey && /^[0-9]$/.test(keyboardEvent.key)) {
            keyboardEvent.preventDefault();
            dispatch("close");
            return;
        }
        
        switch (keyboardEvent.key) {
            case "ArrowDown":
            case "j":
                if (keyboardEvent.key === "j" && !vimModeEnabled) break;
                keyboardEvent.preventDefault();
                selectedIndex = (selectedIndex + 1) % results.length;
                break;
            case "ArrowUp":
            case "k":
                if (keyboardEvent.key === "k" && !vimModeEnabled) break;
                keyboardEvent.preventDefault();
                selectedIndex =
                    selectedIndex - 1 < 0
                        ? results.length - 1
                        : selectedIndex - 1;
                break;
            case "Enter":
                keyboardEvent.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case "Escape":
                keyboardEvent.preventDefault();
                closeFileFinder();
                break;
        }
    }

    async function handleSelect(file: service.FileNode & { isOpen: boolean }) {
        if (file.type === "file") {
            await fileStore.openFile(file.path);
            closeFileFinder();
            dispatch('select', { path: file.path });
        }
    }

    function closeFileFinder() {
        resetState();
        searchQuery = "";
        vimModeEnabled = false;
        selectedIndex = 0;
        show = false;
        focusStore.restorePrevious();
        dispatch("close");
    }

    onMount(() => {
        mounted = true;
        addKeyboardContext('fileFinder');

        // Register actions for fuzzy finder selection commands
        for (let i = 1; i <= 9; i++) {
            registerCommand(`fuzzyFinderSelect${i}`, () => {
                const index = i - 1;
                if (results[index]) {
                    handleSelect(results[index]);
                }
            });
        }
    });

    onDestroy(() => {
        removeKeyboardContext('fileFinder');
        mounted = false;
        resetState();
    });
</script>

<BasePalette
    bind:show
    bind:searchQuery
    paletteId={finderId}
    placeholder="Type to search files..."
    on:keydown={handleKeyDown}
    on:close={closeFileFinder}
>
    <ResultsList 
        {selectedIndex} 
        isEmpty={loading || error || results.length === 0}
        emptyMessage={loading ? "Loading..." : error ? error : "No files found"}
    >
        {#if !loading}
            {#each results as file, index (file.path)}
                <FileItem
                    {file}
                    {index}
                    selected={index === selectedIndex}
                    onClick={() => handleSelect(file)}
                />
            {/each}
        {/if}
    </ResultsList>
</BasePalette>
