import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminifyEnhanced } from "../unminify-enhanced.js";
import babel from "../plugins/babel/babel.js";
import { anthropicRename } from "../plugins/anthropic-rename.js";
import { SecureLogger } from "../security/secure-logger.js";
import { env } from "../env.js";
import os from "os";

export const anthropic = cli()
  .name("anthropic")
  .description("Use Anthropic's Claude API to unminify code")
  .option("-m, --model <model>", "The model to use", "claude-3-5-sonnet-20241022")
  .option(
    "-k, --apiKey <apiKey>",
    "The Anthropic API key. Alternatively use ANTHROPIC_API_KEY environment variable"
  )
  .option("--verbose", "Show verbose output")
  .option(
    "-c, --concurrency <number>",
    "Number of files to process in parallel",
    String(os.cpus().length)
  )
  .argument("input", "The input file, directory, or ZIP file to deobfuscate")
  .action(async (input, opts) => {
    if (opts.verbose) {
      SecureLogger.enableVerbose();
    }

    const apiKey = opts.apiKey ?? env("ANTHROPIC_API_KEY");
    const concurrency = parseInt(opts.concurrency);

    await unminifyEnhanced(
      input,
      [babel, anthropicRename({ apiKey, model: opts.model }), prettier],
      concurrency
    );
  });
