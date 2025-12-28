import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import { tavily } from "@tavily/core";
import { z } from "zod";

export function getTavilyCrawlInstructions(): string {
   return `
## TAVILY CRAWL TOOL
Extracts content from a website (crawls up to 2 levels deep).

**When to use:** Extract comprehensive information from a specific URL

**Parameters:**
- websiteUrl (string): Full URL with https://
- instructions (string): What to extract (max 400 chars, be specific)

**Example:**
websiteUrl: "https://stripe.com/docs"
instructions: "Extract API endpoints, authentication methods, and integration features"
`;
}

export const tavilyCrawlTool = createTool({
   description: "Crawls a website url to extract knowledge and content",
   execute: async (inputData, context) => {
      const { websiteUrl, instructions } = inputData;
      const requestContext = context?.requestContext;

      if (!requestContext?.has("userId")) {
         throw AppError.internal("User ID is required in request context");
      }
      const userId = requestContext.get("userId") as string;

      try {
         const tavilyClient = tavily({ apiKey: serverEnv.TAVILY_API_KEY });

         const truncatedInstructions = instructions.slice(0, 400);

         const crawResult = await tavilyClient.crawl(websiteUrl, {
            instructions: truncatedInstructions,
            maxDepth: 2,
         });
         const { results } = crawResult;
         return { results };
      } catch (error) {
         console.error(
            `Brand crawl failed for userId=${userId}, websiteUrl="${websiteUrl}".`,
            error,
         );
         propagateError(error);
         throw AppError.internal(
            `Crawl failed for userId=${userId}, websiteUrl="${websiteUrl}": ${(error as Error).message}`,
         );
      }
   },
   id: "tavily-crawl",
   inputSchema: z.object({
      instructions: z
         .string()
         .describe(
            "Natural language instructions for the crawler to follow when crawling the website (max 400 characters)",
         ),
      websiteUrl: z.url().describe("The website URL to crawl"),
   }),
});
