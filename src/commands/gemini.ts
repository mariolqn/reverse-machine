import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminify } from "../unminify.js";
import babel from "../plugins/babel/babel.js";
import { SecureLogger } from "../security/secure-logger.js";
import { geminiRename } from "../plugins/gemini-rename.js";
import { env } from "../env.js";

export const gemini = cli()
  .name("gemini")
  .description("Use Google Gemini/AIStudio API to unminify code")
  .option("-m, --model <model>", "The model to use (gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro)", "gemini-2.5-flash")
  .option("-o, --outputDir <output>", "The output directory", "output")
  .option(
    "-k, --apiKey <apiKey>",
    "The Google Gemini/AIStudio API key. Alternatively use GEMINI_API_KEY environment variable"
  )
  .option("--verbose", "Show verbose output")
  .argument("input", "The input minified Javascript file")
  .action(async (filename, opts) => {
    if (opts.verbose) {
      SecureLogger.enableVerbose();
    }

    const apiKey = opts.apiKey ?? env("GEMINI_API_KEY");
    await unminify(filename, opts.outputDir, [
      babel,
      geminiRename({ apiKey, model: opts.model }),
      prettier
    ]);
  });
