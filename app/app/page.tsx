import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-between font-sans">
      <div></div>
      <main>
        <div className="grid gap-y-4">
          <p className="text-center font-semibold text-2xl">cognipedia</p>
          <form action="/search" method="get">
            <div className="flex items-center gap-1 min-w-lg">
              <Input
                name="q"
                placeholder="Search for articles"
                aria-label="Search articles"
              />
              <Button size="icon" type="submit">
                <ArrowUp />
              </Button>
            </div>
          </form>
        </div>
      </main>
      <footer className="mb-8">
        <ul className="flex items-center gap-2">
          <Link href="https://github.com/frolleks/cognipedia">
            <li className="text-muted-foreground hover:underline">
              source code
            </li>
          </Link>
        </ul>
      </footer>
    </div>
  );
}
