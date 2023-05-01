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

  const timeRangeSelector = SQL`SELECT strftime('%Y', MIN(release_date), 'unixepoch') as min, strftime('%Y', MAX(release_date), 'unixepoch') as max FROM browser_version WHERE release_date > 0 AND (FALSE`;
  
  for (const browser of browsers) {
    timeRangeSelector.append(SQL` OR browser_id = ${browser.id}`);
  }
  timeRangeSelector.append(SQL`)`);

  const timeRange = await db.get(timeRangeSelector);

  const years = [];
  for (let i = parseInt(timeRange.min); i <= parseInt(timeRange.max); i++) {
    years.push(i.toString());
  }

  const browserDatas = {};

  for (const browser of browsers) {
    const res = await db.all(
      SQL`SELECT strftime('%Y', release_date, 'unixepoch') as year, COUNT(*) as versions FROM browser_version WHERE release_date > 0 AND browser_id = ${browser.id} GROUP BY year ORDER BY year ASC`
    );

    browserDatas[browser.name] = res;
  }

  const data = {
    labels: years,
    datasets: Object.entries(browserDatas).map(
      ([browser, browserYears], i) => ({
        label: browser,
        data: years.map(
          (year) =>
            browserYears.find((dataSet) => dataSet.year == year)?.versions || 0
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
    type: 'bar',
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
