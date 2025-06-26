import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminify } from "../unminify.js";
import babel from "../plugins/babel/babel.js";
import { SecureLogger } from "../security/secure-logger.js";
import { anthropicRename } from "../plugins/anthropic-rename.js";
import { env } from "../env.js";

export const anthropic = cli()
  .name("anthropic")
  .description("Use Anthropic's Claude API to unminify code. Supports Claude 4 with reasoning capabilities.")
  .option("-m, --model <model>", "The model to use. Claude 4 models support '-reasoning' suffix for extended thinking.", "claude-3-5-haiku-latest")
  .option("-o, --outputDir <o>", "The output directory", "output")
  .option(
    "-k, --apiKey <apiKey>",
    "The Anthropic API key. Alternatively use ANTHROPIC_API_KEY environment variable"
  )
  .option("--verbose", "Show verbose output")
  .argument("input", "The input minified Javascript file")
  .action(async (filename, opts) => {
    if (opts.verbose) {
      SecureLogger.enableVerbose();
    }

    // Validate Claude 4 model usage
    if (opts.model.includes("claude-4") && !opts.model.includes("20250514")) {
      SecureLogger.info(`Using Claude 4 model: ${opts.model}. Note: Claude 4 models support extended reasoning for better code understanding.`);
    }

    const apiKey = opts.apiKey ?? env("ANTHROPIC_API_KEY");
    await unminify(filename, opts.outputDir, [
      babel,
      anthropicRename({ apiKey, model: opts.model }),
      prettier
    ]);
  }); 