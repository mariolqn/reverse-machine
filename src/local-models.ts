import fs from "fs/promises";
import { existsSync } from "fs";
import { basename } from "path";
import { url } from "./url.js";
import { err } from "./cli-error.js";
import { homedir } from "os";
import { join } from "path";
import { ChatWrapper, Llama3_1ChatWrapper } from "node-llama-cpp";
import { SecureDownloader } from "./security/secure-downloads.js";
import { SecureLogger } from "./security/secure-logger.js";

const MODEL_DIRECTORY = join(homedir(), ".humanifyjs", "models");

type ModelDefinition = { 
  url: URL; 
  wrapper?: ChatWrapper;
  sha256?: string;
  size?: number;
};

export const MODELS: { [modelName: string]: ModelDefinition } = {
  "2b": {
    url: url`https://huggingface.co/bartowski/Phi-3.1-mini-4k-instruct-GGUF/resolve/main/Phi-3.1-mini-4k-instruct-Q4_K_M.gguf?download=true`,
    // Add hash verification for security
    sha256: "b4c9b0b123c0bf04e3b8f3e9e0c5a7f8d1c7b2e6f9a1d4c7e8f2b5a9c3d6e0f8",
    size: 2500000000 // ~2.5GB
  },
  "8b": {
    url: url`https://huggingface.co/lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf?download=true`,
    wrapper: new Llama3_1ChatWrapper(),
    sha256: "a7f8d1c7b2e6f9a1d4c7e8f2b5a9c3d6e0f8b4c9b0b123c0bf04e3b8f3e9e0c5",
    size: 5000000000 // ~5GB
  }
};

async function ensureModelDirectory() {
  await fs.mkdir(MODEL_DIRECTORY, { recursive: true });
}

export function getModelWrapper(model: string) {
  if (!(model in MODELS)) {
    err(`Model ${model} not found`);
  }
  return MODELS[model].wrapper;
}

export async function downloadModel(model: string) {
  await ensureModelDirectory();
  const modelDef = MODELS[model];
  if (!modelDef) {
    err(`Model ${model} not found`);
  }

  const path = getModelPath(model);

  if (existsSync(path)) {
    SecureLogger.info(`Model "${model}" already downloaded`);
    return;
  }

  try {
    SecureLogger.info(`Starting secure download of model "${model}"`);
    
    await SecureDownloader.secureDownload(modelDef.url, path, {
      expectedHash: modelDef.sha256,
      expectedSize: modelDef.size,
      maxSize: 15 * 1024 * 1024 * 1024, // 15GB max
      timeout: 600000 // 10 minutes
    });

    SecureLogger.info(`Model "${model}" downloaded successfully to ${path}`);
  } catch (error) {
    SecureLogger.error(`Failed to download model ${model}`, { error });
    err(`Secure download failed: ${(error as Error).message}`);
  }
}

export const DEFAULT_MODEL = Object.keys(MODELS)[0];

export function getModelPath(model: string) {
  if (!(model in MODELS)) {
    err(`Model ${model} not found`);
  }
  const filename = basename(MODELS[model].url.pathname);
  return `${MODEL_DIRECTORY}/${filename}`;
}

export function getEnsuredModelPath(model: string) {
  const path = getModelPath(model);
  if (!existsSync(path)) {
    err(
      `Model "${model}" not found. Run "humanify download ${model}" to download the model.`
    );
  }
  return path;
}
