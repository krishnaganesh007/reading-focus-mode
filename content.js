// content.js - Content script that runs on web pages

let currentTheme = 'system';

// Initialize on page load
(function() {
  // Load saved settings
  chrome.storage.sync.get(['theme', 'focusModeEnabled'], (result) => {
    currentTheme = result.theme || 'system';
    
    // Apply theme
    applyTheme(currentTheme);
    
    // Apply focus mode if enabled
    if (result.focusModeEnabled) {
      document.body.classList.add('reading-focus-mode');
    }
  });
  
  // Detect system theme preference
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    });
  }
})();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'themeChanged') {
    currentTheme = message.theme;
    applyTheme(currentTheme);
  }
  
  if (message.type === 'toggleFocusMode') {
    document.body.classList.toggle('reading-focus-mode');
  }
});

// Apply theme function
function applyTheme(theme) {
  // Remove existing theme classes
  document.documentElement.classList.remove('reading-theme-light', 'reading-theme-dark', 'reading-theme-paper');
  
  let actualTheme = theme;
  
  // Handle system theme
  if (theme === 'system') {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      actualTheme = 'dark';
    } else {
      actualTheme = 'light';
    }
  }
  
  // Apply the theme class
  document.documentElement.classList.add(`reading-theme-${actualTheme}`);
}

// Hide common ad containers
function hideAdContainers() {
  const adSelectors = [
    '[class*="ad"]',
    '[id*="ad"]',
    '[class*="advertisement"]',
    '[id*="advertisement"]',
    '.google-ads',
    '.adsystem',
    '.ad-container',
    '.sidebar-ads',
    '.banner-ad',
    '[class*="sponsored"]',
    '[data-ad-client]'
  ];
  
  adSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.offsetHeight > 0 || el.offsetWidth > 0) {
          el.style.display = 'none !important';
        }
      });
    } catch (e) {
      // Ignore selector errors
    }
  });
}

// Initialize ad hiding
setTimeout(hideAdContainers, 1000);

// Re-run ad hiding when DOM changes
const observer = new MutationObserver((mutations) => {
  let shouldHideAds = false;
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length) {
      shouldHideAds = true;
    }
  });
  
  if (shouldHideAds) {
    hideAdContainers();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
