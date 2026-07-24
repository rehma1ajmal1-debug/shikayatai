import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
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
import { Loader2, Wand2, Mic, Square } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Breadcrumbs } from "@/components/site/breadcrumbs";

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

const QUICK_CHIPS: { label: string; category: (typeof CATEGORIES)[number] }[] = [
  { label: "Broken Road", category: "Roads" },
  { label: "Water Leak", category: "Water" },
  { label: "Electricity Fault", category: "Electricity" },
  { label: "Garbage", category: "Sanitation" },
  { label: "Noise", category: "Other" },
  { label: "Illegal Parking", category: "Police" },
];

function DashboardPage() {
  const navigate = useNavigate();
  const generate = useServerFn(generateComplaint);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [language, setLanguage] = useState<"English" | "Urdu">("English");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.lang = language === "Urdu" ? "ur-PK" : "en-US";
      rec.interimResults = true;
      rec.continuous = true;
      baseTextRef.current = text.length && !text.endsWith(" ") ? text + " " : text;

      rec.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) finalChunk += res[0].transcript;
          else interimChunk += res[0].transcript;
        }
        if (finalChunk) {
          baseTextRef.current = (baseTextRef.current + finalChunk).replace(/\s+/g, " ").trimStart();
          if (!baseTextRef.current.endsWith(" ")) baseTextRef.current += " ";
          setText(baseTextRef.current);
          setInterim("");
        } else {
          setInterim(interimChunk);
        }
      };
      rec.onerror = (e: any) => {
        setListening(false);
        setInterim("");
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          toast.error("Microphone permission denied");
        } else if (e.error === "no-speech") {
          toast.error("No speech detected — try again");
        } else if (e.error !== "aborted") {
          toast.error("Voice input error");
        }
      };
      rec.onend = () => {
        setListening(false);
        setInterim("");
      };

      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      toast.error("Could not start voice input");
      setListening(false);
    }
  };

  useEffect(() => () => { try { recognitionRef.current?.abort(); } catch { /* noop */ } }, []);

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
    <>
      <Breadcrumbs items={[{ label: "Complaint Form" }]} />
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
            <div className="flex items-center justify-between">
              <Label htmlFor="issue">What happened?</Label>
              {speechSupported ? (
                <Button
                  type="button"
                  size="sm"
                  variant={listening ? "destructive" : "outline"}
                  onClick={listening ? stopListening : startListening}
                  className={listening ? "animate-pulse" : ""}
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                >
                  {listening ? (
                    <><Square className="mr-1.5 h-3.5 w-3.5 fill-current" />Stop</>
                  ) : (
                    <><Mic className="mr-1.5 h-3.5 w-3.5" />Speak</>
                  )}
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground cursor-help underline decoration-dotted">
                        Voice input?
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Voice input not supported in this browser — try Chrome or Edge.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="relative">
              <Textarea
                id="issue"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. There's a large pothole on Main Bazaar Road near the school. Two motorbikes have crashed this week. It hasn't been repaired in months."
                rows={7}
                className="resize-none"
                maxLength={4000}
              />
              {listening && interim && (
                <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-md bg-background/80 px-2 py-1 text-sm italic text-muted-foreground/70 backdrop-blur-sm">
                  {interim}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{listening ? "Listening…" : ""}</span>
              <span>{text.length}/4000</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quick pick</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_CHIPS.map((chip) => {
                const active = category === chip.category;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setCategory(chip.category)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
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
              <div className="inline-flex w-full items-center rounded-full bg-[oklch(0.22_0.09_255)] p-1">
                {(["English", "Urdu"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                      language === lang
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-transparent text-white/70 hover:text-white"
                    }`}
                  >
                    {lang === "Urdu" ? "اردو" : "EN"}
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
    </>
  );
}