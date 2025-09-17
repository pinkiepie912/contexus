/**
 * Dexie configuration for the Element-centric data model introduced in Phase 1.
 *
 * The previous Snippet/Role schema is migrated automatically to a unified
 * Element table with optional Builder template snapshots stored separately.
 */

import Dexie, { type EntityTable } from "dexie";
import { v4 as uuidv4 } from "uuid";

import type {
  BuilderTemplate,
  DeleteBuilderTemplatePayload,
  DeleteElementPayload,
  Element,
  ElementType,
  IncrementElementUsagePayload,
  ListElementsPayload,
  NewElementInput,
  SaveBuilderTemplatePayload,
  SearchElementsPayload,
  UpdateBuilderTemplatePayload,
  UpdateElementPayload,
} from "~/types";

/* -------------------------------------------------------------------------- */
/* Legacy interfaces used during database migration                           */
/* -------------------------------------------------------------------------- */

interface LegacySnippet {
  id?: string;
  content: string;
  sourceUrl: string;
  createdAt: Date;
  updatedAt?: Date;
  title?: string;
  tags?: string[];
  platform?: "openai" | "gemini" | "claude" | "other";
  isFavorite?: boolean;
}

interface LegacyRole {
  id?: string;
  name: string;
  description: string;
  promptTemplate: string;
  createdAt: Date;
  updatedAt?: Date;
  isSystem?: boolean;
  category?: string;
  usageCount?: number;
}

/* -------------------------------------------------------------------------- */
/* Database instance                                                          */
/* -------------------------------------------------------------------------- */

export class ContextusDB extends Dexie {
  elements!: EntityTable<Element, "id">;
  builderTemplates!: EntityTable<BuilderTemplate, "id">;

  constructor() {
    super("ContextusDB");

    // Legacy schema kept for automatic migration
    this.version(1).stores({
      snippets: "id, content, sourceUrl, createdAt, platform, *tags",
      roles: "id, name, category, createdAt, isSystem",
    });

    // Phase 1 schema: unified Element table + builder templates
    this.version(2)
      .stores({
        elements:
          "id, type, trigger, title, content, createdAt, updatedAt, usageCount, isFavorite, category, [type+createdAt], [trigger+type], *tags",
        builderTemplates: "id, name, selectedTemplateId, createdAt, updatedAt, usageCount",
      })
      .upgrade(async (transaction) => {
        const legacySnippets = await transaction.table<LegacySnippet>("snippets").toArray();
        const legacyRoles = await transaction.table<LegacyRole>("roles").toArray();

        const migratedElements: Element[] = [];
        const now = new Date();

        for (const snippet of legacySnippets) {
          const element: Element = {
            id: snippet.id ?? uuidv4(),
            type: "context",
            trigger: snippet.tags?.[0] ?? "/snippet",
            title: snippet.title || "Imported snippet",
            content: snippet.content,
            description: snippet.sourceUrl,
            createdAt: snippet.createdAt ?? now,
            updatedAt: snippet.updatedAt ?? now,
            usageCount: 0,
          };

          if (snippet.tags) {
            element.tags = snippet.tags;
          }

          if (typeof snippet.isFavorite === "boolean") {
            element.isFavorite = snippet.isFavorite;
          }

          migratedElements.push(element);
        }

        for (const role of legacyRoles) {
          const element: Element = {
            id: role.id ?? uuidv4(),
            type: "role",
            trigger: `/${role.name.toLowerCase().replace(/\s+/g, "_")}`,
            title: role.name,
            content: role.promptTemplate,
            description: role.description,
            createdAt: role.createdAt ?? now,
            updatedAt: role.updatedAt ?? now,
            usageCount: role.usageCount ?? 0,
            promptTemplate: role.promptTemplate,
          };

          if (role.category) {
            element.category = role.category;
            element.tags = [role.category];
          }

          if (typeof role.isSystem === "boolean") {
            element.isFavorite = role.isSystem;
          }

          migratedElements.push(element);
        }

        if (migratedElements.length) {
          await transaction.table<Element>("elements").bulkAdd(migratedElements, {
            allKeys: true,
          });
        }

        // Clean up legacy tables to reclaim space
        await Promise.all([
          transaction.table("snippets").clear(),
          transaction.table("roles").clear(),
        ]);
      });

    this.elements = this.table("elements");
    this.builderTemplates = this.table("builderTemplates");

    this.elements.hook("creating", function (_primaryKey, raw) {
      const element = raw as Element;
      if (!element.id) {
        element.id = uuidv4();
      }
      const timestamp = new Date();
      element.createdAt = element.createdAt ?? timestamp;
      element.updatedAt = element.updatedAt ?? timestamp;
      element.usageCount = element.usageCount ?? 0;
    });

    this.elements.hook("updating", function (changes) {
      (changes as Partial<Element>).updatedAt = new Date();
    });

    this.builderTemplates.hook("creating", function (_primaryKey, raw) {
      const template = raw as BuilderTemplate;
      if (!template.id) {
        template.id = uuidv4();
      }
      const timestamp = new Date();
      template.createdAt = template.createdAt ?? timestamp;
      template.updatedAt = template.updatedAt ?? timestamp;
      template.usageCount = template.usageCount ?? 0;
    });

    this.builderTemplates.hook("updating", function (changes) {
      (changes as Partial<BuilderTemplate>).updatedAt = new Date();
    });

    this.on("populate", () => this.seedDefaultElements());
  }

