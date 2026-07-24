ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS filing_location_lat double precision,
  ADD COLUMN IF NOT EXISTS filing_location_lng double precision,
  ADD COLUMN IF NOT EXISTS filing_location_maps_url text;