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
  console.log(`Found ${browsers.length} browsers`);

  const featureCategories = (
    await db.all(SQL`SELECT DISTINCT name FROM feature_category`)
  ).map((c) => c.name);

  const browsersData = {};

  for (const browser of browsers) {
    browsersData[browser.id] = {
      browser,
      supported: {},
      unsupported: {},
    };
    for (const featureCategory of featureCategories) {
      console.log(`Getting features for ${browser.name}...`);
      const unsupportedFeatures = await db.all(
        SQL`
        SELECT feature_support.feature_name AS feature_name FROM feature_support
        INNER JOIN feature_category_mapping ON feature_support.feature_name = feature_category_mapping.feature_name
        WHERE browser_version_browser_id = ${browser.id} 
        AND browser_version_label = ${browser.current_version}
        AND feature_category_mapping.category = ${featureCategory}
        AND is_supported = FALSE`
      );

      const supportedFeatures = await db.all(
        SQL`
        SELECT feature_support.feature_name AS feature_name FROM feature_support
        INNER JOIN feature_category_mapping ON feature_support.feature_name = feature_category_mapping.feature_name
        WHERE browser_version_browser_id = ${browser.id} 
        AND browser_version_label = ${browser.current_version}
        AND feature_category_mapping.category = ${featureCategory}
        AND is_supported = TRUE`
      );

      browsersData[browser.id].supported[featureCategory] =
        supportedFeatures.map((f) => f.feature_name);
      browsersData[browser.id].unsupported[featureCategory] =
        unsupportedFeatures.map((f) => f.feature_name);
    }
  }

  console.log(`Calculating Data...`);

  const compiledBrowsersData = {};

  for (const [browserId, browserData] of Object.entries(browsersData)) {
    const otherBrowsers = Object.entries(browsersData)
      .filter(([id, _]) => id !== browserId)
      .map(([_, b]) => b);
    const unsupportedData = {
      browser: browserData.browser,
      unsupportedOnlyHere: {},
    };
    for (const featureCategory of featureCategories) {
      const unsupportedOnlyHere = [];
      for (const feature of browserData.unsupported[featureCategory]) {
        let isOnlyHere = true;
        let isSomewhereElse = false;
        for (const otherBrowser of otherBrowsers) {
          if (otherBrowser.supported[featureCategory].includes(feature)) {
            isSomewhereElse = true;
          }
          if (otherBrowser.unsupported[featureCategory].includes(feature)) {
            isOnlyHere = false;
          }
        }
        if (isOnlyHere && isSomewhereElse) {
          unsupportedOnlyHere.push(feature);
        }
      }
      unsupportedData.unsupportedOnlyHere[featureCategory] =
        unsupportedOnlyHere;
    }
    compiledBrowsersData[browserId] = unsupportedData;
  }

  console.log("Generating chart config...", browsersData);

  const averages = {};
  for (const featureCategory of featureCategories) {
    averages[featureCategory] =
      Object.entries(compiledBrowsersData)
        .map(([id, b]) => (b.unsupportedOnlyHere[featureCategory] || []).length)
        .reduce((a, b) => a + b, 0) / Object.keys(compiledBrowsersData).length;
  }

  const browserData = Object.entries(browsersData).map(([name, data]) => ({
    name,
    supportHistory: data,
  }));

  const data = {
    labels: featureCategories,
    datasets: Object.entries(compiledBrowsersData).map(([_, data], i) => ({
      label: `${data.browser.name} ${data.browser.current_version}`,
      data: featureCategories.map(
        (c) => (data.unsupportedOnlyHere[c] || []).length || 0
      ),
      borderColor: `hsla(${(360 / browserData.length) * i}, 100%, 50%, 0.5)`,
      fill: false,
    })),
  };
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
