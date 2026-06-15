-- Migration V2: Add pin color and device tracking
-- Run this in Neon SQL console to add new columns to existing fi_feedback table

-- Add pin color column (defaults to blue)
ALTER TABLE fi_feedback 
ADD COLUMN IF NOT EXISTS pin_color TEXT DEFAULT '#3b82f6';

-- Add viewport width for responsive positioning
ALTER TABLE fi_feedback 
ADD COLUMN IF NOT EXISTS viewport_width INTEGER;

-- Add device type for filtering
ALTER TABLE fi_feedback 
ADD COLUMN IF NOT EXISTS device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop'));

-- Add index for filtering by device type
CREATE INDEX IF NOT EXISTS fi_feedback_device_type_idx
  ON fi_feedback (project_slug, page_url, device_type);

-- Note: Existing feedback rows will have:
-- - pin_color = '#3b82f6' (blue, default)
-- - viewport_width = NULL
-- - device_type = NULL
-- The app will handle these NULL values gracefully
