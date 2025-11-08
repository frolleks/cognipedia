import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const articleStatusEnum = pgEnum("article_status", [
  "draft",
  "review",
  "published",
  "archived",
]);

export type SourceAttribution = {
  label: string;
  url: string;
  publisher?: string;
  accessedAt?: string;
};

export const articles = pgTable(
  "articles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: varchar("slug", { length: 200 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    content: text("content").notNull(),
    heroImageUrl: text("hero_image_url"),
    topic: varchar("topic", { length: 160 }),
    status: articleStatusEnum().default("draft"),
    sourceAttribution: jsonb("source_attribution").$type<SourceAttribution[]>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("articles_slug_idx").on(table.slug),
    index("articles_status_idx").on(table.status),
    index("articles_published_at_idx").on(table.publishedAt),
  ]
);
