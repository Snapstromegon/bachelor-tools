const SQL = require("sql-template-strings");
const { resolveVersionsRange } = require("../utils/browser_versions");

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} data
 */
module.exports = async (db, data) => {
  console.log("Injecting feature first support...");

  const features = await db.all(SQL`SELECT name FROM feature`);
  // console.log(features);

  for (const feature of features) {
    const firstSupported = await db.get(
      SQL`SELECT MIN(browser_version.release_date) as first_supported FROM browser_version
        INNER JOIN feature_support ON
          browser_version.browser_id = feature_support.browser_version_browser_id AND
          browser_version.label = feature_support.browser_version_label
        WHERE feature_support.feature_name = ${feature.name} AND
        feature_support.is_supported = TRUE`
    );

    await db.run(SQL`UPDATE feature SET first_supported = ${firstSupported.first_supported} WHERE name = ${feature.name}`)
  }

  console.log("Done injecting feature first support.");
};
