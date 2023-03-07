const SQL = require('sql-template-strings');
const {
  mdnToCanIUseId,
  getCombinedVersions,
} = require('../utils/browser_versions');

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} data
 */
module.exports = async (db, data) => {
  console.log('Injecting browser versions...');
  const browsers = data.caniuse.agents;
  for (const [id, browser] of Object.entries(browsers)) {
    console.log(`Inserting browser versions for ${id} (${browser.browser})`);
    const mdnBrowser = data.mdn_browser_compat.browsers[mdnToCanIUseId(id)];
    const combinedVersions = getCombinedVersions(browser, mdnBrowser);
    // console.log(id, combinedVersions);
    await Promise.all(
      combinedVersions.map(async (version) => {
        await db.run(SQL`INSERT OR REPLACE INTO browser_version (
          label, browser_id, engine, release_date, release_notes_url, engine_version, status, global_usage
        ) VALUES (
          ${version.label}, ${id}, ${version.engine}, ${version.release_date}, ${version.release_notes}, ${version.engine_version}, ${version.status}, ${version.global_usage}
        )`);
      })
    );
  }
  console.log('Done injecting browser versions.');
};
