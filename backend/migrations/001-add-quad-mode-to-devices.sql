-- Add quad-mode support to the devices table
-- Run this manually in production if synchronize: false is used.

ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS layout_mode VARCHAR(10) NOT NULL DEFAULT 'single',
    ADD COLUMN IF NOT EXISTS active_quadrants JSONB NOT NULL DEFAULT '[]';

-- Validate allowed values for layout_mode at the DB level (optional but recommended)
ALTER TABLE devices
    DROP CONSTRAINT IF EXISTS devices_layout_mode_check;

ALTER TABLE devices
    ADD CONSTRAINT devices_layout_mode_check
        CHECK (layout_mode IN ('single', 'quad'));
