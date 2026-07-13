-- The original source tables and operational fields are not consumed by the
-- replay application. Rebuild `shows` to remove them while preserving stable
-- show IDs referenced by report_submission_shows and setlist_items. Those
-- child tables are rebuilt in the same migration so foreign-key enforcement
-- remains enabled throughout.

DROP INDEX IF EXISTS idx_shows_tour_city;

CREATE TABLE shows_simplified (
  id              INTEGER PRIMARY KEY,
  tour_type_id    INTEGER,
  sub_theme       TEXT,
  version_name    TEXT,
  city            TEXT,
  venue           TEXT,
  show_date       TEXT,
  day_label       TEXT,
  guests          TEXT,
  contributor     TEXT,
  playlist_img    TEXT,
  show_start_time TEXT,
  show_end_time   TEXT
);

INSERT INTO shows_simplified (
  id,
  tour_type_id,
  sub_theme,
  version_name,
  city,
  venue,
  show_date,
  day_label,
  guests,
  contributor,
  playlist_img,
  show_start_time,
  show_end_time
)
SELECT
  id,
  tour_type_id,
  sub_theme,
  version_name,
  city,
  venue,
  show_date,
  day_label,
  guests,
  contributor,
  playlist_img,
  show_start_time,
  show_end_time
FROM shows;

CREATE TABLE setlist_items_simplified (
  id          INTEGER PRIMARY KEY,
  show_id     INTEGER NOT NULL REFERENCES shows_simplified(id),
  sort_order  INTEGER,
  section     TEXT,
  item_type   TEXT,
  title       TEXT,
  remark      TEXT,
  speaker     TEXT,
  effect      TEXT,
  created_at  TEXT,
  updated_at  TEXT
);

INSERT INTO setlist_items_simplified (
  id,
  show_id,
  sort_order,
  section,
  item_type,
  title,
  remark,
  speaker,
  effect,
  created_at,
  updated_at
)
SELECT
  id,
  show_id,
  sort_order,
  section,
  item_type,
  title,
  remark,
  speaker,
  effect,
  created_at,
  updated_at
FROM setlist_items;

CREATE TABLE report_submission_shows_simplified (
  submission_id TEXT NOT NULL REFERENCES report_submissions(submission_id) ON DELETE CASCADE,
  show_id INTEGER NOT NULL REFERENCES shows_simplified(id),
  PRIMARY KEY (submission_id, show_id)
);

INSERT INTO report_submission_shows_simplified (submission_id, show_id)
SELECT submission_id, show_id
FROM report_submission_shows;

DROP TABLE report_submission_shows;
DROP TABLE setlist_items;
DROP TABLE shows;
ALTER TABLE shows_simplified RENAME TO shows;
ALTER TABLE setlist_items_simplified RENAME TO setlist_items;
ALTER TABLE report_submission_shows_simplified RENAME TO report_submission_shows;

CREATE INDEX idx_shows_show_date ON shows(show_date);
CREATE INDEX idx_setlist_show ON setlist_items(show_id);
CREATE INDEX idx_report_submission_shows_show_id ON report_submission_shows(show_id);

DROP TABLE tours_cities;
DROP TABLE tours;
DROP TABLE tour_types;
