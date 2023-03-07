--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS browser_version (
  label TEXT NOT NULL,
  browser_id TEXT NOT NULL,
  engine TEXT,
  release_date INTEGER,
  release_notes_url TEXT,
  status TEXT,
  engine_version TEXT,
  global_usage REAL,
  FOREIGN KEY(browser_id) REFERENCES browser(id) ON DELETE CASCADE,
  PRIMARY KEY(label, browser_id)
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS browser_version;
