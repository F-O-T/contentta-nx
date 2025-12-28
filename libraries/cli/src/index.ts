#!/usr/bin/env node

import { Command } from "commander";
import { addCommand } from "./commands/add.ts";

const program = new Command();

program
   .name("contentta")
   .description("CLI tool to add Contentta blocks to your project")
   .version("0.1.0");

program
   .command("add")
   .description("Add blocks from the Contentta registry")
   .argument(
      "<blocks...>",
      "Block IDs to add (e.g., hero-parallax features-one)",
   )
   .option("-o, --output <path>", "Output directory for blocks")
   .action(addCommand);

program.parse();
