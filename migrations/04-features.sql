--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feature (
  name TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  firefox_id TEXT,
  chrome_id TEXT,
  webkit_id TEXT,
  ie_id TEXT,
  spec TEXT,
  description TEXT,
  status TEXT,
  parent TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS feature_category_mapping (
  feature_name TEXT,
  category TEXT,
  FOREIGN KEY(category) REFERENCES feature_category(name) ON DELETE CASCADE,
  FOREIGN KEY(feature_name) REFERENCES feature(name) ON DELETE CASCADE,
  PRIMARY KEY(feature_name, category)
);

CREATE TABLE IF NOT EXISTS feature_keywords (
  feature_name TEXT,
  keyword TEXT,
  FOREIGN KEY(feature_name) REFERENCES feature(name) ON DELETE CASCADE,
  PRIMARY KEY(feature_name, keyword)
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE IF EXISTS feature;
DROP TABLE IF EXISTS feature_category_mapping;
DROP TABLE IF EXISTS feature_keywords;
