-- Run this once in the Neon SQL console (or via psql) to create the feedback table.
-- The table is shared across all projects; rows are separated by project_slug.

CREATE TABLE IF NOT EXISTS fi_feedback (
  id           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  project_slug TEXT        NOT NULL,
  page_url     TEXT        NOT NULL,
  -- Document-relative coordinates (scroll position + click position).
  -- More accurate than viewport-relative when users scroll before commenting,
  -- but the visual position of a pin may drift if the page layout reflows at
  -- a different viewport width between the time of submission and review.
  x            REAL        NOT NULL,
  y            REAL        NOT NULL,
  message      TEXT        NOT NULL,
  name         TEXT,
  email        TEXT,
  session_id   TEXT        NOT NULL,
  user_agent   TEXT,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fi_feedback_pkey PRIMARY KEY (id)
);

-- Index for fetching all feedback for a given project
CREATE INDEX IF NOT EXISTS fi_feedback_project_slug_idx
  ON fi_feedback (project_slug, created_at DESC);

-- Index used by the rate-limit check (session_id + created_at window)
CREATE INDEX IF NOT EXISTS fi_feedback_session_rate_idx
  ON fi_feedback (session_id, created_at);

-- Index for fetching feedback by page URL (for displaying existing pins)
CREATE INDEX IF NOT EXISTS fi_feedback_page_url_idx
  ON fi_feedback (project_slug, page_url, created_at DESC);

-- Reactions table: allows users to react to feedback with emojis or predefined types
CREATE TABLE IF NOT EXISTS fi_feedback_reactions (
  id           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  feedback_id  TEXT        NOT NULL,
  -- Reaction type: emoji (👍, ✅, ❤️) or predefined text (done, agree, important)
  reaction     TEXT        NOT NULL,
  session_id   TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fi_feedback_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT fi_feedback_reactions_feedback_fk FOREIGN KEY (feedback_id)
    REFERENCES fi_feedback (id) ON DELETE CASCADE,
  -- Prevent duplicate reactions from the same session
  CONSTRAINT fi_feedback_reactions_unique UNIQUE (feedback_id, reaction, session_id)
);

-- Index for fetching reactions by feedback ID
CREATE INDEX IF NOT EXISTS fi_feedback_reactions_feedback_idx
  ON fi_feedback_reactions (feedback_id);
