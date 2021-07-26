import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ProcessOutput } from "zx";

dayjs.extend(relativeTime);

export const openBrowser = async (page?: string): Promise<void> => {
  await $`open ${page}`;
};

export const promptConfig = {
  onCancel: (): void => {
    console.log("No data will be saved");
    process.exit(1);
  },
};

export const getTimeFromNow = (date: string): string => dayjs(date).fromNow();

export const clearStdout = (data: ProcessOutput): string =>
  data.stdout.replace("\n", "").trim();
