import { serverEnv } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
import OpenAI from "openai";

const openai = new OpenAI({
   apiKey: serverEnv.OPENAI_API_KEY,
});

export const createEmbedding = async (text: string) => {
   try {
      const response = await openai.embeddings.create({
         dimensions: 1536,
         input: text,
         model: "text-embedding-3-small",
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
         throw AppError.internal(
            "Failed to create embedding: No embedding found",
         );
      }
      const tokenCount = response.usage?.total_tokens || 0;

      return {
         embedding,
         tokenCount,
      };
   } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(
         `Failed to create embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
   }
};

export const createEmbeddings = async (
   texts: string[],
): Promise<(number[] | null)[]> => {
   try {
      if (texts.length === 0) {
         return [];
      }

      // Process embeddings individually to handle failures gracefully
      const embeddings: (number[] | null)[] = [];

      for (let i = 0; i < texts.length; i++) {
         const text = texts[i];

         if (!text || text.trim() === "") {
            console.warn(`Skipping empty text at index ${i}`);
            embeddings.push(null);
            continue;
         }

         try {
            const { embedding } = await createEmbedding(text);
            embeddings.push(embedding);
         } catch (error) {
            console.warn(
               `Failed to create embedding for text at index ${i}: ${error instanceof Error ? error.message : String(error)}`,
            );
            embeddings.push(null);
         }
      }

      return embeddings;
   } catch (error) {
      propagateError(error);
      throw AppError.internal(
         `Failed to create embeddings: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
   }
};
