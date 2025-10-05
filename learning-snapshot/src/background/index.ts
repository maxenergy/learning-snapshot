import { messageRouter } from './messageRouter';
import type { Message } from '../types/messages';

console.log('Background service worker started.');

chrome.runtime.onMessage.addListener(
  (message: Message, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    console.log('Received message:', message);
    messageRouter.route(message).then(sendResponse);
    return true;
  }
);

chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
  if (details.reason === 'install') {
    console.log('Learning Snapshot extension installed.');
  } else if (details.reason === 'update') {
    console.log('Learning Snapshot extension updated.');
  }
});