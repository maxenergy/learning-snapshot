import { contentExtractor } from '../services/snapshot/ContentExtractor';
import type { Message } from '../types/messages';

console.log('Learning Snapshot content script loaded.');

/**
 * Listens for messages from the background script.
 */
chrome.runtime.onMessage.addListener(
  (message: Message, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.type === 'CAPTURE_SNAPSHOT_REQUEST') {
    console.log('Received CAPTURE_SNAPSHOT_REQUEST from background script.');

    // Use the ContentExtractor to get the page data
    contentExtractor.extract(document, window.location.href)
      .then(snapshotData => {
        console.log('Content extracted, sending data back to background script.');
        // Send the extracted data back to the background script to be saved
        return chrome.runtime.sendMessage({
          type: 'SAVE_SNAPSHOT_DATA',
          payload: snapshotData,
        });
      })
      .then(response => {
        console.log('Background script responded to save request:', response);
        // You could potentially show a notification to the user here
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Failed to capture snapshot:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});