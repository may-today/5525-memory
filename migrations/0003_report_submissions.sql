-- Anonymous, idempotent report-generation registrations.
-- Personal profile fields intentionally remain client-only and are never stored here.

CREATE TABLE report_submissions (
  id INTEGER PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_submission_shows (
  submission_id TEXT NOT NULL REFERENCES report_submissions(submission_id) ON DELETE CASCADE,
  show_id INTEGER NOT NULL REFERENCES shows(id),
  PRIMARY KEY (submission_id, show_id)
);

CREATE INDEX idx_report_submission_shows_show_id
  ON report_submission_shows(show_id);
