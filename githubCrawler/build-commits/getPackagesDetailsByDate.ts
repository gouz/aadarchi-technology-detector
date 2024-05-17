import {
  BulkPackageList,
  DataToFetch,
  ProcessedMonthData,
  ResponseData,
  TransformedMonthData,
  UrlList,
} from "./types";
import {
  filterScopedAndNotScopedPackages,
  formatDateRange,
  getCachedDataToFetch,
  getFiles,
  retryFetch,
  saveDataToFetch,
  writeHistory,
} from "./utils";

const USE_CACHE = Bun.env.USE_CACHE === "true";

const packagesByDate = await Bun.file("./data/pkgByDate.json").json();

const buildUrlList = (packages: string[], range: string): UrlList => {
  const bulkPackageList = buildBulkPackageList(packages);

  return bulkPackageList.map(
    (pkgList) =>
      `https://api.npmjs.org/downloads/range/${range}/${pkgList.join(",")}`
  );
};

const buildBulkPackageList = (packages: string[]): BulkPackageList => {
  const bulkPackages = [];
  let packageList = [];

  const filteredNotScopedPackages =
    filterScopedAndNotScopedPackages(packages).notScopedPackages;

  for (const pkg of filteredNotScopedPackages) {
    packageList.push(pkg);

    if (packageList.length === 128) {
      bulkPackages.push(packageList);
      packageList = [];
    }
  }

  if (packageList.length > 0) {
    bulkPackages.push(packageList);
  }

  return bulkPackages;
};

const buildDataToFetch = (
  packagesByDate: Record<string, string[]>
): DataToFetch[] => {
  const dataToFetch = [];

  for (const [date, packages] of Object.entries(packagesByDate)) {
    const pkg = packages as string[];

    const range = formatDateRange(date);
    const urlsToFetch = buildUrlList(pkg, range);

    dataToFetch.push({ range, urlsToFetch });
  }

  saveDataToFetch(dataToFetch);

  return dataToFetch;
};

const transformToMonthData = (data: ResponseData): TransformedMonthData => {
  const monthDataArray: TransformedMonthData = [];

  Object.entries(data).forEach(([pkgName, value]) => {
    const downloads = value.downloads.reduce(
      (acc, curr) => acc + curr.downloads,
      0
    );

    if (downloads > 0) {
      monthDataArray.push([pkgName, downloads]);
    }
  });

  return monthDataArray;
};

const fetchAll = async (urls: string[]): Promise<Response[]> =>
  Promise.all(urls.map((url) => fetch(url)));

const fetchMonthData = async (
  month: DataToFetch
): Promise<TransformedMonthData> => {
  const responses = await fetchAll(month.urlsToFetch);
  const monthData: TransformedMonthData = [];

  for (const response of responses) {
    try {
      const data: ResponseData = await response.json();

      const dataToMerge = transformToMonthData(data);

      monthData.push(...dataToMerge);
    } catch (error) {
      // If the rate limit is exceeded, we throw an error with the retryAfter property
      throw { ...response, retryAfter: response.headers.get("retry-after") };
    }
  }

  return monthData;
};

const processMonth = async (
  range: DataToFetch
): Promise<ProcessedMonthData> => {
  const splittedMonthRange = range.range?.split(":")[0].slice(0, -3);
  const monthData = await fetchMonthData(range);

  //if (USE_CACHE) {
  writeHistory(monthData, splittedMonthRange);
  //}

  return { [splittedMonthRange]: monthData };
};

const fetchData = async (
  dataToFetchArray: DataToFetch[]
): Promise<ProcessedMonthData[]> =>
  Promise.all(dataToFetchArray.map(processMonth));

const getRemainingDataToFetch = async (
  dataToFetch: DataToFetch[]
): Promise<DataToFetch[]> => {
  const historyFiles = await getFiles("./history");

  const fetchedMonths = historyFiles
    .map((file) => file.split("/")[1].split(".")[0])
    .sort();

  return dataToFetch.filter(
    (month) => !fetchedMonths.includes(month.range.split(":")[0].slice(0, -3))
  );
};

const main = async () => {
  const dataToFetchArray = USE_CACHE
    ? buildDataToFetch(packagesByDate)
    : await getCachedDataToFetch();

  const remainingDataToFetch = await getRemainingDataToFetch(dataToFetchArray);

  await retryFetch(() => fetchData(remainingDataToFetch));
};

main();
