// Background script for Mistral Core Agent
chrome.runtime.onInstalled.addListener(() => {
  console.log("Mistral Core Agent Extension Installed");
});

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "ok" });
  }
  return true;
});
