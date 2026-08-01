import { readFile, writeFile } from "node:fs/promises";

const version = process.argv[2];
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

if (!version || !semverPattern.test(version)) {
  console.error("Usage: npm run version:set -- <major.minor.patch[-prerelease]>");
  process.exit(1);
}

async function updateJson(path, update) {
  const json = JSON.parse(await readFile(path, "utf8"));
  update(json);
  await writeFile(path, `${JSON.stringify(json, null, 2)}\n`);
}

await updateJson("package.json", (json) => {
  json.version = version;
});

await updateJson("package-lock.json", (json) => {
  json.version = version;
  if (json.packages?.[""]) {
    json.packages[""].version = version;
  }
});

await updateJson("src-tauri/tauri.conf.json", (json) => {
  json.version = version;
});

const cargoPath = "src-tauri/Cargo.toml";
const cargoToml = await readFile(cargoPath, "utf8");
const packageVersionPattern = /(\[package\][\s\S]*?\nversion\s*=\s*")[^"]+("\s*\n)/;

if (!packageVersionPattern.test(cargoToml)) {
  throw new Error(`Could not locate [package] version in ${cargoPath}`);
}

await writeFile(cargoPath, cargoToml.replace(packageVersionPattern, `$1${version}$2`));

const cargoLockPath = "src-tauri/Cargo.lock";
const cargoLock = await readFile(cargoLockPath, "utf8");
const localPackagePattern = /(\[\[package\]\]\nname = "timeline-timer"\nversion = ")[^"]+("\n)/;

if (!localPackagePattern.test(cargoLock)) {
  throw new Error(`Could not locate the Timeline Timer package in ${cargoLockPath}`);
}

await writeFile(cargoLockPath, cargoLock.replace(localPackagePattern, `$1${version}$2`));
console.log(`Timeline Timer version set to ${version}.`);
