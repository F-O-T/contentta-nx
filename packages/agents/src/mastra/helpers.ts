export type MastraLLMUsage = {
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   reasoningTokens?: number | null;
   cachedInputTokens?: number | null;
};

export function createToolSystemPrompt(toolInstructions: string[]): string {
   if (!toolInstructions.length) {
      return "";
   }

   const formattedInstructions = toolInstructions
      .filter((instruction) => instruction?.trim())
      .map((instruction) => instruction.trim())
      .join("\n");

   return `
# AVAILABLE TOOLS

${formattedInstructions}

# RULES
- Use tools only when necessary
- Never repeat identical calls
- Stop when you have sufficient information
`;
}