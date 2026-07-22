import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listComplaints } from "@/lib/complaints.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Your complaints — ShikayatAI" },
      { name: "description", content: "All the formal complaints you've generated with ShikayatAI." },
      { property: "og:title", content: "Your complaints — ShikayatAI" },
      { property: "og:description", content: "Browse and download your past complaints." },
    ],
  }),
  component: HistoryPage,
});

const URGENCY_VARIANT: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-amber-100 text-amber-900",
  High: "bg-orange-100 text-orange-900",
  Emergency: "bg-red-100 text-red-900",
};

function HistoryPage() {
  const list = useServerFn(listComplaints);
  const { data, isLoading, error } = useQuery({
    queryKey: ["complaints"],
    queryFn: () => list(),
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your complaints</h1>
          <p className="mt-1 text-muted-foreground">Sorted by most recent.</p>
        </div>
        <Link to="/dashboard">
          <Button><PlusCircle className="mr-2 h-4 w-4" />New</Button>
        </Link>
      </div>

      {isLoading && <div className="text-muted-foreground">Loading…</div>}
      {error && <div className="text-destructive">Failed to load complaints.</div>}

      {data && data.length === 0 && (
        <Card className="grid place-items-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">You haven't generated any complaints yet.</p>
          <Link to="/dashboard"><Button>Generate your first complaint</Button></Link>
        </Card>
      )}

      <div className="space-y-3">
        {data?.map((c) => (
          <Link key={c.id} to="/results/$id" params={{ id: c.id }} className="block">
            <Card className="p-4 transition-shadow hover:shadow-[var(--shadow-elegant)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{c.subject}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.department} · {new Date(c.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {c.category && <Badge variant="secondary">{c.category}</Badge>}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${URGENCY_VARIANT[c.urgency] ?? URGENCY_VARIANT.Low}`}>
                    {c.urgency}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}