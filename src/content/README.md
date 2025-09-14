# Content Script - Web Sensor

This directory contains the content script implementation for the Contexus Chrome Extension, acting as the "Web Sensor" that detects and monitors LLM conversations.

## Files Overview

### `index.ts` - Main Content Script
- **Purpose**: Detects conversation elements on LLM platforms using MutationObserver
- **Features**:
  - Platform-specific conversation detection (ChatGPT, Gemini, Claude)
  - Real-time message monitoring with streaming support
  - Message completion detection and text extraction
  - SPA navigation handling for dynamic content
  - Foundation for capture UI rendering (Feature 4)

### `../adapters.ts` - Platform Adapters
- **Purpose**: Platform-specific CSS selectors and configuration
- **Features**:
  - OpenAI ChatGPT adapter with streaming response detection
  - Google Gemini adapter with dynamic content handling
  - Anthropic Claude adapter with prose content extraction
  - Generic fallback adapter for other platforms
  - Utility functions for selector testing and message extraction

### `../lib/content-test.ts` - Testing Utilities
- **Purpose**: Comprehensive testing suite for content script functionality
- **Features**:
  - Platform detection validation
  - Selector functionality testing
  - Message detection and extraction testing
  - Quick capture functionality testing

## How It Works

### 1. Platform Detection
```typescript
// Automatically detects current platform
const adapter = adapterUtils.getCurrentAdapter();
console.log(`Detected: ${adapter.name} (${adapter.platform})`);
```

### 2. Conversation Monitoring
```typescript
// Sets up MutationObserver to watch for new messages
observer.observe(conversationContainer, {
  childList: true,
  subtree: true,
  characterData: true,  // For streaming updates
  attributes: true      // For completion status changes
});
```

### 3. Message Processing
```typescript
// Each detected message gets:
messageElement.setAttribute('data-contexus-message', 'true');
messageElement.setAttribute('data-contexus-complete', isComplete.toString());
messageElement.setAttribute('data-contexus-type', 'user|assistant');
messageElement.setAttribute('data-contexus-capture-ready', 'true');

// And stores capture data:
(messageElement as any).__contextusCaptureData = {
  text: messageText,
  timestamp: Date.now(),
  platform: 'openai|gemini|claude',
  url: window.location.href,
  isUser: boolean,
  isAssistant: boolean
};
```

## Testing

### Browser Console Testing
1. Navigate to a supported LLM platform (ChatGPT, Gemini, or Claude)
2. Open browser console
3. Run comprehensive tests:
```javascript
contentTest.runAllTests()
```

### Quick Debug Info
```javascript
contentTest.debugInfo()
```

### Manual Testing Functions
```javascript
// Access the content manager
window.contextusContent

// Get detected messages
window.contextusContent.getDetectedMessages()

// Get capture-ready messages
window.contextusContent.getCaptureReadyMessages()

// Test quick capture with selected text
window.contextusContent.quickCapture()
```

## Platform Support

### ✅ Fully Supported
- **OpenAI ChatGPT** (`chat.openai.com`)
  - Streaming response detection
  - User/assistant message classification
  - Markdown content extraction
  - Loading indicator detection

- **Google Gemini** (`gemini.google.com`)
  - Dynamic conversation updates
  - Multi-turn conversation handling
  - Rich content extraction
  - Generation status monitoring

- **Anthropic Claude** (`claude.ai`)
  - Prose content extraction
  - Typing indicator detection
  - Message completion tracking
  - Rich markdown rendering

### 🔧 Generic Support
- Other LLM platforms fall back to generic selectors
- Basic message detection and text extraction
- May require manual selector adjustment

## Integration Points

### With Feature 2 (Background Service)
- Uses messaging utilities to save captured snippets
- Communicates with background service for data persistence
- Platform detection for proper snippet categorization

### With Feature 4 (Capture UI) - Coming Next
- Provides `data-contexus-capture-ready` elements for UI attachment
- Stores message data in `__contextusCaptureData` for easy access
- Maintains completion status for UI state management

### With Feature 5 (Side Panel) - Future
- Dispatches `contextus:conversation-update` events for real-time updates
- Provides access methods for getting detected messages
- Supports quick capture functionality

## Development Notes

- Content script runs in isolated world with access to page DOM
- Uses ES modules with `.js` extensions for compatibility
- Handles SPA navigation by monitoring history changes
- Robust error handling and retry logic for dynamic content
- TypeScript fully typed with platform adapter interfaces
- Console logging with `[Contexus]` prefix for easy debugging

## Extension Architecture Integration

The content script serves as the critical "sensor" layer that:
1. **Detects** conversations happening on LLM platforms
2. **Monitors** for new messages and streaming updates
3. **Prepares** messages for capture by Feature 4 UI components
4. **Communicates** with the background service for data persistence
5. **Adapts** to different platform structures and behaviors

This foundation enables the full capture workflow that will be completed in Feature 4! 🎯