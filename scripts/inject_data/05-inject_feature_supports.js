const SQL = require('sql-template-strings');
const { resolveVersionsRange } = require('../utils/browser_versions');

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} data
 */
module.exports = async (db, data) => {
  console.log('Injecting feature support...');
  const features = data.caniuse.data;

  for (const [name, feature] of Object.entries(features)) {
    console.log(`Inserting feature support for ${name}`);

    for (const [browser, supportData] of Object.entries(feature.stats)) {
      for (const [version, support] of Object.entries(supportData)) {
        const supportParts = support.split(' ');
        const supportChars = supportParts.filter((p) => !p.startsWith('#'));
        // const versions = resolveVersionsRange(browser, version, data);
        // for (const version of versions) {
          await db.run(SQL`INSERT OR REPLACE INTO feature_support (
            feature_name, browser_version_label, browser_version_browser_id, support
          ) VALUES (
            ${name}, ${version}, ${browser}, ${supportChars.sort().join('')}
          )`);
        // }
        const supportNotesTexts = supportParts.filter((p) => p.startsWith('#'));
        const supportNotesNumberTexts = supportNotesTexts.map((p) =>
          p.slice(1)
        );
        const supportNotesNumbers = supportNotesNumberTexts.map((n) =>
          parseInt(n, 10)
        );
        const supportNotes = supportNotesNumbers.map(
          (n) => feature.notes_by_num[n]
        ).filter((n) => n);
        for (const note of supportNotes) {
          if (!note) debugger;
          await db.run(SQL`INSERT OR REPLACE INTO feature_support_notes (
            feature_name, browser_version_label, browser_version_browser_id, note
          ) VALUES (
            ${name}, ${version}, ${browser}, ${note}
          )`);
        }
      }
    }
  }

  console.log('Done injecting feature support.');
};
