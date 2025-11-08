"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Link from "next/link";

export type TocHeading = {
  slug: string;
  text: string;
  level: number;
};

type TableOfContentsProps = {
  headings: TocHeading[];
};

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(
    headings[0]?.slug ?? null
  );

  const ids = useMemo(
    () => headings.map((heading) => heading.slug),
    [headings]
  );

  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveSlug(visible[0].target.id);
          return;
        }

        const closest = [...entries].sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top) -
            Math.abs(b.boundingClientRect.top)
        )[0];

        if (closest) {
          setActiveSlug(closest.target.id);
        }
      },
      {
        rootMargin: "0px 0px -65% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings, ids]);

  return (
    <aside className="sticky top-12 hidden h-fit w-64 shrink-0 border-r pr-4 lg:block">
      <Link href="/">
        <p className="text-3xl font-semibold mb-3">cognipedia</p>
      </Link>

      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Contents
      </p>
      <nav className="mt-4 space-y-2 text-sm">
        {headings.length === 0 && (
          <p className="text-muted-foreground">No sections available.</p>
        )}
        {headings.map((heading) => (
          <a
            key={heading.slug}
            href={`#${heading.slug}`}
            className={clsx(
              "block transition",
              activeSlug === heading.slug
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{ marginLeft: `${(heading.level - 1) * 8}px` }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </aside>
  );
}
