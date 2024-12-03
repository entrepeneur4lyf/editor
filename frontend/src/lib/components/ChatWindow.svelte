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

<div class="flex flex-col h-full w-full">
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
        {#each messages as message}
            <div class="flex flex-col {message.role === 'assistant' ? 'items-start' : 'items-end'}">
                <div class="max-w-[80%] rounded-lg p-3 {message.role === 'assistant' ? 'bg-gray-800' : 'bg-blue-600'}">
                    <p class="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
            </div>
        {/each}
    </div>

    <div class="flex-none border-t border-gray-800 p-4 w-full">
        <div class="flex items-start space-x-2 w-full">
            <div class="flex-1">
                <Input
                    variant="textarea"
                    bind:value={newMessage}
                    placeholder="Type a message..."
                    minRows={1}
                    maxRows={5}
                    on:keydown={handleKeyPress}
                />
            </div>
            <div class="flex-none">
                <Button
                    variant="primary"
                    icon={Send}
                    disabled={!newMessage.trim()}
                    on:click={sendMessage}
                />
            </div>
        </div>
    </div>
</div>

<style>
    :global(.chat-window-input) {
        width: 100%;
        resize: none;
    }
</style>
