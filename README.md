# Reading Focus Mode

A Chrome extension that removes distractions, applies clean reading themes, and lets you save articles to Markdown for use in Obsidian.

## Features

- Ad and distraction removal:
  - Hides ads, sidebars, popups, cookie/GDPR banners, newsletter signups, share/follow widgets
  - Hides embedded videos (YouTube, Vimeo, Twitch, etc.) and other media embeds
- Reading enhancements:
  - Themes: Light, Dark, Paper, or System (auto)
  - Proper text color inversion per theme
  - Content expanded to full width for better reading (site-specific tweaks included; e.g., aeon.co)
  - Keeps the site’s original fonts
- Save to Obsidian (Markdown):
  - Extracts article content and downloads a `.md` file
  - Includes title, source URL, and saved date
  - Works even when sites use different article structures (best effort)

## Installation

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable “Developer mode” (top right).
4. Click “Load unpacked” and select the `reading-focus-mode` folder.
5. The extension icon will appear in your toolbar.

## Permissions

- `activeTab`, `scripting`: needed to toggle focus mode and extract content on the current page.
- `storage`: saves your theme and focus-mode preference.
- `declarativeNetRequest`: base for ad/distraction rules.
- `host_permissions: <all_urls>`: to work on any site.

## Usage

- Click the extension icon to open the popup.
- Click “Activate Focus Mode” to toggle the reading mode on the current page.
- Select a theme: Light, Dark, Paper, or System.
- Optional: Click “Save to Obsidian” to download the current article as a Markdown file.

## Save to Obsidian (Markdown)

- Click “Save to Obsidian” in the popup.
- The extension will:
  - Try common article containers (`article`, `main`, `.entry-content`, `.article-body`, etc.)
  - Fallback to full-page text if needed
  - Download a file named from the page title (sanitized) with:
    - Title as `# Heading`
    - Source URL and saved date
    - Clean text content

Notes:
- Some sites with heavy client-side rendering or unusual structures may require a second click after the page fully loads.
- The output is plain Markdown text optimized for readability (not a pixel-perfect copy).

## Troubleshooting

- “No article content found”:
  - Wait a few seconds and try again (some content loads late).
  - Scroll the page once and retry (triggers lazy content visibility on some sites).
  - If it keeps failing, it will still fall back to the page body, but results might be noisy.

- “Could not toggle focus mode”:
  - Ensure the tab is a regular web page (not Chrome Web Store, `chrome://` pages, or special URLs where extensions can’t run).

- “Save to Obsidian” downloaded an empty/short note:
  - The page may be behind a paywall or dynamically rendering the content.
  - Try enabling Focus Mode first, then save.
  - Reload the page and try again after the content appears.

## Development

Project structure:
- `manifest.json`: MV3 config and permissions
- `background.js`: toggling and theme notification
- `content.js`: applies themes and focus-mode class; baseline ad hiding
- `focus-mode.css`: focus mode styling, theme vars, distraction selectors
- `popup.html` / `popup.js`: UI for toggling, theme switching, and “Save to Obsidian”
- `rules.json`: declarative net request rules
- `icons/`: extension icons

Key behaviors:
- Focus Mode adds `reading-focus-mode` to `body`.
- Themes apply via `html.reading-theme-{light|dark|paper}` and CSS variables.
- CSS hides common distractions (ads, newsletter boxes, embeds, popups, cookies).
- “Save to Obsidian” uses a best-effort content extraction with generous fallbacks.

## Privacy

- No analytics, tracking, or external requests.
- Everything runs locally in your browser.
- The Markdown file is generated client-side and downloaded directly.

## Known Site Notes

- aeon.co: width expansion and distractions handled. If you still see residual promos/embeds, toggle Focus Mode once after the page fully loads.

## Changelog

- v1.1
  - Added “Save to Obsidian” (Markdown) with robust content fallback
  - Kept site fonts, improved theme color inversion
  - Expanded width rules and added site-specific tweaks
  - Hides newsletter signups, popups, embeds, cookie banners, social widgets

- v1.0
  - Initial release with Focus Mode, themes, and ad/distraction removal