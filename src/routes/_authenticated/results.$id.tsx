import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getComplaint } from "@/lib/complaints.functions";
import { downloadComplaintPdf } from "@/lib/complaint-pdf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Building2, AlertTriangle, MapPin, Paperclip, ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

export const Route = createFileRoute("/_authenticated/results/$id")({
  head: () => ({
    meta: [
      { title: "Complaint result — ShikayatAI" },
      { name: "description", content: "Your generated formal complaint with department, urgency, evidence checklist, and filing guidance." },
      { property: "og:title", content: "Complaint result — ShikayatAI" },
      { property: "og:description", content: "Download the formal complaint as a PDF and file it with the right department." },
    ],
  }),
  component: ResultPage,
});

const URGENCY_PILL: Record<string, string> = {
  Low: "bg-green-600",
  Medium: "bg-amber-500",
  High: "bg-orange-500",
  Emergency: "bg-red-600",
};

function evidenceIcon(text: string): string {
  const t = text.toLowerCase();
  if (/\bvideo|footage|recording|cctv\b/.test(t)) return "🎥";
  if (/\bphoto|picture|image|snap\b/.test(t)) return "📷";
  if (/\blocation|address|gps|map|coordinate|landmark\b/.test(t)) return "📍";
  return "📄";
}

function ResultPage() {
  const { id } = Route.useParams();
  const get = useServerFn(getComplaint);
  const { data, isLoading, error } = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => get({ data: { id } }),
  });

  if (isLoading) return <div className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">Loading…</div>;
  if (error || !data) return <div className="mx-auto max-w-3xl px-6 py-10 text-destructive">Complaint not found.</div>;

  const isUrdu = data.language === "Urdu";

  return (
    <>
      <Breadcrumbs items={[{ label: "Complaint Form", to: "/dashboard" }, { label: "Results" }]} />
      <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Back
        </Link>
        <Button onClick={() => downloadComplaintPdf(data)}>
          <Download className="mr-2 h-4 w-4" />Download as PDF
        </Button>
      </div>

      <Card className="overflow-hidden shadow-[var(--shadow-elegant)]">
        <div className="border-b border-border p-6" style={{ background: "var(--gradient-subtle)" }}>
          <div className="text-xs font-medium uppercase tracking-wider text-primary">Subject</div>
          <h1
            className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
            dir={isUrdu ? "rtl" : "ltr"}
          >
            {data.subject}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm ${URGENCY_PILL[data.urgency] ?? URGENCY_PILL.Low}`}>
              <AlertTriangle className="h-3 w-3" />{data.urgency}
            </span>
            {data.category && <Badge variant="secondary">{data.category}</Badge>}
            <Badge variant="outline">{data.language}</Badge>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <Section icon={<Building2 className="h-4 w-4" />} title="Assigned department">
            <p dir={isUrdu ? "rtl" : "ltr"}>{data.department}</p>
          </Section>

          <Section title="Your Original Message vs. Formal Complaint">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-muted/60 p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What you wrote
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                  {data.original_text}
                </p>
              </div>
              <div className="rounded-lg border-l-4 border-primary bg-card p-4 shadow-sm">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  AI-Formatted Complaint
                </div>
                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
                  dir={isUrdu ? "rtl" : "ltr"}
                >
                  {data.formal_complaint}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Formal complaint">
            <div
              className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
              dir={isUrdu ? "rtl" : "ltr"}
            >
              {data.formal_complaint}
            </div>
          </Section>

          <Section icon={<Paperclip className="h-4 w-4" />} title="Evidence to attach">
            <ul className="space-y-2">
              {data.suggested_evidence.map((e: string, i: number) => (
                <li key={i} className="flex items-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <span className="text-base leading-none">{evidenceIcon(e)}</span>
                  <span className="flex-1">{e}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={<MapPin className="h-4 w-4" />} title="Where to file">
            <p className="text-sm" dir={isUrdu ? "rtl" : "ltr"}>{data.filing_location}</p>
          </Section>
        </div>
      </Card>
      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        {icon}{title}
      </div>
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}