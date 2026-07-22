ALTER TABLE public.complaints RENAME COLUMN formal_text TO formal_complaint;
ALTER TABLE public.complaints RENAME COLUMN evidence TO suggested_evidence;
ALTER TABLE public.complaints RENAME COLUMN filing_locations TO filing_location;