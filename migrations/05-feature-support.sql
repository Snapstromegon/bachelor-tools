--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feature_support (
  feature_name TEXT NOT NULL,
  browser_version_label TEXT NOT NULL,
  browser_version_browser_id TEXT NOT NULL,
  support TEXT NOT NULL,
  FOREIGN KEY(feature_name) REFERENCES feature(name) ON DELETE CASCADE,
  FOREIGN KEY(browser_version_label, browser_version_browser_id) REFERENCES browser_version(label, browser_id) ON DELETE CASCADE,
  PRIMARY KEY(feature_name, browser_version_label, browser_version_browser_id)
);

CREATE TABLE IF NOT EXISTS feature_support_notes (
  feature_name TEXT NOT NULL,
  browser_version_label TEXT NOT NULL,
  browser_version_browser_id TEXT NOT NULL,
  note TEXT NOT NULL,
  FOREIGN KEY(feature_name, browser_version_label, browser_version_browser_id) REFERENCES feature_support(feature_name, browser_version_label, browser_version_browser_id) ON DELETE CASCADE,
  PRIMARY KEY(feature_name, browser_version_label, browser_version_browser_id, note)
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS feature_support;
