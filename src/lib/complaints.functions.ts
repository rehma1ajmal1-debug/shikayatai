import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GenerateInput = z.object({
  text: z.string().trim().min(10).max(4000),
  category: z.string().max(50).optional().nullable(),
  language: z.enum(["English", "Urdu"]).default("English"),
});

export const generateComplaint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenerateInput.parse(data))
  .handler(async ({ data, context }) => {
    const { generateComplaintContent, geocodeFilingLocation } = await import(
      "@/lib/complaints.server"
    );
    const { result } = await generateComplaintContent({
      text: data.text,
      category: data.category ?? null,
      language: data.language,
    });

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