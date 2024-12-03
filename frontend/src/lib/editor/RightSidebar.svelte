<script lang="ts">
  import { Send, MoreVertical, Trash2, Settings } from 'lucide-svelte';
  import { onMount, onDestroy } from 'svelte';
  import { setKeyboardContext } from '../stores/keyboardStore';
  import AIAssistantPane from '../panes/AIAssistantPane.svelte';

  export let isCollapsed = false;

  interface Message {
    role: 'assistant' | 'user';
    content: string;
  }

  let messages: Message[] = [
    { role: 'assistant', content: 'Hello! How can I assist you with your code today?' },
    { role: 'user', content: 'Can you explain how to use React hooks?' },
  ];

  let newMessage = '';
  let selectedModel = 'GPT-4';
  let showMoreOptions = false;
  const modelOptions = ['GPT-4', 'GPT-3.5-turbo', 'Codex', 'GPT-3', 'GPT-2', 'GPT-1'];

  function sendMessage() {
    if (newMessage.trim()) {
      messages = [...messages, { role: 'user', content: newMessage.trim() }];
      newMessage = '';
      // Here you would typically send the message to an AI service and await a response
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  }

  onMount(() => {
    if (!isCollapsed) {
      setKeyboardContext('aiAssistant');
    }
  });

  onDestroy(() => {
    setKeyboardContext('global');
  });

  $: if (isCollapsed) {
    setKeyboardContext('global');
  } else {
    setKeyboardContext('aiAssistant');
  }
</script>

<div class="h-full flex flex-col bg-gray-900 border-l border-gray-800 {isCollapsed ? 'w-12' : 'w-96'}">
  {#if !isCollapsed}
    <AIAssistantPane isActive={true} />
  {/if}
</div>
