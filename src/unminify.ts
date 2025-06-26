import fs from "node:fs/promises";
import { ensureFileExists } from "./file-utils.js";
import { webcrack } from "./plugins/webcrack.js";
import { verbose } from "./verbose.js";
import { parse } from "@babel/parser";

export async function unminify(
  filename: string,
  outputDir: string,
  plugins: ((code: string) => Promise<string>)[] = []
) {
  ensureFileExists(filename);
  const bundledCode = await fs.readFile(filename, "utf-8");
  const extractedFiles = await webcrack(bundledCode, outputDir);

  for (let i = 0; i < extractedFiles.length; i++) {
    verbose.log(`Processing file ${i + 1}/${extractedFiles.length}`);

    const file = extractedFiles[i];
    const code = await fs.readFile(file.path, "utf-8");

    if (code.trim().length === 0) {
      verbose.log(`Skipping empty file ${file.path}`);
      continue;
    }

    let formattedCode = code;

    try {
      // Attempt to parse the code before processing
      parse(formattedCode, { sourceType: "module", plugins: ["jsx"] });

      for (const plugin of plugins) {
        formattedCode = await plugin(formattedCode);
      }
    } catch (error) {
      console.error(`Error processing file ${file.path}:`, error);
      // If there's an error, we'll keep the original code
      formattedCode = code;
    }

    verbose.log("Input: ", code);
    verbose.log("Output: ", formattedCode);

    await fs.writeFile(file.path, formattedCode);
  }
}

export async function unminifyParallel(
  filename: string,
  outputDir: string,
  plugins: ((code: string) => Promise<string>)[] = [],
  concurrency: number
) {
  try {
    ensureFileExists(filename);
    const bundledCode = await fs.readFile(filename, "utf-8");
    const extractedFiles = await webcrack(bundledCode, outputDir);

    const processFile = async (file: { path: string }, index: number) => {
      try {
        verbose.log(`Processing file ${index + 1}/${extractedFiles.length}`);

        const code = await fs.readFile(file.path, "utf-8");

        if (code.trim().length === 0) {
          verbose.log(`Skipping empty file ${file.path}`);
          return;
        }

        let formattedCode = code;

        // Process the entire file at once, without chunking
        for (const plugin of plugins) {
          try {
            formattedCode = await plugin(formattedCode);
          } catch (pluginError) {
            console.error(`Error in plugin for file ${file.path}:`, pluginError);
            // Continue with the next plugin
          }
        }

        // Attempt to parse the final code
        try {
          parse(formattedCode, { sourceType: "module", plugins: ["jsx"] });
        } catch (parseError) {
          console.error(`Syntax error in file ${file.path} after processing:`, parseError);
          console.error("Problematic code snippet:");
          const lines = formattedCode.split('\n');
          const errorLine = (parseError as { loc?: { line: number } }).loc?.line;
          if (errorLine) {
            console.error(lines.slice(Math.max(0, errorLine - 5), errorLine + 5).join('\n'));
          }
          // Revert to the original code if parsing fails
          formattedCode = code;
        }

        // Fix invalid escape sequences
        formattedCode = fixInvalidEscapeSequences(formattedCode);

        verbose.log("Input: ", code);
        verbose.log("Output: ", formattedCode);

        await fs.writeFile(file.path, formattedCode);
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
      }
    };

    const batchSize = Math.ceil(extractedFiles.length / concurrency);
    const batches = [];
    for (let i = 0; i < extractedFiles.length; i += batchSize) {
      batches.push(extractedFiles.slice(i, i + batchSize));
    }

    await Promise.all(
      batches.map(batch =>
        Promise.all(batch.map((file, index) => processFile(file, index)))
      )
    );
  } catch (error) {
    console.error("Error in unminifyParallel:", error);
    throw error;
  }
}

function fixInvalidEscapeSequences(code: string): string {
  return code.replace(/\\u([0-9a-fA-F]{0,3}[^0-9a-fA-F])/g, (match, p1) => {
    return `\\u${p1.padStart(4, '0')}`;
  });
}
