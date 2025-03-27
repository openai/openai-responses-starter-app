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
   * Initialize or retrieve assistant
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
      // Get list of assistants to check if one already exists with this name
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

      // Create a new assistant if none exists
      const tools = getTools();
      
      const newAssistant = await this.openai.beta.assistants.create({
        name: options.name,
        instructions: options.instructions,
        model: options.model,
        tools: tools,
      });

      this.assistantId = newAssistant.id;
      return newAssistant.id;
    } catch (error) {
      console.error('Error getting or creating assistant:', error);
      throw error;
    }
  }

  /**
   * Create a new thread with the initial context
   */
  public async createThread(): Promise<string> {
    try {
      // Get context from MCP manager
      const context = this.contextManager.getContext();
      
      // Convert MCP messages to OpenAI message format
      const messages = context.messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      // Create a new thread with initial messages
      const thread = await this.openai.beta.threads.create({
        messages: messages.length > 0 ? messages : undefined,
      });

      // Store thread ID in MCP metadata
      this.contextManager.updateMetadata({
        threadId: thread.id,
        created: new Date().toISOString(),
      });

      return thread.id;
    } catch (error) {
      console.error('Error creating thread:', error);
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
      
      // Extract the content
      const responseContent = latestMessage.content[0]?.text?.value || '';
      
      // Add to MCP context
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
      
      // Convert OpenAI messages to MCP message format
      return messages.data.map((message) => {
        return {
          role: message.role as 'user' | 'assistant',
          content: message.content[0]?.text?.value || '',
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