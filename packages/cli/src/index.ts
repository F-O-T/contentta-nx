#!/usr/bin/env node

import { Command } from "commander";
import { createCommand } from "./commands/create";

const program = new Command();

program
  .name("contentagen-create")
  .description("Create an Astro landing page with ContentaGen blocks")
  .version("0.1.0");

program
  .command("create")
  .description("Create a new landing page project")
  .option("--blocks <blocks>", "Comma-separated list of block IDs")
  .option("--output <path>", "Output directory path")
  .action(createCommand);

program.parse();
