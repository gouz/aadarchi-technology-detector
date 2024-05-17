import { format } from "date-fns";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  DataToFetch,
  ProcessedMonthData,
  ScopedAndNotScopedPackages,
  TransformedMonthData,
} from "./types";

const DEFAULT_RETRY_INTERVAL = 31 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 5;
const BASE_DATE = "2015-01-01";

const DATA_TO_FETCH_PATH = "./data/dataToFetch.json";

export const getCreationDate = (time: Record<string, string>): string => {
  const d = new Date(time.created);

  return format(new Date(d.getFullYear(), d.getMonth(), 1), "yyyy-MM-dd");
};

export const createDatesByMonthSince2015 = () => {
  const dates = [];
  let date = new Date(BASE_DATE);

  while (date < new Date()) {
    dates.push(format(date, "yyyy-MM-dd"));
    date.setMonth(date.getMonth() + 1);
  }

  return dates;
};

export const formatDateRange = (date: string): string => {
  const d = new Date(date);
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);

  return `${format(firstDay, "yyyy-MM-dd")}:${format(lastDay, "yyyy-MM-dd")}`;
};

export const getCachedDataToFetch = async (): Promise<DataToFetch[]> => {
  return Bun.file(DATA_TO_FETCH_PATH).json();
};

export const saveDataToFetch = async (data: DataToFetch[]): Promise<void> => {
  await Bun.write(DATA_TO_FETCH_PATH, JSON.stringify(data));
};

export const writeHistory = async (
  data: TransformedMonthData,
  date: string
): Promise<void> => {
  await Bun.write(`./history/${date}.json`, JSON.stringify(data));
};

export const getFiles = async (directoryPath: string): Promise<string[]> => {
  try {
    const fileNames = await readdir(directoryPath);
    const filePaths = fileNames.map((fn) => join(directoryPath, fn));

    return filePaths || [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const retryFetch = async (
  fn: () => Promise<ProcessedMonthData[]>
): Promise<ProcessedMonthData[] | undefined> => {
  let retries = 0;
  let result;

  while (retries < MAX_RETRY_ATTEMPTS) {
    try {
      result = await fn();
      break;
    } catch (error: any) {
      const retryAfter = error.retryAfter
        ? parseInt(error.retryAfter) * 1000
        : DEFAULT_RETRY_INTERVAL;

      console.error(
        `Error fetching data. Retrying in ${retryAfter / 60000} minutes...`
      );

      for (let i = retryAfter / 60000; i > 0; i--) {
        console.info(`Retrying in ${i} minute(s)...`);
        await new Promise((resolve) => setTimeout(resolve, 60000));
      }

      retries++;
    }
  }

  if (retries === MAX_RETRY_ATTEMPTS) {
    throw new Error(`Failed after ${retries} retries.`);
  }

  return result;
};

export const filterScopedAndNotScopedPackages = (
  packages: string[]
): ScopedAndNotScopedPackages => {
  const scopedPackages = packages.filter((name) => name.includes("@"));
  const notScopedPackages = packages.filter((name) => !name.includes("@"));

  return { scopedPackages, notScopedPackages };
};
