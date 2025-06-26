import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminifyParallel } from "../unminify.js";
import babel from "../plugins/babel/babel.js";
import { openaiRename } from "../plugins/openai/openai-rename.js";
import { SecureLogger } from "../security/secure-logger.js";
import { env } from "../env.js";
import os from "os";

export const openai = cli()
  .name("openai")
  .description("Use OpenAI's API to unminify code with maximum quality (GPT-4.1 default)")
  .option("-m, --model <model>", "The model to use (gpt-4.1, gpt-4o, gpt-4o-mini, gpt-4.1-mini, gpt-4.1-nano, o1, o3, o3-mini, o4-mini)", "gpt-4.1")
  .option("--advanced", "Force enable advanced multi-agent system (enabled by default for GPT-4.1+)", false)
  .option("--basic", "Use basic single-agent approach for speed over quality", false)
  .option("-o, --outputDir <output>", "The output directory", "output")
  .option(
    "-k, --apiKey <apiKey>",
    "The OpenAI API key. Alternatively use OPENAI_API_KEY environment variable"
  )
  .option("--verbose", "Show verbose output")
  .option(
    "-c, --concurrency <number>",
    "Number of files to process in parallel",
    String(os.cpus().length)
  )
  .argument("input", "The input minified Javascript file")
  .action(async (filename, opts) => {
    if (opts.verbose) {
      SecureLogger.enableVerbose();
    }

    const apiKey = opts.apiKey ?? env("OPENAI_API_KEY");
    const concurrency = parseInt(opts.concurrency);
    
    // Maximum quality is now the default for GPT-4.1+ models
    const isAdvancedModel = opts.model.includes('gpt-4.1') || opts.model.includes('o1') || opts.model.includes('o3');
    const useAdvancedAgent = opts.advanced || (isAdvancedModel && !opts.basic);
    
    if (useAdvancedAgent && isAdvancedModel) {
      SecureLogger.debug("🚀 Advanced multi-agent system enabled for maximum quality (default for GPT-4.1+)");
    } else if (opts.basic) {
      SecureLogger.debug("⚡ Basic single-agent mode enabled for speed (--basic flag used)");
    } else {
      SecureLogger.debug("🔄 Standard processing mode enabled");
    }
    
    await unminifyParallel(
      filename,
      opts.outputDir,
      [babel, openaiRename({ apiKey, model: opts.model, useAdvancedAgent }), prettier],
      concurrency
    );
  });
