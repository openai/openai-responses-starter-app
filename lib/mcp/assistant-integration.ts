import { OpenAI } from 'openai';
import { ModelContextManager, Message, Context } from './index';
import { getTools } from '../tools/tools';

/**
 * Integration class that connects ModelContextProtocol with OpenAI assistant
 */
export class MCPAssistantIntegration {
    private openai: OpenAI;
    private contextManager: ModelContextManager;
    private assistantId: string | null = null;

    constructor(apiKey: string) {
        this.openai = new OpenAI({
            apiKey,
        });
        this.contextManager = ModelContextManager.getInstance();
    }

    /**
     * Inicjalizuje lub pobiera asystenta
     *
     * @param options - Opcje konfiguracji asystenta
     * @returns {Promise<string>} ID asystenta
     */
    public async getOrCreateAssistant(options: {
        name: string;
        instructions: string;
        model: string;
    }): Promise<string> {
        if (this.assistantId) {
            return this.assistantId;
        }

        try {
            // Pobierz listę asystentów, aby sprawdzić czy już istnieje
            const assistants = await this.openai.beta.assistants.list({
                limit: 100,
            });

            const existingAssistant = assistants.data.find(
                (assistant) => assistant.name === options.name
            );

            if (existingAssistant) {
                this.assistantId = existingAssistant.id;
                return existingAssistant.id;
            }

            // Pobierz narzędzia z konfiguracji aplikacji
            const app_tools = getTools();

            // Przekształć narzędzia na format wymagany przez API OpenAI Assistants
            const assistant_tools: any[] = [];

            // Mapuj narzędzia na format akceptowany przez API Assistants
            for (const tool of app_tools) {
                if (tool.type === "function" && 'name' in tool && 'description' in tool && 'parameters' in tool) {
                    // Konwersja narzędzi typu function
                    assistant_tools.push({
                        type: "function",
                        function: {
                            name: tool.name,
                            description: tool.description,
                            parameters: tool.parameters
                        }
                    });
                } else if (tool.type === "web_search") {
                    // Dodawanie web_search jako pojedynczy typ narzędzia
                    assistant_tools.push({ type: "web_search" });
                } else if (tool.type === "file_search") {
                    // Dodawanie file_search jako pojedynczy typ narzędzia
                    assistant_tools.push({ type: "file_search" });
                }
            }

            // Utwórz nowego asystenta
            const newAssistant = await this.openai.beta.assistants.create({
                name: options.name,
                instructions: options.instructions,
                model: options.model,
                tools: assistant_tools,
            });

            this.assistantId = newAssistant.id;
            return newAssistant.id;
        } catch (error) {
            console.error('Błąd podczas pobierania lub tworzenia asystenta:', error);
            throw error;
        }
    }

    /**
     * Tworzy nowy wątek z początkowym kontekstem
     *
     * @returns {Promise<string>} ID utworzonego wątku
     */
    public async createThread(): Promise<string> {
        try {
            // Pobierz kontekst z menedżera MCP
            const context = this.contextManager.getContext();

            // Konwersja wiadomości z formatu MCP na format OpenAI API
            // Filtrujemy wiadomości typu "system", które nie są obsługiwane przez threads.create
            const thread_messages = context.messages
                .filter(message => message.role !== 'system')
                .map(message => ({
                    role: message.role as 'user' | 'assistant',
                    content: message.content,
                }));

            // Utworzenie nowego wątku z początkowymi wiadomościami
            const thread = await this.openai.beta.threads.create({
                messages: thread_messages.length > 0 ? thread_messages : undefined,
            });

            // Zapisz ID wątku w metadanych MCP
            this.contextManager.updateMetadata({
                threadId: thread.id,
                created: new Date().toISOString(),
            });

            return thread.id;
        } catch (error) {
            console.error('Błąd podczas tworzenia wątku:', error);
            throw error;
        }
    }

