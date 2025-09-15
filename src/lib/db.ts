/**
 * Database configuration and schema for Contexus Chrome Extension
 *
 * This module sets up the Dexie.js IndexedDB wrapper with TypeScript support.
 * It defines the database schema for snippets and roles, and provides
 * a typed database instance for use throughout the application.
 */

import Dexie, { type EntityTable } from "dexie";
import { v4 as uuidv4 } from "uuid";

import type { Snippet, Role } from "../types";

/**
 * Contexus Database class extending Dexie
 *
 * Defines the database schema with two main tables:
 * - snippets: For storing captured conversation snippets
 * - roles: For storing reusable personas/roles
 */
export class ContextusDB extends Dexie {
  /** Snippets table with UUID primary key */
  snippets!: EntityTable<Snippet, "id">;

  /** Roles table with UUID primary key */
  roles!: EntityTable<Role, "id">;

  constructor() {
    super("ContextusDB");

    // Schema version 1: Initial schema
    this.version(1).stores({
      // Snippets table:
      // - id: UUID primary key
      // - content: Full-text searchable content
      // - sourceUrl: Indexed for filtering by source
      // - createdAt: Indexed for chronological sorting
      // - platform: Indexed for filtering by platform
      // - tags: Multi-valued index for tag-based filtering
      snippets: "id, content, sourceUrl, createdAt, platform, *tags",

      // Roles table:
      // - id: UUID primary key
      // - name: Indexed for quick lookup and sorting
      // - category: Indexed for filtering by category
      // - createdAt: Indexed for chronological sorting
      // - isSystem: Indexed for filtering system vs user roles
      roles: "id, name, category, createdAt, isSystem",
    });

    // Set up hooks for automatic timestamp and UUID management
    this.snippets.hook("creating", function (_primKey, obj, _trans) {
      const snippet = obj as Snippet;
      // Generate UUID if not provided
      if (!snippet.id) {
        snippet.id = uuidv4();
      }
      snippet.createdAt = new Date();
      snippet.updatedAt = new Date();
    });

    this.snippets.hook(
      "updating",
      function (modifications, _primKey, _obj, _trans) {
        (modifications as Partial<Snippet>).updatedAt = new Date();
      },
    );

    this.roles.hook("creating", function (_primKey, obj, _trans) {
      const role = obj as Role;
      // Generate UUID if not provided
      if (!role.id) {
        role.id = uuidv4();
      }
      role.createdAt = new Date();
      role.updatedAt = new Date();
      // Initialize usage count for new roles
      if (role.usageCount === undefined) {
        role.usageCount = 0;
      }
    });

    this.roles.hook("updating", function (modifications, _primKey, _obj, _trans) {
      (modifications as Partial<Role>).updatedAt = new Date();
    });

    // Set up initial data seeding
    this.on("populate", () => this.seedInitialData());
  }

