import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminifyParallel } from "../unminify.js";
import babel from "../plugins/babel/babel.js";
import { openaiRename } from "../plugins/openai/openai-rename.js";
import { verbose } from "../verbose.js";
import { env } from "../env.js";
import os from "os";

export const openai = cli()
  .name("openai")
  .description("Use OpenAI's API to unminify code")
  .option("-m, --model <model>", "The model to use", "gpt-4o-mini")
  .option("-o, --outputDir <output>", "The output directory", "output")
  .option(
    "-k, --apiKey <apiKey>",
    "The OpenAI API key. Alternatively use OPENAI_API_KEY environment variable"
  )
  .option("--verbose", "Show verbose output")
  .option("-c, --concurrency <number>", "Number of files to process in parallel", String(os.cpus().length))
  .argument("input", "The input minified Javascript file")
  .action(async (filename, opts) => {
    if (opts.verbose) {
      verbose.enabled = true;
    }

    const apiKey = opts.apiKey ?? env("OPENAI_API_KEY");
    const concurrency = parseInt(opts.concurrency);
    await unminifyParallel(filename, opts.outputDir, [
      babel,
      openaiRename({ apiKey, model: opts.model }),
      prettier
    ], concurrency);
  });
