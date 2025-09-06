// popup.js - Popup interface logic

// Functions to inject into content (moved outside DOMContentLoaded)
function enableFocusMode() {
  document.body.classList.add('reading-focus-mode');
}

function disableFocusMode() {
  document.body.classList.remove('reading-focus-mode');
}

// Simple function to extract article content
function extractArticleContent() {
  console.log('Starting content extraction...');
  
  // Get basic page info
  const title = document.title || 'Untitled Article';
  const url = window.location.href;
  const date = new Date().toLocaleDateString();
  
  // Try to find the main content area
  let contentElement = null;
  
  // First, try common article selectors
  const selectors = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.article-body',
    '.story-body'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 100) {
      contentElement = element;
      console.log(`Found content with selector: ${selector}`);
      break;
    }
  }
  
  // If no specific content found, use the body
  if (!contentElement) {
    contentElement = document.body;
    console.log('Using body as content source');
  }
  
  // Extract text content
  let content = '';
  
  if (contentElement) {
    // Get all text nodes and preserve some structure
    const walker = document.createTreeWalker(
      contentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Skip empty or whitespace-only text nodes
          if (node.textContent.trim().length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node.textContent.trim());
    }
    
    content = textNodes.join('\n\n');
    
    // If that didn't work, try a simpler approach
    if (content.length < 100) {
      content = contentElement.textContent || contentElement.innerText || '';
    }
  }
  
  console.log(`Extracted content length: ${content.length}`);
  
  // Clean up the content
  content = content
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
    .trim();
  
  return {
    title,
    content,
    url,
    date
  };
}

document.addEventListener('DOMContentLoaded', async () => {
    const toggleButton = document.getElementById('toggleButton');
    const saveToObsidianButton = document.getElementById('saveToObsidian');
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

    // Save to Obsidian button click handler
    saveToObsidianButton.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      try {
        updateStatus('Extracting article content...');
        
        // Execute the article extraction function on the active tab
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractArticleContent
        });
        
        console.log('Results from content script:', results);
        
        if (results && results[0] && results[0].result) {
          const articleData = results[0].result;
          console.log('Article data:', articleData);
          
          if (articleData.content && articleData.content.trim().length > 50) {
            downloadMarkdown(articleData);
            updateStatus(`Article saved! (${articleData.content.length} chars)`);
          } else {
            updateStatus(`Content too short: ${articleData.content ? articleData.content.length : 0} chars`);
          }
        } else {
          updateStatus('No article content found');
        }
        
      } catch (error) {
        console.error('Error saving to Obsidian:', error);
        updateStatus('Error: Could not save article');
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
      }, 3000);
    }

    // Function to download markdown file
    function downloadMarkdown(articleData) {
      const { title, content, url, date } = articleData;
      
      // Create markdown content
      const markdown = `# ${title}

**Source:** [${url}](${url})  
**Saved:** ${date}

---

${content}`;

      // Create and download file
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url_blob = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url_blob;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url_blob);
    }
  });
  