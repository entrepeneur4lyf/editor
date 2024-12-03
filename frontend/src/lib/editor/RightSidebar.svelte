<script lang="ts">
  import { Send, MoreVertical, Trash2, Settings } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';
  import { setKeyboardContext } from '../stores/keyboardStore';
  import AIAssistantPane from '../panes/AIAssistantPane.svelte';

  export let isCollapsed = false;

  $: if (isCollapsed) {
    setKeyboardContext('editor');
  }
</script>

<div class="h-full flex flex-col bg-gray-900 border-l border-gray-800" class:w-full={!isCollapsed} class:w-0={isCollapsed}>
  {#if !isCollapsed}
    <AIAssistantPane isActive={!isCollapsed} />
  {/if}
</div>
