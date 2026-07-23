import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <div className="mx-auto max-w-5xl px-6 pt-4">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground shadow-[var(--shadow-card)]"
      >
        <Link to="/" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            {item.to ? (
              <Link to={item.to as never} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}