  /** Seeds the database with a small set of helpful starter elements. */
  private async seedDefaultElements(): Promise<void> {
    const now = new Date();

    const defaultElements: Element[] = [
      {
        id: uuidv4(),
        type: "template",
        trigger: "/blog",
        title: "블로그 포스트 작성",
        content:
          "주제: {topic}\n\n다음 블로그 포스트를 작성해주세요...",
        description: "블로그 포스트 작성용 템플릿",
        requiredSlots: [
          { id: "context", name: "Context", type: "context", required: true, placeholder: "회사/제품 정보" },
          { id: "examples", name: "Examples", type: "example", required: false, placeholder: "작성 예시" },
          { id: "role", name: "Role", type: "role", required: false, placeholder: "작성자 역할" },
        ],
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      },
      {
        id: uuidv4(),
        type: "context",
        trigger: "/company",
        title: "회사 소개",
        content: "우리 회사는 AI 기반 솔루션을 제공하는...",
        description: "회사 기본 정보",
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      },
      {
        id: uuidv4(),
        type: "example",
        trigger: "/good_writing",
        title: "좋은 글쓰기 예시",
        content: "예시: 명확하고 간결한 문체로...",
        description: "글쓰기 스타일 예시",
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      },
      {
        id: uuidv4(),
        type: "role",
        trigger: "/expert",
        title: "도메인 전문가 역할",
        content: "당신은 도메인 전문가입니다...",
        description: "전문가 역할 템플릿",
        promptTemplate: "You are a subject matter expert...",
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
      },
    ];

    await this.elements.bulkAdd(defaultElements, { allKeys: true });
  }

  /** Utility to wipe all tables. Primarily for local development. */
  async clearAllData(): Promise<void> {
    await this.transaction("rw", this.elements, this.builderTemplates, async () => {
      await Promise.all([this.elements.clear(), this.builderTemplates.clear()]);
    });
  }

  /** Returns high level dataset statistics for diagnostics. */
  async getStats(): Promise<{
    elementCount: number;
    templateCount: number;
    favoriteCount: number;
  }> {
    const [elementCount, templateCount, favoriteCount] = await Promise.all([
      this.elements.count(),
      this.elements.where("type").equals("template").count(),
      this.elements.where("isFavorite").equals(1).count(),
    ]);

    return { elementCount, templateCount, favoriteCount };
  }
}

export const db = new ContextusDB();

/* -------------------------------------------------------------------------- */
/* Query helpers                                                              */
/* -------------------------------------------------------------------------- */

type CachedTemplates = {
  timestamp: number;
  items: Element[];
};

const TEMPLATE_CACHE_TTL_MS = 1000 * 60; // 1 minute cache window
let templateCache: CachedTemplates | null = null;

function invalidateTemplateCache(): void {
  templateCache = null;
}

function coerceElement(input: NewElementInput): Element {
  const createdAt = input.createdAt ?? new Date();
  const updatedAt = input.updatedAt ?? createdAt;

  const element: Element = {
    id: input.id ?? uuidv4(),
    type: input.type,
    trigger: input.trigger,
    title: input.title,
    content: input.content,
    createdAt,
    updatedAt,
    usageCount: input.usageCount ?? 0,
  };

  if (input.description !== undefined) {
    element.description = input.description;
  }

  if (input.tags !== undefined) {
    element.tags = input.tags;
  }

  if (input.isFavorite !== undefined) {
    element.isFavorite = input.isFavorite;
  }

  if (input.requiredSlots !== undefined) {
    element.requiredSlots = input.requiredSlots;
  }

  if (input.category !== undefined) {
    element.category = input.category;
  }

  if (input.promptTemplate !== undefined) {
    element.promptTemplate = input.promptTemplate;
  }

  return element;
}

