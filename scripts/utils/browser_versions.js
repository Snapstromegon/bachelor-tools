const semver = require('semver');

const getCombinedVersions = (caniuseBrowser, mdnBrowser) => {
  if (!mdnBrowser)
    return caniuseBrowser.version_list.map((version) => ({
      label: version.version,
      release_date: version.release_date,
      global_usage: version.global_usage,
    }));
  const combinedVersions = [];
  for (const version of caniuseBrowser.version_list) {
    if (version.version in mdnBrowser.releases) {
      const mdnVersion = mdnBrowser.releases[version.version];
      combinedVersions.push({
        label: version.version,
        engine: mdnVersion?.engine,
        release_date: version.release_date,
        release_notes_url: mdnVersion?.release_notes,
        engine_version: mdnVersion?.engine_version,
        status: mdnVersion?.status,
        global_usage: version.global_usage,
      });
    } else {
      const parts = version.version.split('-');
      if (parts.length != 2) {
        combinedVersions.push({
          label: version.version,
          release_date: version.release_date,
          global_usage: version.global_usage,
        });
      } else {
        const range = `${parts[0]} - ${parts[1]}`;
        const mdnVersions = Object.keys(mdnBrowser.releases);
        const matchingVersions = mdnVersions.filter((v) =>
          semver.satisfies(semver.coerce(v), range)
        );
        const resultVersions = matchingVersions.map((v) => {
          const mdnVersion = mdnBrowser.releases[v];
          return {
            label: v,
            engine: mdnVersion?.engine,
            release_date: version.release_date,
            release_notes_url: mdnVersion?.release_notes,
            engine_version: mdnVersion?.engine_version,
            status: mdnVersion?.status,
            global_usage: version.global_usage / matchingVersions.length,
          };
        });
        // console.log('Matching versions:', matchingVersions, resultVersions);
        combinedVersions.push(...resultVersions);
      }
    }
  }
  return combinedVersions;
};

const resolveVersionsRange = (browser_id, range, data) => {
  const mdnBrowser =
    data.mdn_browser_compat.browsers[canIUseToMdnId(browser_id)];
  const parts = range.split('-');
  if (parts.length != 2) {
    return [range];
  } else {
    const range = `${parts[0]} - ${parts[1]}`;
    const mdnVersions = Object.keys(mdnBrowser.releases);
    const matchingVersions = mdnVersions.filter((v) =>
      semver.satisfies(semver.coerce(v), range)
    );
    return matchingVersions;
  }
};

const mdnToCanIUseId = (id) => {
  return (
    {
      chrome_android: 'and_chr',
      firefox_android: 'and_ff',
      opera_android: 'op_mini',
      safari_ios: 'ios_saf',
      samsunginternet_android: 'samsung',
      webview_android: 'android',
    }[id] || id
  );
};

const canIUseToMdnId = (id) => {
  return (
    {
      and_chr: 'chrome_android',
      and_ff: 'firefox_android',
      op_mini: 'opera_android',
      ios_saf: 'safari_ios',
      samsung: 'samsunginternet_android',
      android: 'webview_android',
    }[id] || id
  );
};

module.exports = {
  getCombinedVersions,
  mdnToCanIUseId,
  resolveVersionsRange,
};
