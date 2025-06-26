#!/usr/bin/env -S npx tsx
import { version } from "../package.json";
import { openai } from "./commands/openai.js";
import { cli } from "./cli.js";
import { gemini } from "./commands/gemini.js";
import { anthropic } from "./commands/anthropic.js";

cli()
  .name("humanify")
  .description(
    "Unminify code using OpenAI's API, Anthropic's Claude, or Google's Gemini"
  )
  .version(version)
  .addCommand(openai)
  .addCommand(anthropic)
  .addCommand(gemini)
  .parse(process.argv);
