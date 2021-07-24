/// <reference types="zx"/>

export const openBrowser = async (page?: string): Promise<void> => {
  await $`open ${page}`;
};
