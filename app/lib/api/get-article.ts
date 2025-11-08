"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";

export type ArticleRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  topic: string | null;
  publishedAt: Date | null;
  metadata: Record<string, unknown> | null;
};

export async function getArticle(slug: string): Promise<ArticleRecord | null> {
  const article = await db.query.articles.findFirst({
    columns: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      content: true,
      topic: true,
      publishedAt: true,
      metadata: true,
    },
    where: eq(articles.slug, slug),
  });

  return article ?? null;
}
