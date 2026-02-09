import { cli } from "../cli.js";
import { SecureLogger } from "../security/secure-logger.js";
import { failWithProblem } from "../cli-error.js";
import {
  defaultConcurrency,
  normalizeOutputDir,
  parseConcurrency,
  toCliProblem,
  validateInputForCommand
} from "./common.js";

export const local = cli()
  .name("local")
  .description(
    "Process code locally with AST cleanup and formatting (no remote LLM calls)."
  )
  .option("--verbose", "Show verbose output")
  .option(
    "-c, --concurrency <number>",
    "Number of files to process in parallel",
    defaultConcurrency()
  )
  .option("-o, --output-dir <path>", "Output directory for processed artifacts")
  .option("--outputDir <path>", "Deprecated alias for --output-dir")
  .argument("input", "The input file, directory, or ZIP file to process")
  .action(async (input, opts) => {
    try {
      if (opts.verbose) {
        SecureLogger.enableVerbose();
      }

      const concurrency = parseConcurrency(String(opts.concurrency));
      const outputDir = normalizeOutputDir(opts);
      validateInputForCommand(input);

      const [{ default: prettier }, { default: babel }, { unminifyEnhanced }] =
        await Promise.all([
          import("../plugins/prettier.js"),
          import("../plugins/babel/babel.js"),
          import("../unminify-enhanced.js")
        ]);

      await unminifyEnhanced(input, [babel, prettier], concurrency, outputDir);
    } catch (error) {
      const cliProblem = toCliProblem(error);
      failWithProblem(cliProblem);
    }
  });
