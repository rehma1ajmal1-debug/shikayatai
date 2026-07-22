import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateComplaint } from "@/lib/complaints.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "New complaint — ShikayatAI" },
      { name: "description", content: "Describe a civic issue and generate a formal, ready-to-file complaint." },
      { property: "og:title", content: "New complaint — ShikayatAI" },
      { property: "og:description", content: "Turn a plain description into a professional civic complaint." },
    ],
  }),
  component: DashboardPage,
});

const CATEGORIES = ["Water", "Electricity", "Roads", "Sanitation", "Police", "Other"] as const;

function DashboardPage() {
  const navigate = useNavigate();
  const generate = useServerFn(generateComplaint);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [language, setLanguage] = useState<"English" | "Urdu">("English");

  const mutation = useMutation({
    mutationFn: async () => {
      return await generate({
        data: {
          text: text.trim(),
          category: category || null,
          language,
        },
      });
    },
    onSuccess: (row) => {
      toast.success("Complaint generated");
      navigate({ to: "/results/$id", params: { id: row.id } });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    },
  });

  const canSubmit = text.trim().length >= 10 && !mutation.isPending;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Describe your issue</h1>
        <p className="mt-2 text-muted-foreground">
          Write in plain language — we'll rewrite it as a formal complaint and tell you where to send it.
        </p>
      </div>

      <Card className="p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="issue">What happened?</Label>
            <Textarea
              id="issue"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. There's a large pothole on Main Bazaar Road near the school. Two motorbikes have crashed this week. It hasn't been repaired in months."
              rows={7}
              className="resize-none"
              maxLength={4000}
            />
            <div className="text-right text-xs text-muted-foreground">{text.length}/4000</div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Auto-detect" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <div className="flex rounded-md border border-input p-1">
                {(["English", "Urdu"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      language === lang ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang === "Urdu" ? "اردو" : "English"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full shadow-[var(--shadow-elegant)]"
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" />Generate Complaint</>
            )}
          </Button>
          {text.trim().length > 0 && text.trim().length < 10 && (
            <p className="text-xs text-muted-foreground text-center">Add a little more detail (at least 10 characters).</p>
          )}
        </div>
      </Card>
    </div>
  );
}