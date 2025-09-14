/**
 * TypeScript type definitions for Contexus Chrome Extension
 *
 * This module defines the core data structures used throughout the application:
 * - Snippet: Represents captured conversation snippets from LLM platforms
 * - Role: Represents reusable personas/roles that can be applied to snippets
 */

/**
 * Represents a captured conversation snippet from LLM platforms
 */
export interface Snippet {
  /** UUID unique identifier */
  id?: string;

  /** The captured text content from the conversation */
  content: string;

  /** URL of the source page where snippet was captured */
  sourceUrl: string;

  /** Timestamp when the snippet was created */
  createdAt: Date;

  /** Timestamp when the snippet was last updated */
  updatedAt?: Date;

  /** Optional title or summary for the snippet */
  title?: string;

  /** Tags for categorization and search */
  tags?: string[];

  /** Platform where the snippet was captured (e.g., 'openai', 'gemini', 'claude') */
  platform?: 'openai' | 'gemini' | 'claude' | 'other';

  /** Whether the snippet is marked as favorite */
  isFavorite?: boolean;
}

/**
 * Represents a reusable role/persona that can be applied to snippets
 */
export interface Role {
  /** UUID unique identifier */
  id?: string;

  /** Display name of the role */
  name: string;

  /** Detailed description of the role's purpose and behavior */
  description: string;

  /** The prompt template that defines the role's behavior */
  promptTemplate: string;

  /** Timestamp when the role was created */
  createdAt: Date;

  /** Timestamp when the role was last updated */
  updatedAt?: Date;

  /** Whether this is a default system role or user-created */
  isSystem?: boolean;

  /** Category for organizing roles (e.g., 'coding', 'writing', 'analysis') */
  category?: string;

  /** Usage count for analytics and sorting */
  usageCount?: number;
}

/**
 * Message types for Chrome extension messaging between components
 */
export type MessageType =
  | 'SAVE_SNIPPET'
  | 'SEARCH_SNIPPETS'
  | 'GET_ALL_ROLES'
  | 'GET_SNIPPET_BY_ID'
  | 'UPDATE_SNIPPET'
  | 'DELETE_SNIPPET'
  | 'CREATE_ROLE'
  | 'UPDATE_ROLE'
  | 'DELETE_ROLE';

/**
 * Base structure for Chrome extension messages
 */
export interface ChromeMessage {
  type: MessageType;
  payload?: any;
}

/**
 * Message payload for saving a new snippet
 */
export interface SaveSnippetPayload {
  content: string;
  sourceUrl: string;
  title?: string;
  tags?: string[];
  platform?: Snippet['platform'];
}

/**
 * Message payload for searching snippets
 */
export interface SearchSnippetsPayload {
  query: string;
  limit?: number;
  offset?: number;
}

/**
 * Response structure for search operations
 */
export interface SearchResponse<T> {
  results: T[];
  total: number;
  hasMore: boolean;
}