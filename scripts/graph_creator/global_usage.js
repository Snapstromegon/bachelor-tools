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

  const browserDatas = {};

  for (const browser of browsers) {
    const res = await db.all(
      SQL`SELECT * FROM browser_version WHERE release_date > 0 AND browser_id = ${browser.id} ORDER BY release_date ASC`
    );

    browserDatas[browser.name] = res;
  }

  const data = {
    labels: ['Global Usage'],
    datasets: Object.entries(browserDatas).map(([browser, versions], i) => ({
      label: browser,
      data: [
        versions
          .map((version) => version.global_usage || 0)
          .reduce((acc, cur) => acc + cur, 0),
      ],
      borderColor: `hsla(${
        (360 / Object.values(browserDatas).length) * i
      }, 100%, 50%, 0.5)`,
      backgroundColor: `hsla(${
        (360 / Object.values(browserDatas).length) * i
      }, 100%, 50%, 0.5)`,
      borderWidth: 1,
    })),
  };

  console.log(data);

  return {
    type: 'bar',
    data: data,
    options: {
      scales: {
        y: {
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
