#!/usr/bin/env -S npx tsx
import { version } from "../package.json";
import { openai } from "./commands/openai.js";
import { cli } from "./cli.js";
import { gemini } from "./commands/gemini.js";
import { anthropic } from "./commands/anthropic.js";

cli()
  .name("reverse-machine")
  .description(
    "Deobfuscate JavaScript code using AI. Supports single files, project directories, and ZIP archives."
  )
  .version(version)
  .addCommand(openai)
  .addCommand(anthropic)
  .addCommand(gemini)
  .parse(process.argv);
