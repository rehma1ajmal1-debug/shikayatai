import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GenerateInput = z.object({
  text: z.string().trim().min(10).max(4000),
  category: z.string().max(50).optional().nullable(),
  language: z.enum(["English", "Urdu"]).default("English"),
});

const ResultSchema = z.object({
  subject: z.string(),
  formal_complaint: z.string(),
  department: z.string(),
  urgency: z.enum(["Low", "Medium", "High", "Emergency"]),
  suggested_evidence: z.array(z.string()),
  filing_location: z.string(),
});

async function geocodeFilingLocation(location: string): Promise<
  { lat: number; lng: number; maps_url: string } | null
> {
  try {
    const q = encodeURIComponent(`${location}, Pakistan`);
    const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ShikayatAI/1.0", Accept: "application/json" },
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const lat = Number(arr[0].lat);
    const lng = Number(arr[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      lat,
      lng,
      maps_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    };
  } catch {
    return null;
  }
}

async function callLovableAI(prompt: string, language: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const system = `You are an assistant that converts informal civic complaints into professional formal complaints suitable for submission to government departments in Pakistan / South Asia. Return ONLY valid JSON matching this schema:
{
  "subject": "Formal, concise subject line (max 15 words). If the requested language is Urdu, write this in Urdu script (Nastaʿlīq); otherwise write it in English.",
  "formal_complaint": "Full formal complaint body written in polite, professional tone in the requested language. Include salutation, clear description of the issue, its impact, and a specific request for action. 150-300 words.",
  "department": "Specific responsible department name in English (e.g. 'WASA - Water and Sanitation Agency', 'K-Electric', 'Municipal Corporation Roads Department')",
  "urgency": "One of exactly these English values only: Low, Medium, High, Emergency. Never translate this field. Never add parentheses or extra text.",
  "suggested_evidence": ["List of 3-5 specific pieces of evidence the user should attach, in English (photos, videos, receipts, etc.)"],
  "filing_location": "Where this type of complaint is typically filed, in English. Include portals, hotlines, offices (e.g. 'Pakistan Citizen Portal (pmdu.gov.pk), local Union Council office, or department helpline 1334')."
}
Only the 'subject' and 'formal_complaint' fields should be translated to the requested language (Urdu script when Urdu is requested). All other fields — department, urgency, suggested_evidence, and filing_location — must remain in English. The urgency field must always be one of: Low, Medium, High, Emergency exactly.`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in Lovable.");
    throw new Error(`AI request failed: ${res.status}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  const parsed = JSON.parse(content);
  return ResultSchema.parse(parsed);
}

export const generateComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenerateInput.parse(data))
  .handler(async ({ data, context }) => {
    const userPrompt = `Category: ${data.category || "Unspecified"}\nLanguage: ${data.language}\nUser's description:\n${data.text}`;
    const result = await callLovableAI(userPrompt, data.language);

    const geo = await geocodeFilingLocation(result.filing_location);

    const { data: row, error } = await context.supabase
      .from("complaints")
      .insert({
        user_id: context.userId,
        original_text: data.text,
        category: data.category ?? null,
        language: data.language,
        subject: result.subject,
        formal_complaint: result.formal_complaint,
        department: result.department,
        urgency: result.urgency,
        suggested_evidence: result.suggested_evidence,
        filing_location: result.filing_location,
        filing_location_lat: geo?.lat ?? null,
        filing_location_lng: geo?.lng ?? null,
        filing_location_maps_url: geo?.maps_url ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const listComplaints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("complaints")
      .select("id, subject, category, urgency, department, created_at, language")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getComplaint = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("complaints")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Complaint not found");
    return row;
  });

export const deleteComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("complaints").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });