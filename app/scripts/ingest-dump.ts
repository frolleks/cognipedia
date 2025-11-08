import "dotenv/config";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { db } from "../lib/db";
import { articles } from "../lib/db/schema";

type ParsedArticle = {
  slug: string;
  title: string;
  summary?: string;
  content: string;
  topic?: string;
  publishedAt: Date;
  metadata: Record<string, unknown>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dumpDir = path.resolve(__dirname, "../../article-creator-agent/dump");

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .replace(/-{2,}/g, "-");
}

function stripCitations(text: string) {
  return text.replace(/\[\d+\]/g, "").trim();
}

function extractSummary(content: string) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim());
  const firstParagraph = blocks.find(
    (block) => block && !block.startsWith("#")
  );
  if (!firstParagraph) return undefined;
  const cleaned = stripCitations(firstParagraph);
  return cleaned.length > 480 ? `${cleaned.slice(0, 477)}...` : cleaned;
}

function parseArticle(filename: string, rawContent: string): ParsedArticle | null {
  const normalized = rawContent.replace(/\r\n/g, "\n").trim();
  const headingMatch = normalized.match(/^#\s+(.+)$/m);
  if (!headingMatch || headingMatch.index === undefined) {
    console.warn(`⚠️  Skipping ${filename}: unable to find a title heading.`);
    return null;
  }

  const title = headingMatch[1].trim();
  const trimmedContent = normalized.slice(headingMatch.index).trim();
  const afterHeading = trimmedContent.split("\n").slice(1).join("\n").trim();
  const summary = extractSummary(afterHeading);

  const fileBase = filename.replace(/\.md$/, "");
  const timestampMatch = fileBase.match(/-(\d{9,})$/);
  const slugBase = timestampMatch
    ? fileBase.slice(0, fileBase.length - timestampMatch[0].length)
    : fileBase;
  const slug = slugify(slugBase) || slugify(title);
  const publishedAt =
    timestampMatch && !Number.isNaN(Number(timestampMatch[1]))
      ? new Date(Number(timestampMatch[1]))
      : new Date();

  return {
    slug,
    title,
    summary,
    content: trimmedContent,
    topic: title,
    publishedAt,
    metadata: {
      dumpFile: filename,
      ingestedAt: new Date().toISOString(),
    },
  };
}

async function ingest() {
  const entries = await readdir(dumpDir);
  const markdownFiles = entries.filter((entry) => entry.endsWith(".md"));

  if (markdownFiles.length === 0) {
    console.log("No dump files found to ingest.");
    return;
  }

  let processed = 0;
  for (const file of markdownFiles) {
    const filePath = path.join(dumpDir, file);
    const raw = await readFile(filePath, "utf-8");
    const parsed = parseArticle(file, raw);
    if (!parsed) continue;

    await db
      .insert(articles)
      .values({
        slug: parsed.slug,
        title: parsed.title,
        summary: parsed.summary,
        content: parsed.content,
        topic: parsed.topic,
        publishedAt: parsed.publishedAt,
        metadata: parsed.metadata,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: articles.slug,
        set: {
          title: parsed.title,
          summary: parsed.summary,
          content: parsed.content,
          topic: parsed.topic,
          publishedAt: parsed.publishedAt,
          metadata: parsed.metadata,
          updatedAt: new Date(),
        },
      });

    processed += 1;
    console.log(`✅ Ingested ${parsed.title} (${parsed.slug})`);
  }

  console.log(`\nFinished ingesting ${processed} article(s).`);
}

ingest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Ingest failed:", error);
    process.exit(1);
  });
