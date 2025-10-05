// Defines the command types for messages.
export type MessageType =
  // Snapshot Commands
  | 'CAPTURE_SNAPSHOT'
  | 'GET_SNAPSHOT' // Get a single snapshot by ID
  | 'LIST_SNAPSHOTS'
  | 'DELETE_SNAPSHOT'
  | 'SAVE_SNAPSHOT_DATA' // Internal: sent from content script to background
  | 'CAPTURE_SNAPSHOT_REQUEST' // Internal: sent from background to content script

  // Translation Commands
  | 'TRANSLATE_TEXT'

  // AI Commands
  | 'EXPLAIN_TERM'
  | 'GENERATE_NOTE'

  // Export Commands
  | 'EXPORT_TO_OBSIDIAN' // Payload will be the full snapshot object

  // Settings Commands
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS';

/**
 * The basic structure for a message sent between components.
 * The payload's type depends on the message type.
 */
export interface Message<T = any> {
  type: MessageType;
  payload?: T;
  requestId?: string; // Optional ID to correlate requests and responses
}

/**
 * The structure for a response to a message.
 */
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string; // Echoes the original requestId
}