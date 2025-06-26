import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminifyEnhanced } from "../unminify-enhanced.js";
import babel from "../plugins/babel/babel.js";
import { geminiRename } from "../plugins/gemini-rename.js";
import { SecureLogger } from "../security/secure-logger.js";
import { env } from "../env.js";
import os from "os";

export const gemini = cli()
  .name("gemini")
  .description("Use Google's Gemini API to unminify code")
  .option("-m, --model <model>", "The model to use", "gemini-1.5-flash")
  .option(
    "-k, --apiKey <apiKey>",
    "The Gemini API key. Alternatively use GEMINI_API_KEY environment variable"
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

    const apiKey = opts.apiKey ?? env("GEMINI_API_KEY");
    const concurrency = parseInt(opts.concurrency);

    await unminifyEnhanced(
      input,
      [babel, geminiRename({ apiKey, model: opts.model }), prettier],
      concurrency
    );
  });
