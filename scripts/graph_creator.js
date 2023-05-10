const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { writeFile, mkdir } = require('fs/promises');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const { chartOverride } = require('./utils/chart_override.js');

const db = open({
  filename: './data.db',
  driver: sqlite3.Database,
});

const renderGraph = async ({ width, height, output, renderer, options }) => {
  await writeFile(
    output,
    new ChartJSNodeCanvas({
      type: 'svg',
      width,
      height,
      chartCallback: chartOverride,
    }).renderToBufferSync(
      await require(renderer).generateChartConfig(await db, options)
    )
  );
};

const main = async () => {

  await mkdir('./graphs/svg', { recursive: true });

  await renderGraph({
    width: 800,
    height: 400,
    output: './graphs/svg/global_usage.svg',
    renderer: './graph_creator/global_usage.js',
    options: {
      includeBrowsers: [
        'Chrome',
        'Firefox',
        'Safari',
        'Chrome for Android',
        'Firefox for Android',
        'Safari on iOS',
        'IE',
      ],
    },
  });

  await renderGraph({
    width: 600,
    height: 650,
    output: './graphs/svg/latest_versions_categories.svg',
    renderer: './graph_creator/latest_version_category_support.js',
  });
  
  await renderGraph({
    width: 600,
    height: 650,
    output: './graphs/svg/latest_versions_categories_absolute.svg',
    renderer: './graph_creator/latest_version_category_support.js',
    options: {
      absolute: true,
    },
  });
  await renderGraph({
    width: 800,
    height: 400,
    output: './graphs/svg/version_support_history.svg',
    renderer: './graph_creator/feature_support_over_time.js',
    options: {
      includeBrowsers: [
        'Chrome',
        'Firefox',
        'Safari',
        'Chrome for Android',
        'Firefox for Android',
        'Safari on iOS',
        'IE',
      ],
    },
  });
  await renderGraph({
    width: 800,
    height: 400,
    output: './graphs/svg/version_support_history_absolute.svg',
    renderer: './graph_creator/feature_support_over_time.js',
    options: {
      includeBrowsers: [
        'Chrome',
        'Firefox',
        'Safari',
        'Safari on iOS',
        'IE',
      ],
    },
  });
  await renderGraph({
    width: 800,
    height: 400,
    output: "./graphs/svg/feature_lag.svg",
    renderer: "./graph_creator/competitor_feature_lag.js",
    options: {
      includeBrowsers: [
        "Chrome",
        "Firefox",
        "Safari",
        // "Safari on iOS", // Remove Safari on iOS here, because it would unfairly benefit Safari Desktop
        "IE",
      ],
    },
  });

  await renderGraph({
    width: 600,
    height: 650,
    output: "./graphs/svg/feature_lag_current_version.svg",
    renderer: "./graph_creator/competitor_feature_lag_newest_version.js",
    options: {
      includeBrowsers: [
        "Chrome",
        "Firefox",
        "Safari",
      ],
    },
  });

  await renderGraph({
    width: 800,
    height: 400,
    output: "./graphs/svg/released_versions_per_year.svg",
    renderer: "./graph_creator/released_versions_per_year.js",
    options: {
      includeBrowsers: [
        "Chrome",
        "Firefox",
        "Safari",
      ],
    },
  });
  console.log('Done');
};

main();
