const SQL = require('sql-template-strings');

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} param1
 */
const generateChartConfig = async (
  db,
  { includeBrowsers = ['Chrome', 'Firefox', 'Safari'] } = {}
) => {
  const browserSelector = SQL`SELECT name, id, current_version FROM browser WHERE FALSE`;
  for (const browserName of includeBrowsers) {
    browserSelector.append(SQL` OR name = ${browserName}`);
  }
  const browsers = await db.all(browserSelector);
  console.log(`Found ${browsers.length} browsers`);
  const browserData = [];
  for (const browser of browsers) {
    browser.supportHistory = [];
    console.log(`Processing ${browser.name}`);
    const versions = await db.all(
      SQL`SELECT DISTINCT label, release_date FROM browser_version WHERE browser_version.browser_id = ${browser.id} ORDER BY release_date ASC`
    );
    for (const version of versions) {
      const featureCount = await db.get(SQL`
        SELECT COUNT(*) AS count FROM feature_support
        WHERE browser_version_browser_id = ${browser.id} AND
        browser_version_label = ${version.label}
      `);
      const supportedCount = await db.get(SQL`
        SELECT COUNT(*) AS count FROM feature_support
        WHERE browser_version_browser_id = ${browser.id} AND
        browser_version_label = ${version.label} AND
        feature_support.is_supported = TRUE
      `);
      browser.support = supportedCount.count / featureCount.count;
      browser.supportHistory.push({
        version: version.label,
        support: browser.support,
        releaseDate: version.release_date * 1000,
      });
    }
    browserData.push(browser);
  }

  console.log('Generating chart config...');
  let minRelease = Infinity;

  const data = {
    labels: browserData.map((browser) => browser.name),
    datasets: browserData.map((browser, i) => ({
      label: browser.name,
      spanGaps: true,
      stepped: "before",
      data: browser.supportHistory
        .filter((version) => {
          if (version.releaseDate > 0 && version.releaseDate < minRelease) {
            minRelease = version.releaseDate;
            console.log("min Release", minRelease);
          }
          return version.releaseDate > 0;
        })
        .map((version) => ({
          x: version.releaseDate,
          y: version.support,
        })),
      borderColor: `hsla(${(360 / browserData.length) * i}, 100%, 50%, 0.5)`,
      pointRadius: 1,
      borderWidth: 2,
    })),
  };
  return {
    type: 'line',
    data,
    options: {
      adapters: {
        date: {
          locale: require('date-fns/locale').de,
        },
      },
      scales: {
        x: {
          type: 'time',
          min: minRelease,
          time: {
            unit: 'year',
          },
          padding: 20,
        },
        y: {
          min: 0,
          max: 1,
          ticks: {
            callback: (value) => `${(value * 100).toFixed(0)}%`,
          },
        },
      },
    },
  };
};

module.exports = {
  generateChartConfig,
};
