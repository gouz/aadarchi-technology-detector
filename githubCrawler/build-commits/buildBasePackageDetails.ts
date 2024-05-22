import { Artifact } from "../artifact.type";

const file = await Bun.file("../outputs/artifact.json").json();

const data = file as Record<string, Artifact.Package>;

const resetAllDownloads = (
  packagesObject: Record<string, Artifact.Package>
) => {
  for (const [_, p] of Object.entries(packagesObject)) {
    p.downloads = 0;
  }
};

resetAllDownloads(data);

//const newData = JSON.stringify(data);

//console.log('Start writing to file "pre-artifact.json"');

//await Bun.write("./pre-artifact.json", newData);

//console.log("Done.");

const createArrayFromDateToDate = (from: string, to: string) => {
  const array = [];
  const fromDate = new Date(from);
  const toDate = new Date(to);
  for (
    let date = fromDate;
    date <= toDate;
    date.setMonth(date.getMonth() + 1)
  ) {
    array.push(
      `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`
    );
  }
  return array;
};

const dateList = createArrayFromDateToDate("2015-01", "2024-04");

const found: string[] = [];

let npmPackages = 0;

const checkfoundPackagesDetails = async () => {
  pkgs: for (const [fullPackageName] of Object.entries(data)) {
    if (!fullPackageName.startsWith("npm:")) {
      continue pkgs;
    }

    npmPackages++;

    const pkgName = fullPackageName.split(":")[1];

    dates: for (const date of dateList) {
      const filePath = `./history/${date}.json`;
      if (!(await Bun.file(filePath).exists())) {
        continue dates;
      }

      const dateFile = await Bun.file(`./history/${date}.json`).json();

      for (const dateFileData of dateFile) {
        if (dateFileData[0] === pkgName) {
          if (!found.includes(pkgName)) {
            found.push(pkgName);
          }
          continue pkgs;
        }
      }
    }
  }
};

await checkfoundPackagesDetails();

console.log(`Here are the packages that have been found: ${found}`);
console.log(`Total found: ${found.length}`);
console.log(`Total not found: ${npmPackages - found.length}`);
console.log(`Total npm packages: ${npmPackages}`);
