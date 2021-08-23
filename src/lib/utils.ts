import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import prompt from "prompts";
import { ProcessOutput } from "zx";

dayjs.extend(relativeTime);

export const clearStdout = (data: ProcessOutput): string =>
  data.stdout.replace("\n", "").trim();

export const getTimeFromNow = (date: string): string => dayjs(date).fromNow();

export const openBrowser = async (page?: string): Promise<void> => {
  await $`open ${page}`;
};

export const promptConfig: prompt.Options = {
  onCancel: (): void => {
    console.log("No data will be saved");
    process.exit(1);
  },
};

export function prompts<T extends string = string>(
  questions: prompt.PromptObject<T> | Array<prompt.PromptObject<T>>,
  options: prompt.Options = promptConfig
): Promise<prompt.Answers<T>> {
  return prompt(questions, options);
}
