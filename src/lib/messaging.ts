/**
 * Messaging utility for Chrome Extension communication
 *
 * This module provides typed messaging functions for communication between
 * different parts of the extension (content scripts, side panel, popup, background).
 * All functions return promises and handle errors gracefully.
 */

import type {
  ChromeMessage,
  SaveSnippetPayload,
  SearchSnippetsPayload,
  SearchResponse,
  Snippet,
  Role
} from '../types';

/**
 * Base message sending function with error handling
 */
async function sendMessage<T = any>(
  message: ChromeMessage,
  options?: { timeoutMs?: number; retries?: number; retryDelayMs?: number }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 10000;
  const retries = options?.retries ?? 1;
  const retryDelayMs = options?.retryDelayMs ?? 200;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await new Promise<T>((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error('Messaging timeout'));
        }, timeoutMs);
      
        chrome.runtime.sendMessage(message, (response) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);

          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response?.error) {
            reject(new Error(response.error));
            return;
          }

          resolve(response as T);
        });
      });
      return result;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, retryDelayMs));
        continue;
      }
      throw lastError;
    }
  }

  // Unreachable
  throw lastError ?? new Error('Unknown messaging error');
}

/**
 * Save a snippet to the database
 */
/**
 * Save a snippet to the database
 * Note: Prefer using `content.capture(...)` which wraps metadata and selection logic.
 */
export async function saveSnippet(payload: SaveSnippetPayload): Promise<{
  success: boolean;
  snippetId?: string;
  message?: string;
  error?: string;
}> {
  return sendMessage({ type: 'SAVE_SNIPPET', payload });
}

/**
 * Search snippets with optional filters
 */
export async function searchSnippets(
  query: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<SearchResponse<Snippet>> {
  const payload: SearchSnippetsPayload = {
    query,
    limit: options?.limit,
    offset: options?.offset
  };

  return sendMessage({
    type: 'SEARCH_SNIPPETS',
    payload
  });
}

/**
 * Get all roles from the database
 */
export async function getAllRoles(): Promise<Role[]> {
  return sendMessage({
    type: 'GET_ALL_ROLES'
  });
}

/**
 * Get a specific snippet by ID
 */
export async function getSnippetById(snippetId: string): Promise<Snippet | null> {
  return sendMessage({
    type: 'GET_SNIPPET_BY_ID',
    payload: snippetId
  });
}

/**
 * Update a snippet
 */
export async function updateSnippet(
  id: string,
  updates: Partial<Snippet>
): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    type: 'UPDATE_SNIPPET',
    payload: { id, updates }
  });
}

/**
 * Delete a snippet
 */
export async function deleteSnippet(snippetId: string): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    type: 'DELETE_SNIPPET',
    payload: snippetId
  });
}

/**
 * Create a new role
 */
export async function createRole(
  role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem' | 'usageCount'>
): Promise<{ success: boolean; roleId?: string; error?: string }> {
  return sendMessage({
    type: 'CREATE_ROLE',
    payload: role
  });
}

/**
 * Update a role
 */
export async function updateRole(
  id: string,
  updates: Partial<Role>
): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    type: 'UPDATE_ROLE',
    payload: { id, updates }
  });
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string): Promise<{ success: boolean; error?: string }> {
  return sendMessage({
    type: 'DELETE_ROLE',
    payload: roleId
  });
}

/**
 * Utility function for testing connection to background service worker
 */
export async function pingBackground(): Promise<{ pong: boolean; at: number }> {
  return sendMessage({ ping: true } as any);
}

/**
 * Batch operations for better performance
 */
export const batch = {
  /**
   * Save multiple snippets at once
   */
  async saveSnippets(snippets: SaveSnippetPayload[]): Promise<{
    success: boolean;
    results: { snippetId?: string; error?: string }[];
  }> {
    const results = await Promise.allSettled(
      snippets.map(snippet => saveSnippet(snippet))
    );

    return {
      success: results.every(result => result.status === 'fulfilled' && result.value.success),
      results: results.map(result =>
        result.status === 'fulfilled'
          ? result.value
          : { error: result.reason?.message || 'Unknown error' }
      )
    };
  },

  /**
   * Delete multiple snippets at once
   */
  async deleteSnippets(snippetIds: string[]): Promise<{
    success: boolean;
    results: { success: boolean; error?: string }[];
  }> {
    const results = await Promise.allSettled(
      snippetIds.map(id => deleteSnippet(id))
    );

    return {
      success: results.every(result => result.status === 'fulfilled' && result.value.success),
      results: results.map(result =>
        result.status === 'fulfilled'
          ? result.value
          : { success: false, error: result.reason?.message || 'Unknown error' }
      )
    };
  }
};

/**
 * Utility functions for content scripts
 */
/**
 * Get context about current page for snippet metadata
 */
export function getPageContext(): {
  url: string;
  title: string;
  platform: 'openai' | 'gemini' | 'claude' | 'other';
} {
  const url = window.location.href;
  let platform: 'openai' | 'gemini' | 'claude' | 'other' = 'other';

  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) platform = 'openai';
  else if (url.includes('gemini.google.com')) platform = 'gemini';
  else if (url.includes('claude.ai')) platform = 'claude';

  return { url, title: document.title, platform };
}

/**
 * Unified content capture API
 * - Accepts direct text, or uses selection, or auto-fallback to text when no selection
 */
export async function capture(params: {
  text?: string;
  source?: 'selection' | 'auto';
  fallbackText?: string;
  title?: string;
  tags?: string[];
  meta?: {
    isUser?: boolean;
    platform?: 'openai' | 'gemini' | 'claude' | 'other';
    url?: string;
    messageId?: string;
  };
}): Promise<{ success: boolean; snippetId?: string; error?: string }> {
  try {
    const ctx = getPageContext();

    let contentText = params.text?.trim();
    if (!contentText) {
      if (params.source === 'selection' || params.source === 'auto') {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        if (selectedText) {
          contentText = selectedText;
        } else if (params.source === 'auto') {
          contentText = params.fallbackText?.trim();
        }
      }
    }

    if (!contentText) {
      return { success: false, error: 'No content to capture' };
    }

    const payload: SaveSnippetPayload = {
      content: contentText,
      sourceUrl: params.meta?.url || ctx.url,
      title: params.title || ctx.title,
      tags: params.tags || [],
      platform: params.meta?.platform || ctx.platform,
    };
  
    return await saveSnippet(payload);
  } catch (error: any) {
    return { success: false, error: error?.message || 'Capture failed' };
  }
}

/**
 * Backwards-compatible namespace export
 */
export const content = {
  capture,
  getPageContext,
};
