export interface DataToFetch {
  range: string;
  urlsToFetch: string[];
}

export interface ScopedAndNotScopedPackages {
  scopedPackages: string[];
  notScopedPackages: string[];
}

export type UrlList = string[];
export type BulkPackageList = string[][];

export type TransformedMonthData = [string, number][];
export type ProcessedMonthData = { [month: string]: TransformedMonthData };

export type Downloads = { downloads: number; day: string };
export type PackageData = {
  downloads: Downloads[];
  package: string;
  start: string;
  end: string;
};

export type ResponseData = {
  [pkg: string]: PackageData;
};
