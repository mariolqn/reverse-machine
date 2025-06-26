import { cli } from "../cli.js";
import prettier from "../plugins/prettier.js";
import { unminifyEnhanced } from "../unminify-enhanced.js";
import babel from "../plugins/babel/babel.js";
import { openaiRename } from "../plugins/openai/openai-rename.js";
import { SecureLogger } from "../security/secure-logger.js";
import { env } from "../env.js";
import { estimateDeobfuscationCost, formatCostEstimate } from "../cost-estimator.js";
import os from "os";

export const openai = cli()
  .name("openai")
  .description("Use OpenAI's API to unminify code with maximum quality (GPT-4.1 default)")
  .option("-m, --model <model>", "The model to use (gpt-4.1, gpt-4o, gpt-4o-mini, gpt-4.1-mini, gpt-4.1-nano, o1, o3, o3-mini, o4-mini)", "gpt-4.1")
  .option("--advanced", "Force enable advanced multi-agent system (enabled by default for GPT-4.1+)", false)
  .option("--basic", "Use basic single-agent approach for speed over quality", false)
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
  .option("--cost", "Estimate the cost of deobfuscation without running it")
  .argument("input", "The input file, directory, or ZIP file to deobfuscate")
  .action(async (input, opts) => {
    if (opts.verbose) {
      SecureLogger.enableVerbose();
    }

    const concurrency = parseInt(opts.concurrency);
    
    // Maximum quality is now the default for GPT-4.1+ models
    const isAdvancedModel = opts.model.includes('gpt-4.1') || opts.model.includes('o1') || opts.model.includes('o3');
    const useAdvancedAgent = opts.advanced || (isAdvancedModel && !opts.basic);
    
    if (opts.cost) {
      // Cost estimation mode
      try {
        SecureLogger.debug("💰 Estimating deobfuscation costs...");
        const estimate = await estimateDeobfuscationCost(
          input,
          'openai',
          opts.model,
          useAdvancedAgent
        );
        console.log(formatCostEstimate(estimate));
        return;
      } catch (error) {
        console.error("❌ Cost estimation failed:", error);
        process.exit(1);
      }
    }

    // Regular deobfuscation mode
    const apiKey = opts.apiKey ?? env("OPENAI_API_KEY");
    
    if (useAdvancedAgent && isAdvancedModel) {
      SecureLogger.debug("🚀 Advanced multi-agent system enabled for maximum quality (default for GPT-4.1+)");
    } else if (opts.basic) {
      SecureLogger.debug("⚡ Basic single-agent mode enabled for speed (--basic flag used)");
    } else {
      SecureLogger.debug("🔄 Standard processing mode enabled");
    }
    
    await unminifyEnhanced(
      input,
      [babel, openaiRename({ apiKey, model: opts.model, useAdvancedAgent }), prettier],
      concurrency
    );
  });
