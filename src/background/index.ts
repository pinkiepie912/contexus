/**
 * Background Service Worker for Contexus Chrome Extension
 *
 * This service worker acts as the "Core Brain" of the extension, handling:
 * - Database initialization and seeding with default roles
 * - Snippet saving operations from content scripts
 * - Data query operations for the side panel UI
 * - Message passing between different extension components
 */

import { db, dbUtils } from '../lib/db.js';
import type {
  ChromeMessage,
  SaveSnippetPayload,
  SearchSnippetsPayload,
  SearchResponse,
  Snippet,
  Role
} from '../types.js';

/**
 * Extension installation handler
 * Initializes the database and seeds it with default roles
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Contexus SW] Extension installed/updated:', details.reason);

  try {
    // Initialize database - this will trigger seeding if it's the first time
    await db.open();

    // Get initial statistics
    const stats = await db.getStats();
    console.log('[Contexus SW] Database initialized with stats:', stats);

    // Set up initial extension state if needed
    if (details.reason === 'install') {
      console.log('[Contexus SW] First-time installation completed');

      // Optionally show welcome notification or setup
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: '/icons/icon48.png',
        title: 'Contexus Extension Installed',
        message: 'Ready to capture and organize your LLM conversations!'
      });
    }

  } catch (error) {
    console.error('[Contexus SW] Database initialization failed:', error);
  }
});

/**
 * Message handler for inter-component communication
 * Handles messages from content scripts, side panel, and popup
 */
