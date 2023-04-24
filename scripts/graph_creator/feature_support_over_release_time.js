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
  const browsers = await db.all(browserSelector);
  console.log(`Found ${browsers.length} browsers`);

  const browsersData = {};
  const allBrowserVersions = [];

  for (const browser of browsers) {
    console.log(`Getting all versions for ${browser.name}...`);
    const versions = await db.all(
      SQL`SELECT DISTINCT label, release_date FROM browser_version WHERE browser_version.browser_id = ${browser.id} AND release_date > 0 ORDER BY release_date ASC`
    );
    browsersData[browser.name] = [];
    allBrowserVersions.push(...versions.map((v) => ({ ...v, browser })));
  }

  console.log(
    `Found ${allBrowserVersions.length} versions in total, sorting by date...`
  );

  const allBrowserVersionsSorted = allBrowserVersions.sort(
    (a, b) => a.release_date - b.release_date
  );

  console.log(`Getting feature support data...`);
  for (const version of allBrowserVersionsSorted) {
    const featureCountAtTime = (
      await db.get(SQL`
    SELECT COUNT(*) AS count FROM feature
    WHERE first_supported <= ${version.release_date}
    `)
    ).count;

    for (const browser of browsers) {
      const maxBrowserVersionAtTime = (
        await db.get(SQL`
        SELECT label FROM browser_version
        WHERE browser_version.browser_id = ${browser.id} AND
        browser_version.release_date <= ${version.release_date}
        ORDER BY release_date DESC
      `)
      )?.label;

      const supportedCountAtTime = (
        await db.get(SQL`
        SELECT COUNT(*) AS count FROM feature_support
        INNER JOIN feature ON feature_support.feature_name = feature.name
        WHERE browser_version_browser_id = ${browser.id} AND
        browser_version_label = ${maxBrowserVersionAtTime} AND
        (
          feature_support.support like '%y%' OR
          feature_support.support like '%a%' OR
          feature_support.support like '%p%' OR
          feature_support.support like '%x%'
        )
      `)
      ).count;

      if (maxBrowserVersionAtTime && supportedCountAtTime == 0) {
        console.log(`${browser.name} ${maxBrowserVersionAtTime} not supported`);
      }

      if (maxBrowserVersionAtTime && supportedCountAtTime > 0) {
        browsersData[browser.name].push({
          x: version.release_date,
          y: supportedCountAtTime / featureCountAtTime,
        });
      }
    }
  }

  console.log("Generating chart config...");

  const browserData = Object.entries(browsersData).map(([name, data]) => ({
    name,
    supportHistory: data,
  }));

  const data = {
    labels: browserData.map((browser) => browser.name),
    datasets: browserData.map((browser, i) => ({
      label: browser.name,
      spanGaps: true,
      stepped: "before",
      data: browser.supportHistory,
      borderColor: `hsla(${(360 / browserData.length) * i}, 100%, 50%, 0.5)`,
    })),
  };
  return {
    type: "line",
    data,
    options: {
      adapters: {
        date: {
          locale: require("date-fns/locale").de,
        },
      },
      scales: {
        x: {
          type: "time",
          min: allBrowserVersionsSorted[0].release_date,
          time: {
            unit: "year",
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
