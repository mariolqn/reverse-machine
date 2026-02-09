export type CliErrorCode =
  | "invalid_input"
  | "missing_api_key"
  | "processing_failed";

export interface ProblemJson {
  type: string;
  title: string;
  status: number;
  detail: string;
}

const PROBLEM_TYPE_BASE = "https://reverse-machine.dev/problems/";

function titleFromCode(code: CliErrorCode): string {
  switch (code) {
    case "invalid_input":
      return "Invalid input";
    case "missing_api_key":
      return "Missing API key";
    case "processing_failed":
      return "Processing failed";
    default:
      return "Unknown error";
  }
}

function statusFromCode(code: CliErrorCode): number {
  switch (code) {
    case "invalid_input":
      return 2;
    case "missing_api_key":
      return 3;
    case "processing_failed":
      return 1;
    default:
      return 1;
  }
}

export class CliProblem extends Error {
  readonly code: CliErrorCode;
  readonly status: number;

  constructor(code: CliErrorCode, detail: string, status?: number) {
    super(detail);
    this.name = "CliProblem";
    this.code = code;
    this.status = status ?? statusFromCode(code);
  }
}

export function toProblemJson(error: unknown): ProblemJson {
  if (error instanceof CliProblem) {
    return {
      type: `${PROBLEM_TYPE_BASE}${error.code}`,
      title: titleFromCode(error.code),
      status: error.status,
      detail: error.message
    };
  }

  const detail =
    error instanceof Error ? error.message : "Unexpected processing error";
  return {
    type: `${PROBLEM_TYPE_BASE}processing_failed`,
    title: titleFromCode("processing_failed"),
    status: statusFromCode("processing_failed"),
    detail
  };
}

export function failWithProblem(error: unknown): never {
  const problem = toProblemJson(error);
  console.error(JSON.stringify(problem));
  process.exit(problem.status);
}
