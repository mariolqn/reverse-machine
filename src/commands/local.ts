import { cli } from "../cli.js";
import { llama } from "../plugins/local-llm-rename/llama.js";
import { DEFAULT_MODEL } from "../local-models.js";
import { unminifyParallel } from "../unminify.js";
import prettier from "../plugins/prettier.js";
import babel from "../plugins/babel/babel.js";
import { localReanme } from "../plugins/local-llm-rename/local-llm-rename.js";
import { SecureLogger } from "../security/secure-logger.js";
import os from "os";

interface LocalOptions {
  model: string;
  outputDir: string;
  seed?: string;
  disableGpu?: boolean;
  verbose?: boolean;
}

export const local = cli()
  .name("local")
  .description("Use a local LLM to unminify code")
  .showHelpAfterError(true)
  .option("-m, --model <model>", "The model to use", DEFAULT_MODEL)
  .option("-o, --outputDir <output>", "The output directory", "output")
  .option(
    "-s, --seed <seed>",
    "Seed for the model to get reproduceable results (leave out for random seed)"
  )
  .option("--disableGpu", "Disable GPU acceleration")
  .option("--verbose", "Show verbose output")
  .argument("<input>", "The input minified Javascript file")
  .action(async (filename: string, opts: LocalOptions) => {
    if (opts.verbose) {
      SecureLogger.enableVerbose();
    }

    SecureLogger.debug("Starting local inference with options: ", opts);

    const prompt = await llama({
      model: opts.model,
      disableGpu: opts.disableGpu,
      seed: opts.seed ? parseInt(opts.seed) : undefined
    });
    
    const concurrency = os.cpus().length;
    await unminifyParallel(filename, opts.outputDir, [
      babel,
      localReanme(prompt),
      prettier
    ], concurrency);
  });
