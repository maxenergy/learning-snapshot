import { messageRouter } from './messageRouter';

console.log('Background service worker started.');

/**
 * Listens for messages from other parts of the extension.
 *
 * IMPORTANT: We must return `true` from this event listener to indicate
 * that we will be sending a response asynchronously. This keeps the
 * message channel open.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  // Route the message and send the response back asynchronously.
  messageRouter.route(message).then(sendResponse);

  // Return true to indicate an async response.
  return true;
});

// Optional: Add a listener for when the extension is installed or updated.
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Learning Snapshot extension installed.');
  } else if (details.reason === 'update') {
    console.log('Learning Snapshot extension updated.');
  }
});