const chartJs = require("chart.js");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { writeFile } = require("fs/promises");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const SQL = require("sql-template-strings");

const main = async () => {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    type: "svg",
    width: 800,
    height: 600,
  });

  const db = await open({ filename: "./data copy.db", driver: sqlite3.Database });

  const supports = await db.all(SQL`SELECT DISTINCT support FROM feature_support`);

  console.log(supports);

  const categories = (
    await db.all(SQL`SELECT name FROM feature_category ORDER BY name ASC`)
  ).map((cat) => cat.name);
  console.log(categories);

  const browserData = [];

  const browsers = await db.all(
    SQL`SELECT name, id, current_version FROM browser WHERE name IN ('Chrome', 'Firefox', 'Safari')`
  );
  for (const browser of browsers) {
    browser.support = {};
    for (const feature_category of categories) {
      const featureCount = await db.get(SQL`
        SELECT COUNT(*) AS count FROM feature_category_mapping
        WHERE category = ${feature_category}
      `);
      const allFeatures = await db.all(SQL`
      SELECT feature_support.feature_name
      FROM feature_support
      INNER JOIN browser_version
          ON browser_version.browser_id = feature_support.browser_version_browser_id
          AND browser_version.label = feature_support.browser_version_label
      INNER JOIN feature_support as first_fs
          ON first_fs.feature_name = feature_support.feature_name
          AND first_fs.support LIKE '%y%'
      INNER JOIN browser_version as first_bv
          ON first_bv.browser_id = first_fs.browser_version_browser_id
          AND first_bv.label = first_fs.browser_version_label
      WHERE browser_version.release_date < first_bv.release_date
      AND browser_version.browser_id = ${browser.id}
      AND browser_version.label = ${browser.current_version}
      GROUP BY feature_support.feature_name
      `);
      const supportedCount = await db.get(SQL`
        SELECT COUNT(*) AS count FROM feature_support
        INNER JOIN feature_category_mapping ON feature_support.feature_name = feature_category_mapping.feature_name
        WHERE browser_version_browser_id = ${browser.id} AND
          browser_version_label = ${browser.current_version} AND
          feature_category_mapping.category = ${feature_category} AND
          (
            feature_support.support like '%y%' OR
            feature_support.support like '%a%' OR
            feature_support.support like '%p%' OR
            feature_support.support like '%x%'
          )
      `);
      browser.support[feature_category] =
        supportedCount.count / featureCount.count;
    }
    browser.support.CSS += browser.support.CSS2;
    browser.support.CSS += browser.support.CSS3;
    browser.support.CSS /= 3;
    browserData.push(browser);
  }

  const data = {
    labels: categories,
    datasets: browserData.map((browser, i) => ({
      label: `${browser.name} ${browser.current_version}`,
      data: categories.map((cat) => browser.support[cat]),
      fill: false,
      borderColor: `hsla(${(360 / browserData.length) * i}, 100%, 50%, 0.5)`,
    })),
  };

  const config = {
    type: "radar",
    data: data,
    options: {
      elements: {
        line: {
          borderWidth: 3,
        },
      },
    },
  };

  const image = chartJSNodeCanvas.renderToBufferSync(config);
  writeFile("./test.svg", image);
};

main();
