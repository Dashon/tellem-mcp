#!/usr/bin/env node

import { main } from "./cli.js";
import { installMain } from "./install.js";

if (process.argv[2] === "install") {
  installMain(process.argv.slice(3));
} else {
  main();
}
