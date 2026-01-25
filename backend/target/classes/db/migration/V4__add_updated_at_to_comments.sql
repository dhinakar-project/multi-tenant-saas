-- V4: make sure comments.updated_at exists (safe to run even if already applied partially)

ALTER TABLE comments
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Backfill for any existing rows where updated_at is null
UPDATE comments
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

-- Ensure default for new rows
ALTER TABLE comments
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
