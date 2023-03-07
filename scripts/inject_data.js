const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { rm } = require('fs/promises');

const main = async () => {
  await rm('./data.db', { force: true, recursive: true });

  const db = await open({ filename: './data.db', driver: sqlite3.Database });
  await db.migrate();
  const data = require('../data/raw.json');
  await require('./inject_data/01-inject_browsers.js')(db, data);
  await require('./inject_data/02-inject_browser_versions.js')(db, data);
  await require('./inject_data/03-inject_feature_categories.js')(db, data);
  await require('./inject_data/04-inject_features.js')(db, data);
  await require('./inject_data/05-inject_feature_supports.js')(db, data);
};
main();
