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

      // Maximum quality is now the default for GPT-4.1+ models
      const isAdvancedModel =
        opts.model.includes("gpt-4.1") ||
        opts.model.includes("o1") ||
        opts.model.includes("o3");
      const useAdvancedAgent = opts.advanced || (isAdvancedModel && !opts.basic);

      if (opts.cost) {
        SecureLogger.debug("Estimating deobfuscation costs...");
        const estimate = await estimateDeobfuscationCost(
          input,
          "openai",
          opts.model,
          useAdvancedAgent
        );
        console.log(formatCostEstimate(estimate));
        return;
      }

      const apiKey = requireApiKey(
        opts.apiKey ?? env("OPENAI_API_KEY"),
        "OpenAI"
      );

      if (useAdvancedAgent && isAdvancedModel) {
        SecureLogger.debug(
          "Advanced multi-agent system enabled for maximum quality (default for GPT-4.1+)"
        );
      } else if (opts.basic) {
        SecureLogger.debug(
          "Basic single-agent mode enabled for speed (--basic flag used)"
        );
      } else {
        SecureLogger.debug("Standard processing mode enabled");
      }

      const [{ default: prettier }, { default: babel }, { openaiRename }, { unminifyEnhanced }] =
        await Promise.all([
          import("../plugins/prettier.js"),
          import("../plugins/babel/babel.js"),
          import("../plugins/openai/openai-rename.js"),
          import("../unminify-enhanced.js")
        ]);

      await unminifyEnhanced(
        input,
        [babel, openaiRename({ apiKey, model: opts.model, useAdvancedAgent }), prettier],
        concurrency,
        outputDir
      );
    } catch (error) {
      const cliProblem = toCliProblem(error);
      failWithProblem(cliProblem);
    }
  });
