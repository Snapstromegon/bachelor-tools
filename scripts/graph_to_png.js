
const sharp = require("sharp");
const {readdir, mkdir} = require("fs/promises");

const main = async () => {

console.log("Convert to PNG");
const files = await readdir("./graphs/svg");
await mkdir("./graphs/png", {recursive: true});
for(const file of files) {
  if(!file.endsWith(".svg")) continue;
  await sharp(`./graphs/svg/${file}`).resize(2000).png().toFile(`./graphs/png/${file.replace(".svg", ".png")}`);
}

console.log("Done");

};
main();
