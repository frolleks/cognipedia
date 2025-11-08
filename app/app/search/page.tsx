import Link from "next/link";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchArticles } from "@/lib/api/search-articles";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function SearchResults({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const rawQuery = (await searchParams)?.q;
  const query = typeof rawQuery === "string" ? rawQuery : "";

  const results = query ? await searchArticles(query) : [];

  return (
    <div className="flex min-h-screen justify-center font-sans px-4">
      <div className="flex flex-col gap-4 pt-8 w-full max-w-3xl">
        <div>
          <p className="text-lg font-medium">Search results</p>
          <p className="text-sm text-muted-foreground">
            {query
              ? `Showing matches for “${query}”`
              : "Type to explore articles."}
          </p>
        </div>

        <form action="/search" method="get">
          <div className="flex items-center gap-1">
            <Input
              name="q"
              placeholder="Search for articles"
              aria-label="Search articles"
              defaultValue={query}
            />
            <Button size="icon" type="submit">
              <ArrowUp />
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          {!query && (
            <p className="text-sm text-muted-foreground">
              Enter a topic, person, or keyword to find matching Cognipedia
              entries.
            </p>
          )}

          {query && results.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No articles found for “{query}”. Try a different keyword.
            </p>
          )}

          {results.length > 0 && (
            <ul className="space-y-1">
              {results.map((article) => (
                <li
                  key={article.id}
                  className="rounded-lg border bg-card py-2 px-4 transition hover:border-foreground/40"
                >
                  <Link
                    href={`/page/${article.slug}`}
                    className="space-y-1 block"
                  >
                    <h3 className="text-sm">{article.title}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
