// Popup script to handle communication between the React app and the extension
const frame = document.getElementById('app-frame');

window.addEventListener('message', async (event) => {
  // Handle messages from the React app inside the iframe
  const { action, data, id } = event.data;

  if (action === 'GET_SNAPSHOT') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'getSnapshot' }, (response) => {
        frame.contentWindow.postMessage({ id, response }, '*');
      });
    }
  }

  if (action === 'EXECUTE_ACTIONS') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: 'executeActions', actions: data }, (response) => {
        frame.contentWindow.postMessage({ id, response }, '*');
      });
    }
  }
});
