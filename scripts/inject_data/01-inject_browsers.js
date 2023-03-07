const SQL = require('sql-template-strings');

/**
 * 
 * @param {import('sqlite').Database} db 
 * @param {*} data 
 */
module.exports = async (db, data) => {
  console.log('Injecting browsers...');
  const browsers = data.caniuse.agents;
  for(const [id, browser] of Object.entries(browsers)) {
    console.log(`Inserting browser ${id} (${browser.browser})`);
    await db.run(SQL`INSERT OR REPLACE INTO browser (
        id, name, long_name, current_version, type
      ) VALUES (
        ${id}, ${browser.browser}, ${browser.long_name}, ${browser.current_version}, ${browser.type}
      )`);
  }
  console.log('Done injecting browsers.');
};
