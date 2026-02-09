import { cli } from "../cli.js";
import { SecureLogger } from "../security/secure-logger.js";
import { env } from "../env.js";
import { estimateDeobfuscationCost, formatCostEstimate } from "../cost-estimator.js";
import { failWithProblem } from "../cli-error.js";
import {
  defaultConcurrency,
  normalizeOutputDir,
  parseConcurrency,
  requireApiKey,
  toCliProblem,
  validateInputForCommand
} from "./common.js";

export const anthropic = cli()
  .name("anthropic")
  .description("Use Anthropic's Claude API to unminify code with maximum quality (Claude Sonnet 4 default)")
  .option("-m, --model <model>", "The model to use (claude-4-opus-20250514-reasoning, claude-4-sonnet-20250514-reasoning, claude-4-opus-20250514, claude-4-sonnet-20250514, claude-3-5-sonnet-latest, claude-3-5-sonnet-20241022, claude-3-5-haiku-latest, claude-3-5-haiku-20241022, claude-3-opus-latest, claude-3-opus-20240229, claude-3-sonnet-20240229, claude-3-haiku-20240307)", "claude-4-sonnet-20250514")
  .option("--advanced", "Force enable advanced multi-agent system (enabled by default for Claude 4+)", false)
  .option("--basic", "Use basic single-agent approach for speed over quality", false)
  .option(
    "-k, --apiKey <apiKey>",
    "The Anthropic API key. Alternatively use ANTHROPIC_API_KEY environment variable"
  )
  .option("--verbose", "Show verbose output")
  .option(
    "-c, --concurrency <number>",
    "Number of files to process in parallel",
    defaultConcurrency()
  )
  .option("-o, --output-dir <path>", "Output directory for processed artifacts")
  .option("--outputDir <path>", "Deprecated alias for --output-dir")
  .option("--cost", "Estimate the cost of deobfuscation without running it")
  .argument("input", "The input file, directory, or ZIP file to deobfuscate")
  .action(async (input, opts) => {
    try {
      if (opts.verbose) {
        SecureLogger.enableVerbose();
      }

      const concurrency = parseConcurrency(String(opts.concurrency));
      const outputDir = normalizeOutputDir(opts);
      validateInputForCommand(input);

      // Maximum quality is now the default for Claude 4+ models
      const isAdvancedModel =
        opts.model.includes("claude-4") ||
        opts.model.includes("claude-3-5-sonnet") ||
        opts.model.includes("claude-3-opus");
      const useAdvancedAgent = opts.advanced || (isAdvancedModel && !opts.basic);

      if (opts.cost) {
        SecureLogger.debug("Estimating deobfuscation costs...");
        const estimate = await estimateDeobfuscationCost(
          input,
          "anthropic",
          opts.model,
          useAdvancedAgent
        );
        console.log(formatCostEstimate(estimate));
        return;
      }

      const apiKey = requireApiKey(
        opts.apiKey ?? env("ANTHROPIC_API_KEY"),
        "Anthropic"
      );

      if (useAdvancedAgent && isAdvancedModel) {
        SecureLogger.debug(
          "Advanced multi-agent system enabled for maximum quality (default for Claude 4+)"
        );
      } else if (opts.basic) {
        SecureLogger.debug(
          "Basic single-agent mode enabled for speed (--basic flag used)"
        );
      } else {
        SecureLogger.debug("Standard processing mode enabled");
      }

      const [{ default: prettier }, { default: babel }, { anthropicRename }, { unminifyEnhanced }] =
        await Promise.all([
          import("../plugins/prettier.js"),
          import("../plugins/babel/babel.js"),
          import("../plugins/anthropic-rename.js"),
          import("../unminify-enhanced.js")
        ]);

      await unminifyEnhanced(
        input,
        [babel, anthropicRename({ apiKey, model: opts.model, useAdvancedAgent }), prettier],
        concurrency,
        outputDir
      );
    } catch (error) {
      const cliProblem = toCliProblem(error);
      failWithProblem(cliProblem);
    }
  });
