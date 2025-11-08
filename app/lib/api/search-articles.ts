"use server";

import { desc, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";

const MAX_RESULTS = 25;

export async function searchArticles(query: string) {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  const searchTerm = `%${normalized}%`;

  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(
      or(
        ilike(articles.title, searchTerm),
        ilike(articles.summary, searchTerm),
        ilike(articles.topic, searchTerm)
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(MAX_RESULTS);

  return rows;
}
