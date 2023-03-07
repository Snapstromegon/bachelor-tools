const { writeFile, mkdir } = require('fs/promises');
const sources = require('../data_sources.json');

const main = async () => {
  const data = {};
  await mkdir('./data', { recursive: true });
  for (const [name, url] of Object.entries(sources)) {
    console.log(`Downloading ${name}...`);
    const response = await fetch(url);
    data[name] = await response.json();
  }
  console.log(`Writing data...`)
  await writeFile(`./data/raw.json`, JSON.stringify(data, null, 2));
};

main();
