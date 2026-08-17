import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const target = resolve("server/data/indonesia-regions.json");
const sourcePath = process.argv[2];
const sourceUrl = "https://raw.githubusercontent.com/cahyadsn/wilayah/master/db/wilayah.sql";
let sql;
if (sourcePath) {
  sql = readFileSync(resolve(sourcePath, "db/wilayah.sql"), "utf8");
} else {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Region source download failed (${response.status}).`);
  sql = await response.text();
}
const entries = [...sql.matchAll(/\('([0-9.]+)','((?:''|[^'])*)'\)/g)].map(([, dottedCode, escapedName]) => ({
  code: dottedCode.replaceAll(".", ""),
  name: escapedName.replaceAll("''", "'"),
  parts: dottedCode.split("."),
}));

function children(level, parentParts) {
  return Object.groupBy(entries.filter(item => item.parts.length === level), item => item.parts.slice(0, parentParts).join(""));
}

function simplify(groups) {
  return Object.fromEntries(Object.entries(groups).map(([parent, values]) => [
    parent,
    values.map(({ code, name }) => ({ code, name })),
  ]));
}

const data = {
  source: "cahyadsn/wilayah — Kepmendagri 300.2.2-2138 Tahun 2025",
  provinces: entries.filter(item => item.parts.length === 1).map(({ code, name }) => ({ code, name })),
  citiesByProvince: simplify(children(2, 1)),
  districtsByCity: simplify(children(3, 2)),
  villagesByDistrict: simplify(children(4, 3)),
};

writeFileSync(target, JSON.stringify(data));
console.log(`Generated ${target} with ${data.provinces.length} provinces and ${entries.filter(item => item.parts.length === 4).length} villages.`);
