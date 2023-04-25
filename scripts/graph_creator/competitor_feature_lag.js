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
    allBrowserVersions.push(
      ...versions.filter((v) => v.release_date).map((v) => ({ ...v, browser }))
    );
  }

  console.log(
    `Found ${allBrowserVersions.length} versions in total, sorting by date...`
  );

  const allBrowserVersionsSorted = allBrowserVersions.sort(
    (a, b) => a.release_date - b.release_date
  );

  console.log(`Getting feature support data...`);
  for (const version of allBrowserVersionsSorted) {
    // console.log(`Progress: ${new Date(version.release_date * 1000)}`);
    for (const browser of browsers) {
      const otherBrowsers = browsers.filter((b) => b.id !== browser.id);

      const maxBrowserVersionAtTime = (
        await db.get(SQL`
        SELECT label FROM browser_version
        WHERE browser_version.browser_id = ${browser.id} AND
        browser_version.release_date <= ${version.release_date}
        ORDER BY release_date DESC
      `)
      )?.label;

      const nextBrowserVersion = (
        await db.get(SQL`
        SELECT label FROM browser_version
        WHERE browser_version.browser_id = ${browser.id} AND
        browser_version.release_date >= ${version.release_date}
        ORDER BY release_date ASC
      `)
      )?.label;

      if (maxBrowserVersionAtTime && nextBrowserVersion) {
        const unsupportedHere = await db.all(SQL`
        SELECT * FROM feature_support
        INNER JOIN feature ON feature_support.feature_name = feature.name
        WHERE browser_version_browser_id = ${browser.id} AND
        browser_version_label = ${maxBrowserVersionAtTime} AND
        feature_support.is_supported = FALSE AND
        feature.first_supported <= ${version.release_date}
        `);

        const unsupportedOnlyHere = [];

        for (const feature of unsupportedHere) {
          let supportedEverywhereElse = true;
          let supportedSomewhereElse = false;
          for (const otherBrowser of otherBrowsers) {
            const maxOtherBrowserVersionAtTime = (
              await db.get(SQL`
              SELECT label FROM browser_version
              WHERE browser_version.browser_id = ${otherBrowser.id} AND
              browser_version.release_date <= ${version.release_date}
              ORDER BY release_date DESC
            `)
            )?.label;

            const nextOtherBrowserVersion = (
              await db.get(SQL`
              SELECT label FROM browser_version
              WHERE browser_version.browser_id = ${otherBrowser.id} AND
              browser_version.release_date >= ${version.release_date}
              ORDER BY release_date ASC
            `)
            )?.label;

            if (maxOtherBrowserVersionAtTime && nextOtherBrowserVersion) {
              const supported = (
                await db.get(SQL`
                SELECT * FROM feature_support
                WHERE browser_version_browser_id = ${otherBrowser.id} AND
                browser_version_label = ${maxOtherBrowserVersionAtTime} AND
                feature_support.feature_name = ${feature.name} AND
                feature_support.is_supported = TRUE
              `)
              )?.is_supported;

              if (!supported) {
                supportedEverywhereElse = false;
                break;
              } else {
                supportedSomewhereElse = true;
              }
            }
          }
          if (supportedEverywhereElse && supportedSomewhereElse) {
            unsupportedOnlyHere.push(feature);
          }
        }

        browsersData[browser.name].push({
          x: version.release_date * 1000,
          y: unsupportedOnlyHere.length,
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
      pointRadius: 1,
      borderWidth: 2,
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
          min: allBrowserVersionsSorted.find((v) => v.release_date)
            .release_date * 1000,
          time: {
            unit: "year",
          },
          padding: 20,
        },
      },
    },
  };
};

module.exports = {
  generateChartConfig,
};
