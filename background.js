// background.js - Service Worker
chrome.runtime.onInstalled.addListener(() => {
    // Set default theme to system
    chrome.storage.sync.set({
      theme: 'system',
      focusModeEnabled: false
    });
  });
  
  // Listen for extension icon click
  chrome.action.onClicked.addListener((tab) => {
    toggleFocusMode(tab);
  });
  
  // Toggle focus mode function
  async function toggleFocusMode(tab) {
    try {
      const result = await chrome.storage.sync.get(['focusModeEnabled']);
      const newState = !result.focusModeEnabled;
      
      await chrome.storage.sync.set({ focusModeEnabled: newState });
      
      // Inject or remove focus mode
      if (newState) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: enableFocusMode
        });
      } else {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: disableFocusMode
        });
      }
      
      // Update icon based on state
      chrome.action.setIcon({
        path: newState ? 'icons/icon-active.png' : 'icons/icon.png',
        tabId: tab.id
      });
    } catch (error) {
      console.error('Error toggling focus mode:', error);
    }
  }
  
  // Functions to be injected into content
  function enableFocusMode() {
    document.body.classList.add('reading-focus-mode');
  }
  
  function disableFocusMode() {
    document.body.classList.remove('reading-focus-mode');
  }
  
  // Listen for theme changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.theme && namespace === 'sync') {
      // Notify all tabs about theme change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'themeChanged',
            theme: changes.theme.newValue
          }).catch(() => {
            // Ignore errors for tabs that can't receive messages
          });
        });
      });
    }
  });
  