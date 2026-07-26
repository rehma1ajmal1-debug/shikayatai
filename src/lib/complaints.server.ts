import { z } from "zod";

export const ResultSchema = z.object({
  subject: z.string(),
  formal_complaint: z.string(),
  department: z.string(),
  urgency: z.enum(["Low", "Medium", "High", "Emergency"]),
  suggested_evidence: z.array(z.string()),
  filing_location: z.string(),
});

export type ComplaintResult = z.infer<typeof ResultSchema>;

export async function geocodeFilingLocation(
  location: string,
): Promise<{ lat: number; lng: number; maps_url: string } | null> {
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

const SYSTEM_PROMPT = `You are an assistant that converts informal civic complaints into professional formal complaints suitable for submission to government departments in Pakistan / South Asia. Return ONLY valid JSON matching this schema:
{
  "subject": "Formal, concise subject line (max 15 words). If the requested language is Urdu, write this in Urdu script (Nasta\u02BFl\u012Bq); otherwise write it in English.",
  "formal_complaint": "Full formal complaint body written in polite, professional tone in the requested language. Include salutation, clear description of the issue, its impact, and a specific request for action. 150-300 words.",
  "department": "Specific responsible department name in English (e.g. 'WASA - Water and Sanitation Agency', 'K-Electric', 'Municipal Corporation Roads Department')",
  "urgency": "One of exactly these English values only: Low, Medium, High, Emergency. Never translate this field. Never add parentheses or extra text.",
  "suggested_evidence": ["List of 3-5 specific pieces of evidence the user should attach, in English (photos, videos, receipts, etc.)"],
  "filing_location": "Where this type of complaint is typically filed, in English. Include portals, hotlines, offices (e.g. 'Pakistan Citizen Portal (pmdu.gov.pk), local Union Council office, or department helpline 1334')."
}
Only the 'subject' and 'formal_complaint' fields should be translated to the requested language (Urdu script when Urdu is requested). All other fields \u2014 department, urgency, suggested_evidence, and filing_location \u2014 must remain in English. The urgency field must always be one of: Low, Medium, High, Emergency exactly.`;

const DEPARTMENTS: Record<string, string> = {
  Water: "WASA - Water and Sanitation Agency",
  Electricity: "Local Electric Supply Company (e.g. K-Electric / LESCO)",
  Roads: "Municipal Corporation - Roads Department",
  Sanitation: "Solid Waste Management Company",
  Police: "District Police Office",
  Other: "Municipal Corporation - General Complaints Cell",
};

/** Deterministic offline fallback so complaint generation never hard-fails. */
export function buildFallbackComplaint(input: {
  text: string;
  category?: string | null;
  language: "English" | "Urdu";
}): ComplaintResult {
  const category = input.category && DEPARTMENTS[input.category] ? input.category : "Other";
  const clean = input.text.trim().replace(/\s+/g, " ");
  const shortIssue = clean.length > 90 ? `${clean.slice(0, 90)}…` : clean;
  const lower = clean.toLowerCase();
  const urgency: ComplaintResult["urgency"] =
    /fire|electrocut|collapse|death|injur|flood|gas leak|accident/.test(lower)
      ? "Emergency"
      : /danger|urgent|weeks|months|child|school|hospital/.test(lower)
        ? "High"
        : "Medium";

  const english = `Respected Sir/Madam,

I am writing to formally bring to your attention a civic issue in my locality that requires prompt attention from the ${DEPARTMENTS[category]}.

Description of the issue: ${clean}

This situation is causing considerable inconvenience and risk to residents of the area, affecting daily movement, health and safety. Despite the ongoing nature of the problem, no corrective action appears to have been taken so far.

I therefore request that the concerned department inspect the site at the earliest opportunity and carry out the necessary repair or enforcement work. I would be grateful if a complaint reference number and an expected timeline for resolution could be shared with me.

Thank you for your time and consideration.

Sincerely,
A concerned citizen`;

  const urdu = `جناب والا،

میں آپ کی توجہ اپنے علاقے کے ایک اہم شہری مسئلے کی طرف مبذول کرانا چاہتا/چاہتی ہوں جس پر فوری کارروائی درکار ہے۔

مسئلے کی تفصیل: ${clean}

اس صورتحال کے باعث علاقہ مکینوں کو شدید مشکلات اور خطرات کا سامنا ہے، جس سے روزمرہ آمد و رفت، صحت اور تحفظ متاثر ہو رہا ہے۔ مسئلہ کافی عرصے سے موجود ہے مگر اب تک کوئی اصلاحی اقدام نظر نہیں آیا۔

لہٰذا استدعا ہے کہ متعلقہ محکمہ فوری طور پر موقع کا معائنہ کرے اور ضروری مرمت یا کارروائی عمل میں لائے۔ براہِ کرم شکایت کا حوالہ نمبر اور حل کی متوقع مدت سے بھی آگاہ کیا جائے۔

شکریہ،
ایک فکرمند شہری`;

  return {
    subject:
      input.language === "Urdu"
        ? `شہری مسئلے سے متعلق شکایت: ${shortIssue}`
        : `Formal complaint regarding civic issue: ${shortIssue}`,
    formal_complaint: input.language === "Urdu" ? urdu : english,
    department: DEPARTMENTS[category],
    urgency,
    suggested_evidence: [
      "Clear photographs of the affected location",
      "A short video showing the extent of the problem",
      "Exact address or landmark details with date and time",
      "Any previous complaint receipts or reference numbers",
    ],
    filing_location:
      "Pakistan Citizen Portal (pmdu.gov.pk) mobile app or website, your local Union Council / Municipal Committee office, or the department helpline (e.g. 1334).",
  };
}

async function requestLovableAI(prompt: string, key: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return ResultSchema.parse(JSON.parse(content));
}

/**
 * Generates a complaint using Lovable AI. If the gateway is unavailable
 * (missing key, 401/429/402, malformed output), a deterministic template
 * is returned instead so the user never sees a hard failure.
 */
export async function generateComplaintContent(input: {
  text: string;
  category?: string | null;
  language: "English" | "Urdu";
}): Promise<{ result: ComplaintResult; usedFallback: boolean }> {
  const key = process.env.LOVABLE_API_KEY;
  const prompt = `Category: ${input.category || "Unspecified"}\nLanguage: ${input.language}\nUser's description:\n${input.text}`;

  if (key) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return { result: await requestLovableAI(prompt, key), usedFallback: false };
      } catch (err) {
        console.error("Lovable AI generation attempt failed:", err);
        if (attempt === 0) await new Promise((r) => setTimeout(r, 600));
      }
    }
  } else {
    console.error("LOVABLE_API_KEY missing — using fallback complaint template");
  }

  return { result: buildFallbackComplaint(input), usedFallback: true };
}
