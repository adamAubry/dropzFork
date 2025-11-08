-- ============================================
-- USER WORKSPACES & EDITING MODE MIGRATION
-- ============================================
-- This migration adds:
-- 1. User-planet relationship (one user = one workspace)
-- 2. Editing sessions table (track editing mode)
-- 3. Node backups table (store backups during editing)
-- 4. User profile fields (email, avatar, bio)
-- ============================================

-- Add user profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add user_id to planets table (owner of workspace)
ALTER TABLE planets ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Create index for user workspace lookups
CREATE INDEX IF NOT EXISTS planets_user_id_idx ON planets(user_id);

-- ============================================
-- EDITING SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS editing_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planet_id INTEGER NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes for editing sessions
CREATE INDEX IF NOT EXISTS editing_sessions_user_id_idx ON editing_sessions(user_id);
CREATE INDEX IF NOT EXISTS editing_sessions_planet_id_idx ON editing_sessions(planet_id);
CREATE INDEX IF NOT EXISTS editing_sessions_is_active_idx ON editing_sessions(is_active);

-- ============================================
-- NODE BACKUPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS node_backups (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES editing_sessions(id) ON DELETE CASCADE,
  node_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL,
  snapshot JSONB NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('create', 'update', 'delete')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for node backups
CREATE INDEX IF NOT EXISTS node_backups_session_id_idx ON node_backups(session_id);
CREATE INDEX IF NOT EXISTS node_backups_node_id_idx ON node_backups(node_id);
CREATE INDEX IF NOT EXISTS node_backups_backup_type_idx ON node_backups(backup_type);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE editing_sessions IS 'Tracks when users enter editing mode for backup/apply/discard lifecycle';
COMMENT ON TABLE node_backups IS 'Stores snapshots of nodes before editing for restore on discard';
COMMENT ON COLUMN planets.user_id IS 'Owner of this workspace - each user has one planet';
COMMENT ON COLUMN editing_sessions.is_active IS 'True when editing mode is active, false when ended';
COMMENT ON COLUMN node_backups.backup_type IS 'Type of change: create (new node), update (modified), delete (removed)';
COMMENT ON COLUMN node_backups.snapshot IS 'Complete snapshot of node data at backup time';

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- After running this migration:
-- 1. Existing planets will have user_id = NULL (can be assigned later)
-- 2. When a user first logs in, create their workspace planet
-- 3. Editing sessions are created when user activates editing mode
-- 4. Node backups are created automatically before any modification
-- 5. On "apply changes", mark editing session as inactive
-- 6. On "discard changes", restore from backups and delete session

-- Example workflow:
-- 1. User clicks "Edit Mode" → INSERT INTO editing_sessions
-- 2. User modifies node → INSERT INTO node_backups (snapshot before change)
-- 3. User clicks "Apply" → UPDATE editing_sessions SET is_active = false, ended_at = NOW()
-- 4. User clicks "Discard" → Restore from backups, DELETE editing session
