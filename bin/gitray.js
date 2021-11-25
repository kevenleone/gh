#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json");

/**
 * Inject data in Process Envinroment
 */
process.env.APP_NAME = "GitRay";
process.env.PACKAGE_VERSION = pkg.version;

/**
 * Load Dist Project
 */

require("../dist/index");
