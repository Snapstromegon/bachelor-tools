const SQL = require('sql-template-strings');

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} data
 */
module.exports = async (db, data) => {
  console.log('Injecting features...');
  const features = data.caniuse.data;

  await Promise.all(
    Object.entries(features).map(async ([name, feature]) => {
      await db.run(SQL`INSERT OR REPLACE INTO feature (
        name, title, firefox_id, chrome_id, webkit_id, ie_id, description, spec, status, notes, parent
      ) VALUES (
        ${name}, ${feature.title}, ${feature.firefox_id}, ${feature.chrome_id}, ${feature.webkit_id}, ${feature.ie_id}, ${feature.description}, ${feature.spec}, ${feature.status}, ${feature.notes}, ${feature.parent}
      )`);
      for (const category of feature.categories) {
        await db.run(
          SQL`INSERT OR REPLACE INTO feature_category_mapping (feature_name, category) VALUES (${name}, ${category})`
        );
      }
      for (const keyword of feature.keywords.split(/ |,/)) {
        await db.run(
          SQL`INSERT OR REPLACE INTO feature_keywords (feature_name, keyword) VALUES (${name}, ${keyword})`
        );
      }
      console.log(`Inserting feature ${name} done,`);
    })
  );

  console.log('Done injecting features.');
};
