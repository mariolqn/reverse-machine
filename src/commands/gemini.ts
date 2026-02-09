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

      // Maximum quality is now the default for Gemini 2.5+ and 1.5 Pro models
      const isAdvancedModel =
        opts.model.includes("gemini-2.5") || opts.model.includes("1.5-pro");
      const useAdvancedAgent = opts.advanced || (isAdvancedModel && !opts.basic);

      if (opts.cost) {
        SecureLogger.debug("Estimating deobfuscation costs...");
        const estimate = await estimateDeobfuscationCost(
          input,
          "gemini",
          opts.model,
          useAdvancedAgent
        );
        console.log(formatCostEstimate(estimate));
        return;
      }

      const apiKey = requireApiKey(
        opts.apiKey ?? env("GEMINI_API_KEY"),
        "Gemini"
      );

      if (useAdvancedAgent && isAdvancedModel) {
        SecureLogger.debug(
          "Advanced multi-agent system enabled for maximum quality (default for Gemini 2.5+)"
        );
      } else if (opts.basic) {
        SecureLogger.debug(
          "Basic single-agent mode enabled for speed (--basic flag used)"
        );
      } else {
        SecureLogger.debug("Standard processing mode enabled");
      }

      const [{ default: prettier }, { default: babel }, { geminiRename }, { unminifyEnhanced }] =
        await Promise.all([
          import("../plugins/prettier.js"),
          import("../plugins/babel/babel.js"),
          import("../plugins/gemini-rename.js"),
          import("../unminify-enhanced.js")
        ]);

      await unminifyEnhanced(
        input,
        [babel, geminiRename({ apiKey, model: opts.model, useAdvancedAgent }), prettier],
        concurrency,
        outputDir
      );
    } catch (error) {
      const cliProblem = toCliProblem(error);
      failWithProblem(cliProblem);
    }
  });