chrome.runtime.onMessage.addListener((
  message: ChromeMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  console.log('[Contexus SW] Received message:', message.type, 'from:', sender.tab?.url);

  // Handle different message types
  switch (message.type) {
    case 'SAVE_SNIPPET':
      handleSaveSnippet(message.payload as SaveSnippetPayload, sender, sendResponse);
      return true; // Keep message channel open for async response

    case 'SEARCH_SNIPPETS':
      handleSearchSnippets(message.payload as SearchSnippetsPayload, sendResponse);
      return true; // Keep message channel open for async response

    case 'GET_ALL_ROLES':
      handleGetAllRoles(sendResponse);
      return true; // Keep message channel open for async response

    case 'GET_SNIPPET_BY_ID':
      handleGetSnippetById(message.payload as string, sendResponse);
      return true; // Keep message channel open for async response

    case 'UPDATE_SNIPPET':
      handleUpdateSnippet(message.payload, sendResponse);
      return true; // Keep message channel open for async response

    case 'DELETE_SNIPPET':
      handleDeleteSnippet(message.payload as string, sendResponse);
      return true; // Keep message channel open for async response

    case 'CREATE_ROLE':
      handleCreateRole(message.payload, sendResponse);
      return true; // Keep message channel open for async response

    case 'UPDATE_ROLE':
      handleUpdateRole(message.payload, sendResponse);
      return true; // Keep message channel open for async response

    case 'DELETE_ROLE':
      handleDeleteRole(message.payload as string, sendResponse);
      return true; // Keep message channel open for async response

    // Legacy ping handler for testing
    default:
      if ((message as any)?.ping) {
        sendResponse({ pong: true, at: Date.now() });
        return true;
      }

      console.warn('[Contexus SW] Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
      return false;
  }
});

/**
 * Handle snippet saving from content scripts
 */
async function handleSaveSnippet(
  payload: SaveSnippetPayload,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  try {
    console.log('[Contexus SW] Saving snippet:', payload.title || 'Untitled');

    // Extract platform from URL if not provided
    let platform = payload.platform;
    if (!platform && sender.tab?.url) {
      platform = detectPlatformFromUrl(sender.tab.url);
    }

    // Create snippet object
    const snippet: Omit<Snippet, 'id'> = {
      content: payload.content,
      sourceUrl: payload.sourceUrl || sender.tab?.url || '',
      title: payload.title,
      tags: payload.tags || [],
      platform: platform,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    const savedId = await db.snippets.add(snippet);

    console.log('[Contexus SW] Snippet saved with ID:', savedId);

    sendResponse({
      success: true,
      snippetId: savedId,
      message: 'Snippet saved successfully'
    });

  } catch (error) {
    console.error('[Contexus SW] Error saving snippet:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle snippet search requests
 */
async function handleSearchSnippets(
  payload: SearchSnippetsPayload,
  sendResponse: (response: SearchResponse<Snippet>) => void
) {
  try {
    console.log('[Contexus SW] Searching snippets:', payload.query);

    const results = await dbUtils.searchSnippets(payload.query, {
      limit: payload.limit,
      offset: payload.offset
    });

    const total = await db.snippets.count();
    const hasMore = (payload.offset || 0) + results.length < total;

    sendResponse({
      results,
      total,
      hasMore
    });

  } catch (error) {
    console.error('[Contexus SW] Error searching snippets:', error);
    sendResponse({
      results: [],
      total: 0,
      hasMore: false
    });
  }
}

/**
 * Handle get all roles requests
 */
async function handleGetAllRoles(
  sendResponse: (response: Role[]) => void
) {
  try {
    console.log('[Contexus SW] Getting all roles');

    const roles = await db.roles.orderBy('name').toArray();
    sendResponse(roles);

  } catch (error) {
    console.error('[Contexus SW] Error getting roles:', error);
    sendResponse([]);
  }
}

/**
 * Handle get snippet by ID requests
 */
async function handleGetSnippetById(
  snippetId: string,
  sendResponse: (response: Snippet | null) => void
) {
  try {
    console.log('[Contexus SW] Getting snippet by ID:', snippetId);

    const snippet = await db.snippets.get(snippetId);
    sendResponse(snippet || null);

  } catch (error) {
    console.error('[Contexus SW] Error getting snippet:', error);
    sendResponse(null);
  }
}

/**
 * Handle snippet update requests
 */
async function handleUpdateSnippet(
  payload: { id: string; updates: Partial<Snippet> },
  sendResponse: (response: { success: boolean; error?: string }) => void
) {
  try {
    console.log('[Contexus SW] Updating snippet:', payload.id);

    const updatedCount = await db.snippets.update(payload.id, {
      ...payload.updates,
      updatedAt: new Date()
    });

    sendResponse({
      success: updatedCount > 0
    });

  } catch (error) {
    console.error('[Contexus SW] Error updating snippet:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle snippet deletion requests
 */
async function handleDeleteSnippet(
  snippetId: string,
  sendResponse: (response: { success: boolean; error?: string }) => void
) {
  try {
    console.log('[Contexus SW] Deleting snippet:', snippetId);

    await db.snippets.delete(snippetId);

    sendResponse({ success: true });

  } catch (error) {
    console.error('[Contexus SW] Error deleting snippet:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle role creation requests
 */
async function handleCreateRole(
  payload: Omit<Role, 'id'>,
  sendResponse: (response: { success: boolean; roleId?: string; error?: string }) => void
) {
  try {
    console.log('[Contexus SW] Creating role:', payload.name);

    const roleId = await db.roles.add({
      ...payload,
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystem: false, // User-created roles are never system roles
      usageCount: 0
    });

    sendResponse({
      success: true,
      roleId: roleId as string
    });

  } catch (error) {
    console.error('[Contexus SW] Error creating role:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle role update requests
 */
async function handleUpdateRole(
  payload: { id: string; updates: Partial<Role> },
  sendResponse: (response: { success: boolean; error?: string }) => void
) {
  try {
    console.log('[Contexus SW] Updating role:', payload.id);

    const updatedCount = await db.roles.update(payload.id, {
      ...payload.updates,
      updatedAt: new Date()
    });

    sendResponse({
      success: updatedCount > 0
    });

  } catch (error) {
    console.error('[Contexus SW] Error updating role:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle role deletion requests
 */
async function handleDeleteRole(
  roleId: string,
  sendResponse: (response: { success: boolean; error?: string }) => void
) {
  try {
    console.log('[Contexus SW] Deleting role:', roleId);

    // Check if it's a system role (should not be deleted)
    const role = await db.roles.get(roleId);
    if (role?.isSystem) {
      sendResponse({
        success: false,
        error: 'Cannot delete system roles'
      });
      return;
    }

    await db.roles.delete(roleId);

    sendResponse({ success: true });

  } catch (error) {
    console.error('[Contexus SW] Error deleting role:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Utility function to detect platform from URL
 */
function detectPlatformFromUrl(url: string): Snippet['platform'] {
  if (url.includes('chat.openai.com')) return 'openai';
  if (url.includes('gemini.google.com')) return 'gemini';
  if (url.includes('claude.ai')) return 'claude';
  return 'other';
}

/**
 * Handle extension startup
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Contexus SW] Extension startup');

  try {
    // Ensure database is available
    await db.open();
    console.log('[Contexus SW] Database ready');
  } catch (error) {
    console.error('[Contexus SW] Database startup error:', error);
  }
});

/**
 * Handle service worker suspension preparation
 */
self.addEventListener('beforeunload', () => {
  console.log('[Contexus SW] Service worker suspending');
});
