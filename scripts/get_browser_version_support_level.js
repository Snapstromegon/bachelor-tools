const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const SQL = require('sql-template-strings');

const main = async () => {
  const db = await open({ filename: './data.db', driver: sqlite3.Database });
  const res = {};
  for (const level of ['y', 'a', 'n', 'p', 'u', 'x', 'd']) {
    const features = (
      await db.all(`SELECT feature_name FROM feature_support WHERE 
    support LIKE '%${level}%' AND
    browser_version_label = '110' AND browser_version_browser_id = 'chrome'`)
    ).map((f) => f.feature_name);
    const byCats = {};
    for(const feature of features) {
      const cats = (await db.all(SQL`SELECT category FROM feature_category_mapping WHERE feature_name = ${feature}`)).map(c => c.category);
      for(const cat of cats) {
        if(!byCats[cat]) byCats[cat] = [];
        byCats[cat].push(feature);
      }
    }
    res[level] = byCats;
  }

  console.log(res);
};
main();
