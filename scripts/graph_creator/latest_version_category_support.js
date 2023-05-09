const SQL = require('sql-template-strings');

/**
 *
 * @param {import('sqlite').Database} db
 * @param {*} param1
 */
const generateChartConfig = async (
  db,
  { includeBrowsers = ['Chrome', 'Firefox', 'Safari'], absolute = false } = {}
) => {
  const categories = (
    await db.all(SQL`SELECT name FROM feature_category ORDER BY name ASC`)
  ).map((cat) => cat.name);
  console.log(`Found ${categories.length} categories`);
  const browserSelector = SQL`SELECT name, id, current_version FROM browser WHERE FALSE`;
  for (const browserName of includeBrowsers) {
    browserSelector.append(SQL` OR name = ${browserName}`);
  }
  const browsers = await db.all(browserSelector);
  console.log(`Found ${browsers.length} browsers`);
  const browserData = [];
  for (const browser of browsers) {
    browser.support = {};
    console.log(`Processing ${browser.name}`);
    for (const feature_category of categories) {
      const featureCount = await db.get(SQL`
        SELECT COUNT(*) AS count FROM feature_category_mapping
        WHERE category = ${feature_category}
      `);
      const supportedCount = await db.get(SQL`
        SELECT COUNT(*) AS count FROM feature_support
        INNER JOIN feature_category_mapping ON feature_support.feature_name = feature_category_mapping.feature_name
        WHERE browser_version_browser_id = ${browser.id} AND
          browser_version_label = ${browser.current_version} AND
          feature_category_mapping.category = ${feature_category} AND
        feature_support.is_supported = TRUE
      `);
      if (absolute) {
        browser.support[feature_category] = supportedCount.count;
      } else {
        browser.support[feature_category] =
          supportedCount.count / featureCount.count;
      }
    }
    browserData.push(browser);
  }

  console.log('Generating chart config...');

  const data = {
    labels: categories,
    datasets: browserData.map((browser, i) => ({
      label: `${browser.name} ${browser.current_version}`,
      data: categories.map((cat) => browser.support[cat]),
      fill: false,
      borderColor: `hsla(${(360 / browserData.length) * i}, 100%, 50%, 0.5)`,
    })),
  };

  return {
    type: 'radar',
    data: data,
    options: {
      elements: {
        line: {
          borderWidth: 3,
        },
      },
      scales: {
        r: absolute
          ? undefined
          : {
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
