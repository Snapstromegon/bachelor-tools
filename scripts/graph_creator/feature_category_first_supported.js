const SQL = require("sql-template-strings");

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} param1
 */
const generateChartConfig = async (
  db,
  { includeBrowsers = ["Chrome", "Firefox", "Safari"] } = {}
) => {
  const browserSelector = SQL`SELECT name, id, current_version FROM browser WHERE FALSE`;
  for (const browserName of includeBrowsers) {
    browserSelector.append(SQL` OR name = ${browserName}`);
  }

  browserSelector.append(SQL` ORDER BY name`);

  const browsers = await db.all(browserSelector);

  console.log("Get all features");
  const features = await db.all(
    SQL`SELECT name, first_supported, strftime('%Y', first_supported, 'unixepoch') as year FROM feature`
  );

  console.log(features);

  const browserDatas = {};

  for (const feature of features) {
    const featCats = (await db.all(SQL`
      SELECT DISTINCT * FROM feature_category_mapping WHERE feature_name = ${feature.name}
    `)).map((featCat) => featCat.category);
    const firstSupportingVersions = {};
    for (const browser of browsers) {
      const firstSupportingVersion = await db.get(SQL`
        SELECT * FROM browser_version
          JOIN feature_support ON
            feature_support.browser_version_label = browser_version.label AND
            feature_support.browser_version_browser_id = browser_version.browser_id
        WHERE browser_version.release_date > 0 AND feature_support.is_supported = TRUE AND browser_version.browser_id = ${browser.id} AND feature_support.feature_name = ${feature.name}
        ORDER BY release_date ASC
        LIMIT 1
      `);
      if (
        firstSupportingVersion &&
        firstSupportingVersion.release_date <
          feature.first_supported + 60 * 60 * 24 * 7
      ) {
        firstSupportingVersions[browser.name] = firstSupportingVersion;
      }
    }

    for (const [browserName, firstSupportingVersion] of Object.entries(
      firstSupportingVersions
    )) {
      if (!browserDatas[browserName]) {
        browserDatas[browserName] = {};
      }
      for (const featCat of featCats) {
        if (!(featCat in browserDatas[browserName])) {
          browserDatas[browserName][featCat] = 0;
        }
        browserDatas[browserName][featCat]++;
      }
    }
  }

  // console.log(browserDatas);

  const cats = (await db.all(SQL`SELECT DISTINCT name FROM feature_category`))
    .map((cat) => cat.name)
    .sort();

  const data = {
    labels: cats,
    datasets: Object.entries(browserDatas)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([browser, browserData], i) => ({
        label: browser,
        data: cats.map((cat) => browserData[cat] || 0),
        borderColor: cats.map(
          () =>
            `hsla(${
              (360 / Object.values(browserDatas).length) * i
            }, 100%, 50%, 0.5)`
        ),
        backgroundColor: cats.map(
          () =>
            `hsla(${
              (360 / Object.values(browserDatas).length) * i
            }, 100%, 50%, 0.5)`
        ),
        fill: false,
      })),
  };

  console.log(data);

  return {
    type: "radar",
    data,
    options: {
      elements: {
        line: {
          borderWidth: 3,
        },
      },
    },
  };
};

module.exports = {
  generateChartConfig,
};
