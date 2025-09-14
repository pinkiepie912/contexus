# Contexus Extension Library

This directory contains the core utilities and services for the Contexus Chrome Extension.

## Files Overview

### `db.ts` - Database Layer
- **Purpose**: Dexie.js database setup with TypeScript support
- **Features**:
  - UUID-based primary keys for snippets and roles
  - Automatic timestamp management
  - Default system role seeding
  - Search and filtering utilities
- **Usage**: Import `{ db, dbUtils }` for database operations

### `messaging.ts` - Communication Layer
- **Purpose**: Typed messaging between extension components
- **Features**:
  - Promise-based API for background service communication
  - Error handling and type safety
  - Batch operations for performance
  - Content script utilities
- **Usage**: Import specific functions like `saveSnippet()`, `searchSnippets()`, etc.

### `background-test.ts` - Testing Utilities
- **Purpose**: Validation and testing of background service worker
- **Features**:
  - Automated test suite for all background operations
  - Individual test functions for debugging
  - Console-friendly output and error reporting
- **Usage**: In browser console, run `backgroundTest.runAllTests()`

## Usage Examples

### Saving a Snippet (from content script)
```typescript
import { content } from './lib/messaging.js';

// Capture selected text
try {
  const result = await content.captureSelection({
    title: 'Important AI Response',
    tags: ['ai', 'helpful']
  });

  if (result.success) {
    console.log('Snippet saved:', result.snippetId);
  }
} catch (error) {
  console.error('Failed to save snippet:', error);
}
```

### Searching Snippets (from side panel)
```typescript
import { searchSnippets } from './lib/messaging.js';

const results = await searchSnippets('machine learning', {
  limit: 20,
  offset: 0
});

console.log(`Found ${results.total} snippets`);
results.results.forEach(snippet => {
  console.log(snippet.title, '-', snippet.content.substring(0, 100));
});
```

### Working with Roles (from side panel)
```typescript
import { getAllRoles, createRole } from './lib/messaging.js';

// Get all available roles
const roles = await getAllRoles();
const systemRoles = roles.filter(role => role.isSystem);

// Create custom role
await createRole({
  name: 'Code Optimizer',
  description: 'Focuses on code performance and efficiency',
  promptTemplate: 'You are a code optimization expert...',
  category: 'coding'
});
```

## Database Schema

### Snippets Table
```typescript
interface Snippet {
  id?: string;          // UUID primary key
  content: string;      // The captured text content
  sourceUrl: string;    // URL where snippet was captured
  createdAt: Date;      // Auto-generated timestamp
  updatedAt?: Date;     // Auto-updated timestamp
  title?: string;       // Optional title/summary
  tags?: string[];      // Tags for categorization
  platform?: 'openai' | 'gemini' | 'claude' | 'other';
  isFavorite?: boolean; // User favorite flag
}
```

### Roles Table
```typescript
interface Role {
  id?: string;          // UUID primary key
  name: string;         // Display name
  description: string;  // Role description
  promptTemplate: string; // The actual prompt template
  createdAt: Date;      // Auto-generated timestamp
  updatedAt?: Date;     // Auto-updated timestamp
  isSystem?: boolean;   // System vs user role
  category?: string;    // Category for organization
  usageCount?: number;  // Usage analytics
}
```

## Message Types

The extension uses typed messages for communication:

```typescript
type MessageType =
  | 'SAVE_SNIPPET'      // Save new snippet
  | 'SEARCH_SNIPPETS'   // Search existing snippets
  | 'GET_ALL_ROLES'     // Get all available roles
  | 'GET_SNIPPET_BY_ID' // Get specific snippet
  | 'UPDATE_SNIPPET'    // Update existing snippet
  | 'DELETE_SNIPPET'    // Delete snippet
  | 'CREATE_ROLE'       // Create new role
  | 'UPDATE_ROLE'       // Update existing role
  | 'DELETE_ROLE';      // Delete role
```

## Testing

To test the background service worker:

1. Load the extension in Chrome
2. Open browser console
3. Run: `backgroundTest.runAllTests()`

This will validate:
- ✅ Connection to background service worker
- ✅ Database seeding with default roles
- ✅ Snippet CRUD operations
- ✅ Role CRUD operations
- ✅ Search functionality

## Development Notes

- All database operations are asynchronous and return promises
- UUID primary keys ensure unique identifiers across instances
- Error handling is built into all messaging functions
- TypeScript provides full type safety across all operations
- The database automatically seeds with 4 default system roles on first run