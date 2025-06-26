// Cloud model test utilities
export const testPrompt = async () => {
  // Return a mock prompt function for testing
  return async (instruction: string, code: string, _grammar?: any) => {
    // Simple heuristic for testing - check if code looks minified
    const hasShortVariableNames = /\b[a-z]\b/.test(code);
    const hasMinifiedStructure = code.includes("var ") || code.includes("function(");
    
    if (hasShortVariableNames && hasMinifiedStructure) {
      return "UNREADABLE: Code appears to be minified with short variable names.";
    } else {
      return "GOOD: Code has readable variable names and structure.";
    }
  };
};
