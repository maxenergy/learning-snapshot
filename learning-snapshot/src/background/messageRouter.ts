import type { Message, MessageResponse, MessageType } from '../types/messages';
import { snapshotService } from '../services/snapshot/SnapshotService'; // Use the service
import { translationService } from '../services/translation/TranslationService';
import type { TranslateParams } from '../types/translation';
import { exportService } from '../services/export/ExportService';
import type { Snapshot } from '../storage/models/Snapshot';

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
    // --- Snapshot Handlers ---
    this.handlers.set('LIST_SNAPSHOTS', async () => {
      console.log('Routing LIST_SNAPSHOTS to service');
      return snapshotService.getAllSnapshots();
    });

    this.handlers.set('GET_SNAPSHOT', async (payload: string) => {
      console.log(`Routing GET_SNAPSHOT to service for ID: ${payload}`);
      return snapshotService.getSnapshot(payload);
    });

    this.handlers.set('DELETE_SNAPSHOT', async (payload: string) => {
      console.log(`Routing DELETE_SNAPSHOT to service for ID: ${payload}`);
      await snapshotService.deleteSnapshot(payload);
      return { success: true, id: payload };
    });

    this.handlers.set('CAPTURE_SNAPSHOT', async () => {
      console.log('Routing CAPTURE_SNAPSHOT message');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        // Send a message to the content script in the active tab
        await chrome.tabs.sendMessage(tab.id, { type: 'CAPTURE_SNAPSHOT_REQUEST' });
        return { status: 'request_sent' };
      } else {
        throw new Error('No active tab found to capture.');
      }
    });

    // This handler receives the extracted data from the content script
    this.handlers.set('SAVE_SNAPSHOT_DATA', async (payload: Omit<Snapshot, 'id' | 'createdAt' | 'updatedAt'>) => {
      console.log('Routing SAVE_SNAPSHOT_DATA to service');
      const newSnapshot = await snapshotService.createSnapshot(payload);
      console.log('MessageRouter: Snapshot saved with ID:', newSnapshot.id);
      return newSnapshot;
    });

    this.handlers.set('TRANSLATE_TEXT', async (payload: TranslateParams) => {
      console.log('Handling TRANSLATE_TEXT message:', payload);
      // Default to Ollama if no provider is specified
      const finalPayload = { ...payload, provider: payload.provider || 'ollama' };
      return translationService.translate(finalPayload);
    });

    this.handlers.set('EXPORT_TO_OBSIDIAN', async (payload: Snapshot) => {
      console.log(`Handling EXPORT_TO_OBSIDIAN message for ID: ${payload.id}`);
      await exportService.exportSnapshotToMarkdown(payload);
      return { success: true };
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