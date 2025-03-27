import { OpenAI } from 'openai';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface Context {
  messages: Message[];
  metadata: Record<string, any>;
}

export interface ContextOptions {
  initialMessages?: Message[];
  initialMetadata?: Record<string, any>;
}

export class ModelContextManager {
  private context: Context;
  private static instance: ModelContextManager;

  private constructor(options: ContextOptions = {}) {
    this.context = {
      messages: options.initialMessages || [],
      metadata: options.initialMetadata || {},
    };
  }

  public static getInstance(options: ContextOptions = {}): ModelContextManager {
    if (!ModelContextManager.instance) {
      ModelContextManager.instance = new ModelContextManager(options);
    }
    return ModelContextManager.instance;
  }

  public getContext(): Context {
    return { ...this.context };
  }

  public addMessage(message: Message): void {
    this.context.messages.push(message);
  }

  public updateMetadata(metadata: Record<string, any>): void {
    this.context.metadata = {
      ...this.context.metadata,
      ...metadata,
    };
  }

  public getMessages(): Message[] {
    return [...this.context.messages];
  }

  public getMetadata(): Record<string, any> {
    return { ...this.context.metadata };
  }

  public reset(): void {
    this.context = {
      messages: [],
      metadata: {},
    };
  }

  public serialize(): string {
    return JSON.stringify(this.context);
  }

  public static deserialize(serialized: string): ModelContextManager {
    const parsedContext = JSON.parse(serialized) as Context;
    const instance = ModelContextManager.getInstance();
    instance.context = parsedContext;
    return instance;
  }
}

export class ModelContextProtocol {
  private contextManager: ModelContextManager;
  private openai: OpenAI;

  constructor(apiKey: string, options: ContextOptions = {}) {
    this.contextManager = ModelContextManager.getInstance(options);
    this.openai = new OpenAI({
      apiKey,
    });
  }

  public async getCompletion(userMessage: string, systemPrompt?: string): Promise<string> {
    // Add user message to context
    this.contextManager.addMessage({
      role: 'user',
      content: userMessage,
    });

    // Add system prompt if provided
    if (systemPrompt) {
      const systemMessage: Message = {
        role: 'system',
        content: systemPrompt,
      };
      
      // Add system message at the beginning of the messages array
      const messages = this.contextManager.getMessages();
      const messagesWithSystem = [systemMessage, ...messages];
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messagesWithSystem.map(m => ({ 
          role: m.role, 
          content: m.content 
        })),
      });

      const assistantResponse = response.choices[0]?.message?.content || '';
      
      // Add assistant response to context
      this.contextManager.addMessage({
        role: 'assistant',
        content: assistantResponse,
      });

      return assistantResponse;
    } else {
      // No system prompt, use messages directly from context
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: this.contextManager.getMessages().map(m => ({ 
          role: m.role, 
          content: m.content 
        })),
      });

      const assistantResponse = response.choices[0]?.message?.content || '';
      
      // Add assistant response to context
      this.contextManager.addMessage({
        role: 'assistant',
        content: assistantResponse,
      });

      return assistantResponse;
    }
  }

  public getContext(): Context {
    return this.contextManager.getContext();
  }

  public updateMetadata(metadata: Record<string, any>): void {
    this.contextManager.updateMetadata(metadata);
  }

  public reset(): void {
    this.contextManager.reset();
  }
}

export default ModelContextProtocol;