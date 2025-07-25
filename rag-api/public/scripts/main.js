document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');

    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = content;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const question = userInput.value.trim();
        if (!question) return;

        const conversation = Array.from(document.querySelectorAll("div.message"))
            .map((e) => e.innerHTML)
            .map((s) => s.replace(/[\r\n\t]/g, ''))
            .join(";")

        const language = document.querySelector('input[name="language"]:checked').value;

        // Add user message to chat
        addMessage(question, true);
        
        // Clear input
        userInput.value = '';

        sendButton.disabled = true

        try {
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({ question, conversation, language })
            });

            const reader = response.body.getReader();
            let botResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // Convert the Uint8Array to text
                const text = new TextDecoder().decode(value);
                botResponse += text;
                
                // Update the bot message in real-time
                const lastMessage = chatBox.lastElementChild;
                if (lastMessage && !lastMessage.classList.contains('user-message')) {
                    lastMessage.textContent = botResponse;
                } else {
                    addMessage(botResponse);
                }
            }
            sendButton.disabled = false
        } catch (error) {
            console.error('Error:', error);
            addMessage('Error: Could not get response from server');
            sendButton.disabled = false
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});