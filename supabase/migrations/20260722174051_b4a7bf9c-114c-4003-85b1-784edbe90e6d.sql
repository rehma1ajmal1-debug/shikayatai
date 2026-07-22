
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  category TEXT,
  language TEXT NOT NULL DEFAULT 'English',
  subject TEXT NOT NULL,
  formal_text TEXT NOT NULL,
  department TEXT NOT NULL,
  urgency TEXT NOT NULL,
  evidence TEXT[] NOT NULL DEFAULT '{}',
  filing_locations TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own complaints"
  ON public.complaints FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX complaints_user_created_idx ON public.complaints(user_id, created_at DESC);
