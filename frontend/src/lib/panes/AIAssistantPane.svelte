<script lang="ts">
    import { Brain, MoreVertical, Settings, Trash2 } from 'lucide-svelte';
    import { setKeyboardContext } from '@/lib/stores/keyboardStore';
    import Select from '@/lib/components/Select.svelte';
    import Button from '@/lib/components/Button.svelte';
    import DropdownMenu from '@/lib/components/DropdownMenu.svelte';
    import ChatWindow from '@/lib/components/ChatWindow.svelte';

    export let isActive = false;
    let showMoreOptions = false;
    let selectedModel = 'GPT-4';
    const modelOptions = ['GPT-4', 'GPT-3.5-turbo', 'Codex'];

    $: if (isActive) {
        setKeyboardContext('aiAssistant');
    }
</script>

<div class="flex flex-col h-full w-full">
    <div class="flex-none flex items-center justify-between h-[34px] px-2 border-b border-gray-800 bg-gray-900">
        <div class="flex items-center space-x-2">
            <Brain size={16} class="text-gray-400" />
            <span class="text-sm font-medium text-gray-300">AI Assistant</span>
        </div>
        <div class="flex items-center space-x-2">
            <div class="w-40">
                <Select
                    bind:value={selectedModel}
                    options={modelOptions}
                    variant="compact"
                />
            </div>
            <div class="relative">
                <button
                    class="p-1 hover:bg-gray-800 rounded-sm text-gray-400"
                    on:click={() => showMoreOptions = !showMoreOptions}
                >
                    <MoreVertical size={14} />
                </button>
                <DropdownMenu
                    show={showMoreOptions}
                    onClose={() => showMoreOptions = false}
                    items={[
                        {
                            icon: Settings,
                            label: 'Settings',
                            onClick: () => {
                                console.log('Open settings');
                            }
                        },
                        {
                            icon: Trash2,
                            label: 'Clear History',
                            onClick: () => {
                                console.log('Clear history');
                            }
                        }
                    ]}
                />
            </div>
        </div>
    </div>
    <div class="flex-1 min-h-0 w-full">
        <ChatWindow />
    </div>
</div>
