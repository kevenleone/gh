#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON = require("../package.json");

/**
 * Inject data in Process Envinroment
 */
process.env.APP_NAME = "GitRay";
process.env.PACKAGE_VERSION = packageJSON.version;

/**
 * Load Dist Project
 */

import("../dist/index.js");
