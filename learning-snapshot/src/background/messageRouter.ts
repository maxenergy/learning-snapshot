import { Message, MessageResponse, MessageType } from '../types/messages';
import { snapshotRepository } from '../storage/repositories/SnapshotRepository';

// A type for the function that handles a specific message.
type MessageHandler = (payload: any) => Promise<any>;

class MessageRouter {
  // A map to store handlers for each message type.
  private handlers: Map<MessageType, MessageHandler>;

  constructor() {
    this.handlers = new Map();
    this.registerHandlers();
  }

  /**
   * Registers all the message handlers for the extension.
   * This is where the business logic for each message type is defined.
   */
  private registerHandlers() {
    // Register a handler for listing snapshots.
    this.handlers.set('LIST_SNAPSHOTS', async () => {
      console.log('Handling LIST_SNAPSHOTS message');
      return snapshotRepository.findAll();
    });

    // Placeholder handlers for other core actions.
    // These will be implemented in later phases.
    this.handlers.set('CAPTURE_SNAPSHOT', async (payload) => {
      console.log('Placeholder for CAPTURE_SNAPSHOT', payload);
      // In the future, this will call the ContentExtractor and save a snapshot.
      return { status: 'captured', id: crypto.randomUUID() };
    });

    this.handlers.set('TRANSLATE_TEXT', async (payload) => {
      console.log('Placeholder for TRANSLATE_TEXT', payload);
      // In the future, this will call the TranslationService.
      return { translatedText: `Translated: ${payload.text}` };
    });
  }

  /**
   * Routes an incoming message to the appropriate handler.
   * @param message - The message received from a browser runtime listener.
   * @returns A promise that resolves with the response.
   */
  async route(message: Message): Promise<MessageResponse> {
    const handler = this.handlers.get(message.type);

    if (!handler) {
      console.error(`No handler registered for message type: ${message.type}`);
      return {
        success: false,
        error: `No handler for message type: ${message.type}`,
        requestId: message.requestId,
      };
    }

    try {
      const data = await handler(message.payload);
      return {
        success: true,
        data,
        requestId: message.requestId,
      };
    } catch (error) {
      console.error(`Error handling message type: ${message.type}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        requestId: message.requestId,
      };
    }
  }
}

// Export a singleton instance of the router.
export const messageRouter = new MessageRouter();