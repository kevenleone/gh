#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json");

/**
 * Just a workaround to load correct argv number
 */
process.env.GLOBAL_INITIALIZER = true;
process.env.PACKAGE_VERSION = pkg.version;

/**
 * Load Dist Project
 */

require("../dist/index");
