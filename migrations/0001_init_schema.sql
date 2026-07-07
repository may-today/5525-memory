-- 0001_init_schema.sql
-- 5525 Memory — initial D1 schema (adapted from raw-data/init_5525.sqlite.sql)
-- Adds FK constraints for the previously soft relations and a few indexes.

PRAGMA foreign_keys = ON;

CREATE TABLE tour_types (
  id INTEGER PRIMARY KEY,
  type_key TEXT,
  type_name TEXT,
  type_color TEXT,
  tag_bg_color TEXT,
  sort_order INTEGER,
  enabled INTEGER
);

CREATE TABLE tours (
  id INTEGER PRIMARY KEY,
  tour_name TEXT UNIQUE,
  theme_color TEXT,
  tour_type_id INTEGER REFERENCES tour_types(id),
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE tours_cities (
  id INTEGER PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id),
  city TEXT,
  venue TEXT,
  year TEXT,
  sub_theme TEXT,
  poster_url TEXT,
  is_hidden INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

-- Excludes is_lighted / talking_styles / is_charity: verified constant
-- ("0"/"NULL"/"0") across all 163 rows in the JSON export, and never part
-- of the source SQLite dump's own shows table either.
CREATE TABLE shows (
  id                          INTEGER PRIMARY KEY,
  tour_type_id                INTEGER REFERENCES tour_types(id),
  tour_name                   TEXT,
  sub_theme                   TEXT,
  version_name                TEXT,
  city                        TEXT,
  venue                       TEXT,
  show_date                   TEXT,
  day_label                   TEXT,
  lineup                      TEXT,
  guests                      TEXT,
  global_effects              TEXT,
  contributor                 TEXT,
  poster_url                  TEXT,
  playlist_img                TEXT,
  theme_color                 TEXT,
  show_start_time             TEXT,
  announced_show_start_time   TEXT,
  show_end_time                TEXT,
  sale_open_at                TEXT,
  sale_open_at_2              TEXT,
  sale_open_at_3               TEXT,
  is_announced                INTEGER DEFAULT 0,
  is_hidden                   INTEGER DEFAULT 0,
  setlist_visible              INTEGER DEFAULT 1,
  tour_city_id                INTEGER REFERENCES tours_cities(id),
  created_at                  TEXT,
  updated_at                  TEXT
);

CREATE TABLE setlist_items (
  id          INTEGER PRIMARY KEY,
  show_id     INTEGER NOT NULL REFERENCES shows(id),
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

CREATE INDEX idx_setlist_show    ON setlist_items(show_id);
CREATE INDEX idx_shows_show_date ON shows(show_date);
CREATE INDEX idx_shows_tour_city ON shows(tour_city_id);
CREATE INDEX idx_tours_cities_tour ON tours_cities(tour_id);
