const openBrowser = async (page) => {
  await $`open ${page}`;
};

module.exports = {
  openBrowser,
};
