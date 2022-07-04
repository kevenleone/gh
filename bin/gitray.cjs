#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");
const packageJSON = require("../package.json");

/**
 * Inject data in Process Envinroment
 */
process.env.APP_NAME = "GitRay";
process.env.GITRAY_PATH = path.resolve(__dirname, "..");
process.env.PACKAGE_VERSION = packageJSON.version;

/**
 * Load Dist Project
 */

import("../dist/index.js");
