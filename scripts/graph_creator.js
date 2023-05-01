const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { writeFile, mkdir } = require("fs/promises");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const {
  parse,
  parseISO,
  toDate,
  isValid,
  format,
  startOfSecond,
  startOfMinute,
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  addMilliseconds,
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  differenceInMilliseconds,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInQuarters,
  differenceInYears,
  endOfSecond,
  endOfMinute,
  endOfHour,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  endOfYear,
} = require("date-fns");

const chartOverride = (chartJs) =>
  chartJs._adapters._date.override({
    _id: "iso8601",
    formats: () => ({
      datetime: "MMM d, yyyy, h:mm:ss aaaa",
      millisecond: "h:mm:ss.SSS aaaa",
      second: "h:mm:ss aaaa",
      minute: "h:mm aaaa",
      hour: "ha",
      day: "MMM d",
      week: "PP",
      month: "MMM yyyy",
      quarter: "qqq - yyyy",
      year: "yyyy",
    }),
    parse: function (value, fmt) {
      if (value === null || typeof value === "undefined") {
        return null;
      }
      const type = typeof value;
      if (type === "number" || value instanceof Date) {
        value = toDate(value);
      } else if (type === "string") {
        if (typeof fmt === "string") {
          value = parse(value, fmt, new Date(), this.options);
        } else {
          value = parseISO(value, this.options);
        }
      }
      return isValid(value) ? value.getTime() : null;
    },

    format: function (time, fmt) {
      return format(time, fmt, this.options);
    },

    add: function (time, amount, unit) {
      switch (unit) {
        case "millisecond":
          return addMilliseconds(time, amount);
        case "second":
          return addSeconds(time, amount);
        case "minute":
          return addMinutes(time, amount);
        case "hour":
          return addHours(time, amount);
        case "day":
          return addDays(time, amount);
        case "week":
          return addWeeks(time, amount);
        case "month":
          return addMonths(time, amount);
        case "quarter":
          return addQuarters(time, amount);
        case "year":
          return addYears(time, amount);
        default:
          return time;
      }
    },

    diff: function (max, min, unit) {
      switch (unit) {
        case "millisecond":
          return differenceInMilliseconds(max, min);
        case "second":
          return differenceInSeconds(max, min);
        case "minute":
          return differenceInMinutes(max, min);
        case "hour":
          return differenceInHours(max, min);
        case "day":
          return differenceInDays(max, min);
        case "week":
          return differenceInWeeks(max, min);
        case "month":
          return differenceInMonths(max, min);
        case "quarter":
          return differenceInQuarters(max, min);
        case "year":
          return differenceInYears(max, min);
        default:
          return 0;
      }
    },

    startOf: function (time, unit, weekday) {
      switch (unit) {
        case "second":
          return startOfSecond(time);
        case "minute":
          return startOfMinute(time);
        case "hour":
          return startOfHour(time);
        case "day":
          return startOfDay(time);
        case "week":
          return startOfWeek(time);
        case "isoWeek":
          return startOfWeek(time, { weekStartsOn: +weekday });
        case "month":
          return startOfMonth(time);
        case "quarter":
          return startOfQuarter(time);
        case "year":
          return startOfYear(time);
        default:
          return time;
      }
    },

    endOf: function (time, unit) {
      switch (unit) {
        case "second":
          return endOfSecond(time);
        case "minute":
          return endOfMinute(time);
        case "hour":
          return endOfHour(time);
        case "day":
          return endOfDay(time);
        case "week":
          return endOfWeek(time);
        case "month":
          return endOfMonth(time);
        case "quarter":
          return endOfQuarter(time);
        case "year":
          return endOfYear(time);
        default:
          return time;
      }
    },
  });

const main = async () => {
  const db = await open({
    filename: "./data.db",
    driver: sqlite3.Database,
  });

  await mkdir("./graphs/svg", { recursive: true });

  await writeFile(
    "./graphs/svg/latest_versions_categories.svg",
    new ChartJSNodeCanvas({
      type: "svg",
      width: 600,
      height: 650,
      chartCallback: chartOverride,
    }).renderToBufferSync(
      await require("./graph_creator/latest_version_category_support.js").generateChartConfig(
        db
      )
    )
  );
  await writeFile(
    "./graphs/svg/latest_versions_categories_absolute.svg",
    new ChartJSNodeCanvas({
      type: "svg",
      width: 600,
      height: 650,
      chartCallback: chartOverride,
    }).renderToBufferSync(
      await require("./graph_creator/latest_version_category_support.js").generateChartConfig(
        db,
        { absolute: true }
      )
    )
  );
  await writeFile(
    "./graphs/svg/version_support_history.svg",
    new ChartJSNodeCanvas({
      type: "svg",
      width: 800,
      height: 400,
      chartCallback: chartOverride,
    }).renderToBufferSync(
      await require("./graph_creator/feature_support_over_time.js").generateChartConfig(
        db,
        {
          includeBrowsers: [
            "Chrome",
            "Firefox",
            "Safari",
            "Chrome for Android",
            "Firefox for Android",
            "Safari on iOS",
            "IE",
          ],
        }
      )
    )
  );
  await writeFile(
    "./graphs/svg/release_version_support_history.svg",
    new ChartJSNodeCanvas({
      type: "svg",
      width: 800,
      height: 400,
      chartCallback: chartOverride,
    }).renderToBufferSync(
      await require("./graph_creator/feature_support_over_release_time.js").generateChartConfig(
        db,
        {
          includeBrowsers: [
            "Chrome",
            "Firefox",
            "Safari",
            "Safari on iOS",
            "IE",
          ],
        }
      )
    )
  );
  await writeFile(
    "./graphs/svg/feature_lag.svg",
    new ChartJSNodeCanvas({
      type: "svg",
      width: 800,
      height: 400,
      chartCallback: chartOverride,
    }).renderToBufferSync(
      await require("./graph_creator/competitor_feature_lag.js").generateChartConfig(
        db,
        {
          includeBrowsers: [
            "Chrome",
            "Firefox",
            "Safari",
            // "Safari on iOS", // Remove Safari on iOS here, because it would unfairly benefit Safari Desktop
            "IE",
          ],
        }
      )
    )
  );

  await writeFile(
    "./graphs/svg/feature_lag_current_version.svg",
    new ChartJSNodeCanvas({
      type: "svg",
      width: 600,
      height: 650,
      chartCallback: chartOverride,
    }).renderToBufferSync(
      await require("./graph_creator/competitor_feature_lag_newest_version.js").generateChartConfig(
        db,
        {
          includeBrowsers: ["Chrome", "Firefox", "Safari"],
        }
      )
    )
  );

  await writeFile(
    "./graphs/svg/released_versions_per_year.svg",
    new ChartJSNodeCanvas({
      type: "svg",
      width: 800,
      height: 400,
      chartCallback: chartOverride,
    }).renderToBufferSync(
      await require("./graph_creator/released_versions_per_year.js").generateChartConfig(
        db,
        {
          includeBrowsers: ["Chrome", "Firefox", "Safari"],
        }
      )
    )
  );
  console.log("Done")
};

main();
