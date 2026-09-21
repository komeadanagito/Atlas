CREATE TABLE IF NOT EXISTS timeline_items (
  id TEXT PRIMARY KEY,
  start_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  tag TEXT NOT NULL DEFAULT 'plan'
);

CREATE INDEX IF NOT EXISTS idx_timeline_start ON timeline_items (start_at);