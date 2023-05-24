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

  const browsersTimeBetweenReleases = {};

  for (const browser of browsers) {
    const releases = await db.all(
      SQL`SELECT release_date, label FROM browser_version WHERE browser_id = ${browser.id} AND release_date > 0 ORDER BY release_date ASC`
    );
    let lastRelease = releases.shift();

    const res = [];
    for (const release of releases) {
      res.push({
        time: release.release_date - lastRelease.release_date,
        release,
      });
      lastRelease = release;
    }

    browsersTimeBetweenReleases[browser.name] = res;
  }

  const datasets = [];
  let maxWeeks = 0;

  Object.entries(browsersTimeBetweenReleases).forEach(
    ([browser, releaseTimes], i) => {
      const dataline = {};
      for (const { time } of releaseTimes) {
        const weeks = Math.round(time / 60 / 60 / 24 / 7);
        if (!dataline[weeks]) {
          dataline[weeks] = 0;
        }
        dataline[weeks]++;
        if (weeks > maxWeeks) {
          maxWeeks = weeks;
        }
      }

      datasets.push({
        label: browser,
        data: Object.entries(dataline).map(([time, count]) => ({
          x: time,
          y: count / releaseTimes.length,
        })),
        borderColor: `hsla(${
          (i / Object.keys(browsersTimeBetweenReleases).length) * 360
        }, 100%, 50%, 0.5)`,
        backgroundColor: `hsla(${
          (i / Object.keys(browsersTimeBetweenReleases).length) * 360
        }, 100%, 50%, 0.5)`,
        borderWidth: 1,
      });
    }
  );

  const data = {
    labels: Array.from({ length: maxWeeks }, (_, i) => i.toString()),
    datasets,
  };

  console.log(data);

  return {
    type: "bar",
    data: data,
    options: {
      scales: {
        y: {
          beginAtZero: true,
          min: 0,
          ticks: {
            callback: (value) => `${(value * 100).toFixed(0)}%`,
          },
        },
        x: {
          min: 0,
          max: 52,
        },
      },
    },
  };
};

module.exports = {
  generateChartConfig,
};
