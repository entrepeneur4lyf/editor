<script lang="ts">
    import { Send } from 'lucide-svelte';
    import Input from './Input.svelte';
    import Button from './Button.svelte';

    interface Message {
        role: 'assistant' | 'user';
        content: string;
    }

    let messages: Message[] = [
        { role: 'assistant', content: 'Hello! How can I assist you with your code today?' }
    ];

    let newMessage = '';

    function sendMessage() {
        if (newMessage.trim()) {
            messages = [...messages, { role: 'user', content: newMessage.trim() }];
            // Simulate AI response
            setTimeout(() => {
                messages = [...messages, { 
                    role: 'assistant', 
                    content: 'This is a simulated response. The actual AI integration will be implemented later.'
                }];
            }, 1000);
            newMessage = '';
        }
    }

    function handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }
</script>

<div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {#each messages as message}
            <div class="flex flex-col {message.role === 'assistant' ? 'items-start' : 'items-end'}">
                <div class="max-w-[80%] rounded-lg p-3 {message.role === 'assistant' ? 'bg-gray-800' : 'bg-blue-600'}">
                    <p class="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
        {/each}
    </div>

    <div class="border-t border-gray-800 p-4">
        <div class="flex items-end space-x-2">
            <div class="flex-1">
                <Input
                    variant="textarea"
                    bind:value={newMessage}
                    placeholder="Type a message..."
                    rows={1}
                    on:keydown={handleKeyPress}
                />
            </div>
            <Button
                variant="primary"
                size="sm"
                icon={Send}
                disabled={!newMessage.trim()}
                on:click={sendMessage}
            />
        </div>
        <div class="mt-2 text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
        </div>
    </div>
</div>
