// popup.js - Popup interface logic

document.addEventListener('DOMContentLoaded', async () => {
    const toggleButton = document.getElementById('toggleButton');
    const statusDiv = document.getElementById('status');
    const themeButtons = {
      light: document.getElementById('lightTheme'),
      dark: document.getElementById('darkTheme'),
      paper: document.getElementById('paperTheme'),
      system: document.getElementById('systemTheme')
    };
  
    // Load current state
    const result = await chrome.storage.sync.get(['focusModeEnabled', 'theme']);
    let focusMode = result.focusModeEnabled || false;
    const currentTheme = result.theme || 'system';
  
    // Update UI based on current state
    updateToggleButton(focusMode);
    updateThemeButtons(currentTheme);
  
    // Toggle button click handler
    toggleButton.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      try {
        const newState = !focusMode;
        await chrome.storage.sync.set({ focusModeEnabled: newState });
        
        // Execute the toggle function on the active tab
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: newState ? enableFocusMode : disableFocusMode
        });
        
        updateToggleButton(newState);
        updateStatus(newState ? 'Focus mode activated!' : 'Focus mode deactivated');
        
        // Update the local focusMode variable
        focusMode = newState;
        
      } catch (error) {
        console.error('Error toggling focus mode:', error);
        updateStatus('Error: Could not toggle focus mode');
      }
    });
  
    // Theme button click handlers
    Object.entries(themeButtons).forEach(([theme, button]) => {
      button.addEventListener('click', async () => {
        await chrome.storage.sync.set({ theme });
        updateThemeButtons(theme);
        updateStatus(`${theme} theme applied`);
        
        // Notify content script about theme change
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'themeChanged',
            theme: theme
          });
        } catch (error) {
          // Tab might not have content script loaded
          console.log('Could not send theme message to tab');
        }
      });
    });
  
    // Helper functions
    function updateToggleButton(isActive) {
      if (isActive) {
        toggleButton.textContent = 'Deactivate Focus Mode';
        toggleButton.className = 'toggle-button active';
      } else {
        toggleButton.textContent = 'Activate Focus Mode';
        toggleButton.className = 'toggle-button inactive';
      }
    }
  
    function updateThemeButtons(activeTheme) {
      Object.entries(themeButtons).forEach(([theme, button]) => {
        if (theme === activeTheme) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });
    }
  
    function updateStatus(message) {
      statusDiv.textContent = message;
      setTimeout(() => {
        statusDiv.textContent = 'Ready to focus your reading';
      }, 2000);
    }
  });
  
  // Functions to inject into content
  function enableFocusMode() {
    document.body.classList.add('reading-focus-mode');
  }
  
  function disableFocusMode() {
    document.body.classList.remove('reading-focus-mode');
  }
  