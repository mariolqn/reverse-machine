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
  .description("Use Google's Gemini API to unminify code with maximum quality (Gemini 2.5 Pro default)")
  .option("-m, --model <model>", "The model to use (gemini-2.5-pro, gemini-2.5-flash, gemini-1.5-pro-latest, gemini-1.5-pro, gemini-1.5-flash-latest, gemini-1.5-flash, gemini-1.0-pro)", "gemini-2.5-pro")
  .option("--advanced", "Force enable advanced multi-agent system (enabled by default for Gemini 2.5+)", false)
  .option("--basic", "Use basic single-agent approach for speed over quality", false)
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
    
    // Maximum quality is now the default for Gemini 2.5+ and 1.5 Pro models
    const isAdvancedModel = opts.model.includes('gemini-2.5') || opts.model.includes('1.5-pro');
    const useAdvancedAgent = opts.advanced || (isAdvancedModel && !opts.basic);
    
    if (useAdvancedAgent && isAdvancedModel) {
      SecureLogger.debug("🚀 Advanced multi-agent system enabled for maximum quality (default for Gemini 2.5+)");
    } else if (opts.basic) {
      SecureLogger.debug("⚡ Basic single-agent mode enabled for speed (--basic flag used)");
    } else {
      SecureLogger.debug("🔄 Standard processing mode enabled");
    }

    await unminifyEnhanced(
      input,
      [babel, geminiRename({ apiKey, model: opts.model, useAdvancedAgent }), prettier],
      concurrency
    );
  });
