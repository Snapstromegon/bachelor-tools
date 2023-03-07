const sources = require('../data_sources.json');

const main = async () => {
  const source = 'caniuse';
  const caniuse = require(`../data/${source}.json`);
  const mdn = require(`../data/mdn_browser_compat.json`);
  const chromestat = require(`../data/chromestatus.json`);

  const featureTree = {};
  const featuresByName = new Map();
  const missingParents = new Map();

  for (const [name, rawFeature] of Object.entries(caniuse.data)) {
    const feature = {
      raw: rawFeature,
      name,
      children: missingParents.get(name) || [],
    };
    missingParents.delete(name);
    featuresByName.set(name, feature);

    if (rawFeature.parent) {
      console.log(name, 'Parent: ' + rawFeature.parent);
      const parent = featuresByName.get(rawFeature.parent);
      if (parent) {
        parent.children.push(feature);
      } else {
        if (!missingParents.has(rawFeature.parent)) {
          missingParents.set(rawFeature.parent, []);
        }
        missingParents.get(rawFeature.parent).push(feature);
      }
    } else {
      featureTree[name] = feature;
    }
  }

  console.log(Object.keys(featureTree), Object.keys(mdn), Object.keys(chromestat));
};

main();