    /**
     * Send a message to the assistant and get a response
     */
    public async sendMessage(
        message: string,
        threadId?: string
    ): Promise<{
        response: string;
        responseMetadata?: Record<string, any>;
    }> {
        try {
            // Get thread ID from context or parameter
            const currentThreadId = threadId || this.contextManager.getMetadata().threadId;

            if (!currentThreadId) {
                throw new Error('No thread ID available. Create a thread first.');
            }

            if (!this.assistantId) {
                throw new Error('No assistant ID available. Initialize assistant first.');
            }

            // Add message to thread
            await this.openai.beta.threads.messages.create(currentThreadId, {
                role: 'user',
                content: message,
            });

            // Add message to MCP context
            this.contextManager.addMessage({
                role: 'user',
                content: message,
            });

            // Run the assistant
            const run = await this.openai.beta.threads.runs.create(currentThreadId, {
                assistant_id: this.assistantId,
            });

            // Poll for completion
            let runStatus = await this.openai.beta.threads.runs.retrieve(
                currentThreadId,
                run.id
            );

            while (runStatus.status !== 'completed' && runStatus.status !== 'failed') {
                // Wait before polling again
                await new Promise((resolve) => setTimeout(resolve, 1000));
                runStatus = await this.openai.beta.threads.runs.retrieve(
                    currentThreadId,
                    run.id
                );
            }

            if (runStatus.status === 'failed') {
                throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
            }

            // Get messages from the thread
            const messages = await this.openai.beta.threads.messages.list(currentThreadId);

            // Find the latest assistant message
            const assistantMessages = messages.data.filter(
                (m) => m.role === 'assistant'
            );

            if (assistantMessages.length === 0) {
                throw new Error('No assistant messages found');
            }

            const latestMessage = assistantMessages[0];

            // Wyciągnięcie zawartości z uwzględnieniem możliwych typów wiadomości
            let responseContent = '';

            // Sprawdzenie typu zawartości i bezpieczne wyciągnięcie tekstu
            const contentBlock = latestMessage.content[0];
            if (contentBlock && 'text' in contentBlock && contentBlock.text && 'value' in contentBlock.text) {
                responseContent = contentBlock.text.value;
            }

            // Dodaj do kontekstu MCP
            this.contextManager.addMessage({
                role: 'assistant',
                content: responseContent,
            });

            return {
                response: responseContent,
                responseMetadata: {
                    messageId: latestMessage.id,
                    createdAt: latestMessage.created_at,
                },
            };
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Get the full conversation history from the thread
     */
    public async getThreadHistory(threadId?: string): Promise<Message[]> {
        try {
            const currentThreadId = threadId || this.contextManager.getMetadata().threadId;

            if (!currentThreadId) {
                throw new Error('No thread ID available');
            }

            const messages = await this.openai.beta.threads.messages.list(currentThreadId);

            // Konwersja wiadomości OpenAI na format wiadomości MCP
            return messages.data.map((message) => {
                // Bezpieczne wyciągnięcie tekstu z zawartości wiadomości
                let content = '';
                const contentBlock = message.content[0];
                if (contentBlock && 'text' in contentBlock && contentBlock.text && 'value' in contentBlock.text) {
                    content = contentBlock.text.value;
                }

                return {
                    role: message.role as 'user' | 'assistant',
                    content: content,
                    metadata: {
                        messageId: message.id,
                        createdAt: message.created_at,
                    },
                };
            });
        } catch (error) {
            console.error('Error getting thread history:', error);
            throw error;
        }
    }

    /**
     * Delete a thread
     */
    public async deleteThread(threadId?: string): Promise<boolean> {
        try {
            const currentThreadId = threadId || this.contextManager.getMetadata().threadId;

            if (!currentThreadId) {
                throw new Error('No thread ID available');
            }

            const deletion = await this.openai.beta.threads.del(currentThreadId);

            if (deletion.deleted) {
                // Update MCP context
                this.contextManager.updateMetadata({
                    threadId: null,
                });

                return true;
            }

            return false;
        } catch (error) {
            console.error('Error deleting thread:', error);
            throw error;
        }
    }
}

export default MCPAssistantIntegration;
