import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ParsedArgs } from "minimist";
import prompt from "prompts";
import { ProcessOutput } from "zx";

dayjs.extend(relativeTime);

export const buildFlags = (argv: ParsedArgs, ...args: string[]): ParsedArgs => {
  const flags: any = {};

  for (const arg of args) {
    flags[arg] = argv[arg] ?? argv[arg.charAt(0)];
  }

  return { ...argv, ...flags };
};

export const clearStdout = (data: ProcessOutput): string =>
  data.stdout.replace("\n", "").trim();

export const getTimeFromNow = (date: string): string => dayjs(date).fromNow();

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