export const dbUtils = {
  async createElement(payload: NewElementInput): Promise<Element> {
    const element = coerceElement(payload);
    await db.elements.add(element);
    invalidateTemplateCache();
    return element;
  },

  async updateElement({ id, updates }: UpdateElementPayload): Promise<Element | undefined> {
    await db.elements.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
    invalidateTemplateCache();
    return db.elements.get(id);
  },

  async deleteElement({ id }: DeleteElementPayload): Promise<void> {
    await db.elements.delete(id);
    invalidateTemplateCache();
  },

  async getElementById(id: string): Promise<Element | undefined> {
    return db.elements.get(id);
  },

  async listElements(filters: ListElementsPayload = {}): Promise<Element[]> {
    const { type, trigger, limit, offset } = filters;
    let collection = db.elements.toCollection();

    if (type) {
      collection = db.elements.where("type").equals(type);
    }

    if (trigger) {
      collection = collection.filter((element) => element.trigger === trigger);
    }

    if (offset) {
      collection = collection.offset(offset);
    }

    if (limit) {
      collection = collection.limit(limit);
    }

    return collection.toArray();
  },

  async searchElements(filters: SearchElementsPayload = {}): Promise<{
    results: Element[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      query,
      types,
      tags,
      favoritesOnly,
      limit = 50,
      offset = 0,
      orderBy = "updatedAt",
      sortDirection = "desc",
    } = filters;

    let collection = db.elements.toCollection();

    const typeFilters = (types ?? []).filter(
      (value): value is ElementType => Boolean(value),
    );

    if (typeFilters.length === 1) {
      const [elementType] = typeFilters;
      if (elementType !== undefined) {
        collection = db.elements.where("type").equals(elementType);
      }
    } else if (typeFilters.length > 1) {
      collection = db.elements.where("type").anyOf(typeFilters);
    }

    if (favoritesOnly) {
      collection = collection.filter((element) => Boolean(element.isFavorite));
    }

    if (tags && tags.length > 0) {
      collection = collection.filter((element) =>
        Boolean(element.tags?.some((tag) => tags.includes(tag))),
      );
    }

    if (query && query.trim()) {
      const needle = query.trim().toLowerCase();
      collection = collection.filter((element) => {
        const fields = [
          element.title,
          element.content,
          element.description,
          element.trigger,
          element.tags?.join(" "),
        ]
          .filter(Boolean)
          .join("\n")
          .toLowerCase();
        return fields.includes(needle);
      });
    }

    const total = await collection.count();
    const ordered = orderBy
      ? await collection.sortBy(orderBy as keyof Element)
      : await collection.toArray();

    if (sortDirection === "desc") {
      ordered.reverse();
    }

    const results = ordered.slice(offset, offset + limit);
    const hasMore = offset + results.length < total;

    return { results, total, hasMore };
  },

  async getTemplatesWithSlots(): Promise<Element[]> {
    const now = Date.now();
    if (templateCache && now - templateCache.timestamp < TEMPLATE_CACHE_TTL_MS) {
      return templateCache.items;
    }

    const templates = await db.elements
      .where("type")
      .equals("template")
      .filter((element) => Array.isArray(element.requiredSlots) && element.requiredSlots.length > 0)
      .toArray();

    templateCache = { timestamp: now, items: templates };
    return templates;
  },

  async incrementElementUsage({ id, delta = 1 }: IncrementElementUsagePayload): Promise<void> {
    await db.elements.where("id").equals(id).modify((element) => {
      element.usageCount = (element.usageCount ?? 0) + delta;
    });
  },

  async saveBuilderTemplate({ template }: SaveBuilderTemplatePayload): Promise<BuilderTemplate> {
    const payload: BuilderTemplate = {
      id: template.id ?? uuidv4(),
      name: template.name,
      elementIds: template.elementIds ?? [],
      slotAssignments: template.slotAssignments ?? {},
      createdAt: template.createdAt ?? new Date(),
      updatedAt: template.updatedAt ?? new Date(),
      usageCount: template.usageCount ?? 0,
    };

    if (template.description !== undefined) {
      payload.description = template.description;
    }

    if (template.selectedTemplateId !== undefined) {
      payload.selectedTemplateId = template.selectedTemplateId;
    }

    await db.builderTemplates.put(payload);
    return payload;
  },

  async updateBuilderTemplate({ id, updates }: UpdateBuilderTemplatePayload): Promise<BuilderTemplate | undefined> {
    await db.builderTemplates.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
    return db.builderTemplates.get(id);
  },

  async deleteBuilderTemplate({ id }: DeleteBuilderTemplatePayload): Promise<void> {
    await db.builderTemplates.delete(id);
  },

  async listBuilderTemplates(): Promise<BuilderTemplate[]> {
    return db.builderTemplates.orderBy("updatedAt").reverse().toArray();
  },
};

export type { Element, BuilderTemplate };
