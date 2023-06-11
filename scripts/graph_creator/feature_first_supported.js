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
      const year = new Date(firstSupportingVersion.release_date * 1000).getUTCFullYear();
      if (!browserDatas[browserName]) {
        browserDatas[browserName] = {};
      }
      if (!(year in browserDatas[browserName])) {
        browserDatas[browserName][year] = 0;
      }
      browserDatas[browserName][year]++;
    }
  }

  // console.log(browserDatas);

  const years = [];
  const minYear = Math.min(...Object.values(browserDatas).map(browser => Math.min(...Object.keys(browser).map(year => parseInt(year)))));
  const maxYear = Math.max(...Object.values(browserDatas).map(browser => Math.max(...Object.keys(browser).map(year => parseInt(year)))));
  for (let i = minYear; i <= maxYear; i++) {
    years.push(i);
  }

  const data = {
    labels: years,
    datasets: Object.entries(browserDatas).sort((a,b) => a[0].localeCompare(b[0])).map(
      ([browser, browserYears], i) => ({
        label: browser,
        data: years.map(
          (year) =>
            browserYears[year] || 0
        ),
        borderColor: years.map(
          (year) =>
            `hsla(${
              (360 / Object.values(browserDatas).length) * i
            }, 100%, 50%, 0.5)`
        ),
        backgroundColor: years.map(
          (year) =>
            `hsla(${
              (360 / Object.values(browserDatas).length) * i
            }, 100%, 50%, 0.5)`
        ),
        borderWidth: 1,
      })
    ),
  };

  console.log(data);

  return {
    type: "bar",
    data: data,
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };
};

module.exports = {
  generateChartConfig,
};
