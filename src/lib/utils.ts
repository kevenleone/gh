import { ProcessOutput } from "zx";

export const openBrowser = async (page?: string): Promise<void> => {
  await $`open ${page}`;
};

export const promptConfig = {
  onCancel: (): void => {
    console.log("No data will be saved");
    process.exit(1);
  },
};

export const clearStdout = (data: ProcessOutput): string =>
  data.stdout.replace("\n", "").trim();
