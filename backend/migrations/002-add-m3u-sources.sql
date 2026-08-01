-- Track imported M3U playlist URLs so they can be re-fetched on a schedule
-- Run this manually in production if synchronize: false is used.

CREATE TABLE IF NOT EXISTS m3u_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    auto_refresh BOOLEAN NOT NULL DEFAULT TRUE,
    refresh_interval_minutes INT NOT NULL DEFAULT 1440,
    last_synced_at TIMESTAMPTZ,
    last_status VARCHAR NOT NULL DEFAULT 'pending',
    last_error TEXT,
    last_created_count INT NOT NULL DEFAULT 0,
    last_updated_count INT NOT NULL DEFAULT 0,
    last_channel_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_m3u_sources_user_id ON m3u_sources (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_m3u_sources_user_url ON m3u_sources (user_id, url);

-- Backfill sources from channels already imported from a URL, so previously
-- imported playlists can be put on a schedule without re-importing them.
INSERT INTO m3u_sources (user_id, url, auto_refresh, last_status)
SELECT DISTINCT user_id, source_url, FALSE, 'pending'
FROM channels
WHERE source_url <> 'file-upload'
ON CONFLICT (user_id, url) DO NOTHING;
