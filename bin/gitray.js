#!/usr/bin/env node

/**
 * Just a workaround to load correct argv number
 */
process.env.GLOBAL_INITIALIZER = true;

/**
 * Load Dist Project
 */

require("../dist/index");