  /**
   * Seeds the database with initial default roles
   * Called automatically when the database is first created
   */
  private async seedInitialData(): Promise<void> {
    console.log("Seeding initial data for ContextusDB");

    // Default system roles
    const now = new Date();
    const defaultRoles: Role[] = [
      {
        id: uuidv4(),
        name: "General Assistant",
        description: "A helpful, general-purpose assistant for various tasks",
        promptTemplate:
          "You are a helpful assistant. Please provide accurate, helpful, and friendly responses to user questions and requests.",
        createdAt: now,
        isSystem: true,
        category: "general",
        usageCount: 0,
      },
      {
        id: uuidv4(),
        name: "Code Reviewer",
        description:
          "Expert at reviewing code for best practices, bugs, and improvements",
        promptTemplate:
          "You are an expert code reviewer. Analyze the provided code for:\n- Code quality and best practices\n- Potential bugs or issues\n- Performance improvements\n- Security considerations\n- Maintainability\n\nProvide constructive feedback with specific suggestions.",
        createdAt: now,
        isSystem: true,
        category: "coding",
        usageCount: 0,
      },
      {
        id: uuidv4(),
        name: "Technical Writer",
        description:
          "Specializes in creating clear, comprehensive technical documentation",
        promptTemplate:
          "You are a technical writing expert. Help create clear, well-structured documentation that:\n- Explains complex concepts simply\n- Includes practical examples\n- Follows documentation best practices\n- Is accessible to the target audience\n\nFocus on clarity, accuracy, and usefulness.",
        createdAt: now,
        isSystem: true,
        category: "writing",
        usageCount: 0,
      },
      {
        id: uuidv4(),
        name: "Data Analyst",
        description:
          "Analyzes data patterns, creates insights, and suggests data-driven decisions",
        promptTemplate:
          "You are a data analyst expert. Help analyze data by:\n- Identifying patterns and trends\n- Creating meaningful insights\n- Suggesting data-driven recommendations\n- Explaining statistical concepts clearly\n- Proposing visualization approaches\n\nProvide actionable insights backed by data.",
        createdAt: now,
        isSystem: true,
        category: "analysis",
        usageCount: 0,
      },
    ];

    // Bulk insert default roles
    await this.roles.bulkAdd(defaultRoles);

    console.log(`Seeded ${defaultRoles.length} default roles`);
  }

  /**
   * Utility method to clear all data (useful for development/testing)
   */
  async clearAllData(): Promise<void> {
    await this.transaction("rw", this.snippets, this.roles, async () => {
      await this.snippets.clear();
      await this.roles.clear();
    });
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    snippetCount: number;
    roleCount: number;
    systemRoleCount: number;
    userRoleCount: number;
  }> {
    const [snippetCount, roleCount, systemRoleCount] = await Promise.all([
      this.snippets.count(),
      this.roles.count(),
      this.roles.where("isSystem").equals(1).count(),
    ]);

    return {
      snippetCount,
      roleCount,
      systemRoleCount,
      userRoleCount: roleCount - systemRoleCount,
    };
  }
}

/**
 * Singleton database instance
 * Use this throughout the application for database operations
 */
export const db = new ContextusDB();

/**
 * Database utility functions for common operations
 */
export const dbUtils = {
  /**
   * Search snippets by content with optional filters
   */
  async searchSnippets(
    query: string,
    options?: {
      platform?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<Snippet[]> {
    let collection = db.snippets.orderBy("createdAt").reverse();

    // Apply platform filter
    if (options?.platform) {
      collection = collection.filter(
        (snippet) => snippet.platform === options.platform,
      );
    }

    // Apply tag filter
    if (options?.tags && options.tags.length > 0) {
      collection = collection.filter((snippet) =>
        Boolean(snippet.tags?.some((tag) => options.tags!.includes(tag))),
      );
    }

    // Apply text search
    if (query.trim()) {
      collection = collection.filter(
        (snippet) =>
          snippet.content.toLowerCase().includes(query.toLowerCase()) ||
          Boolean(snippet.title?.toLowerCase().includes(query.toLowerCase())),
      );
    }

    // Apply pagination
    if (options?.offset) {
      collection = collection.offset(options.offset);
    }

    if (options?.limit) {
      collection = collection.limit(options.limit);
    }

    return await collection.toArray();
  },

  /**
   * Get roles by category with optional system/user filter
   */
  async getRolesByCategory(
    category?: string,
    systemOnly?: boolean,
  ): Promise<Role[]> {
    let collection = db.roles.orderBy("name");

    if (category) {
      collection = collection.filter((role) => role.category === category);
    }

    if (systemOnly !== undefined) {
      collection = collection.filter((role) => role.isSystem === systemOnly);
    }

    return await collection.toArray();
  },

  /**
   * Increment role usage count
   */
  async incrementRoleUsage(roleId: string): Promise<void> {
    await db.roles
      .where("id")
      .equals(roleId)
      .modify((role) => {
        role.usageCount = (role.usageCount || 0) + 1;
      });
  },
};

// Export types for convenience
export type { Snippet, Role } from "../types";
