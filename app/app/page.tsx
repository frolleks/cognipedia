import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
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
    </div>
  );
}
