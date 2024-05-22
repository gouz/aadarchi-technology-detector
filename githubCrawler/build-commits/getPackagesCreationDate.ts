/**
 * In order to make this script work, you need to edit the Artifact.Package interface in the types.ts file.
 * You need to add a new field named `time` of type `Record<string, string>`.
 * and then add the property `time` to the returned value of the function `formatPackage` in the main.ts file.
 */

import { Artifact } from "../artifact.type";
import { createDatesByMonthSince2015, getCreationDate } from "./utils";

type Data = Record<string, string[]>;

const packagesFromArtifact = await Bun.file(
  "./../outputs/artifact.json"
).json();

const createArtifactFileByDate = () =>
  createDatesByMonthSince2015().reduce((acc, date) => {
    acc[date] = [];
    return acc;
  }, {} as Data);

const main = async () => {
  const data = createArtifactFileByDate();

  for (const [pkgName, pkg] of Object.entries(packagesFromArtifact)) {
    const p = pkg as Artifact.Package;

    if (!pkgName.startsWith("npm:")) continue;

    const date = p.time ? getCreationDate(p.time) : "2015-01-01";

    for (const [d] of Object.entries(data)) {
      if (date <= d) {
        data[d].push(p.name);
      }
    }
  }

  await Bun.write("./data/pkgByDate.json", JSON.stringify(data));
};

main();
