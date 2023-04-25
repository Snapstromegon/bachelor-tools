const SQL = require("sql-template-strings");
const { resolveVersionsRange } = require("../utils/browser_versions");

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} data
 */
module.exports = async (db, data) => {
  console.log("Injecting feature support is_supported...");

  await db.run(SQL`UPDATE feature_support SET is_supported = (
  feature_support.support like '%y%' OR
          feature_support.support like '%a%' OR
          feature_support.support like '%p%' OR
          feature_support.support like '%x%'
        )`);

  console.log("Done injecting feature support is_supported.");
};
