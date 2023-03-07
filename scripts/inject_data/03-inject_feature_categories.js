const SQL = require('sql-template-strings');

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} data
 */
module.exports = async (db, data) => {
  console.log('Injecting feature categories...');
  const categories = data.caniuse.cats;

  for (const name in categories) {
    console.log(`Inserting category ${name}`);
    await db.run(
      SQL`INSERT OR REPLACE INTO feature_category (name) VALUES (${name})`
    );
  }

  console.log('Injecting parents...');
  for (const [name, children] of Object.entries(categories)) {
    for (const child of children.filter((c) => c !== name)) {
      await db.run(
        SQL`INSERT OR REPLACE INTO feature_category (name, parent) VALUES (${child}, ${name})`
      );
    }
  }

  console.log('Done injecting feature categories.');
};
