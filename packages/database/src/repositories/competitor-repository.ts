import { competitor } from "../schemas/competitor";
import { eq, and, or, sql } from "drizzle-orm";
import type {
   CompetitorSelect,
   CompetitorInsert,
   CompetitorWithFeatures,
} from "../schemas/competitor";
import type { DatabaseInstance } from "../client";
import { AppError, propagateError } from "@packages/utils/errors";

export async function createCompetitor(
   dbClient: DatabaseInstance,
   data: Omit<CompetitorInsert, "id" | "createdAt" | "updatedAt">,
): Promise<CompetitorSelect> {
   try {
      const result = await dbClient.insert(competitor).values(data).returning();
      const created = result?.[0];
      if (!created) throw AppError.database("Competitor not created");
      return created;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create competitor: ${(err as Error).message}`,
      );
   }
}

export async function getCompetitorById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<CompetitorWithFeatures> {
   try {
      const result = await dbClient.query.competitor.findFirst({
         where: eq(competitor.id, id),
         with: {
            features: true,
         },
      });
      if (!result) throw AppError.database("Competitor not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get competitor: ${(err as Error).message}`,
      );
   }
}

export async function updateCompetitor(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<CompetitorInsert>,
): Promise<CompetitorSelect> {
   try {
      const result = await dbClient
         .update(competitor)
         .set(data)
         .where(eq(competitor.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw AppError.database("Competitor not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update competitor: ${(err as Error).message}`,
      );
   }
}

export async function deleteCompetitor(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(competitor)
         .where(eq(competitor.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw AppError.database("Competitor not found");
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete competitor: ${(err as Error).message}`,
      );
   }
}

export async function listCompetitors(
   dbClient: DatabaseInstance,
   {
      userId,
      organizationId,
      page = 1,
      limit = 20,
   }: {
      userId?: string;
      organizationId?: string;
      page?: number;
      limit?: number;
   },
): Promise<CompetitorWithFeatures[]> {
   try {
      const offset = (page - 1) * limit;

      if (userId && organizationId) {
         return await dbClient.query.competitor.findMany({
            where: or(
               eq(competitor.userId, userId),
               eq(competitor.organizationId, organizationId),
            ),
            limit,
            offset,
            orderBy: (competitor, { desc }) => [desc(competitor.createdAt)],
            with: {
               features: {
                  orderBy: (competitorFeature, { desc }) => [
                     desc(competitorFeature.extractedAt),
                  ],
               },
            },
         });
      }
      if (userId) {
         return await dbClient.query.competitor.findMany({
            where: eq(competitor.userId, userId),
            limit,
            offset,
            orderBy: (competitor, { desc }) => [desc(competitor.createdAt)],
            with: {
               features: {
                  limit: 5,
                  orderBy: (competitorFeature, { desc }) => [
                     desc(competitorFeature.extractedAt),
                  ],
               },
            },
         });
      }
      if (organizationId) {
         return await dbClient.query.competitor.findMany({
            where: eq(competitor.organizationId, organizationId),
            limit,
            offset,
            orderBy: (competitor, { desc }) => [desc(competitor.createdAt)],
            with: {
               features: {
                  limit: 5,
                  orderBy: (competitorFeature, { desc }) => [
                     desc(competitorFeature.extractedAt),
                  ],
               },
            },
         });
      }
      return [];
   } catch (err) {
      throw AppError.database(
         `Failed to list competitors: ${(err as Error).message}`,
      );
   }
}

export async function getTotalCompetitors(
   dbClient: DatabaseInstance,
   { userId, organizationId }: { userId?: string; organizationId?: string },
): Promise<number> {
   try {
      if (userId && organizationId) {
         const result = await dbClient
            .select({ value: sql<number>`cast(count(*) as int)` })
            .from(competitor)
            .where(
               or(
                  eq(competitor.userId, userId),
                  eq(competitor.organizationId, organizationId),
               ),
            );
         return result[0]?.value ?? 0;
      }
      if (userId) {
         const result = await dbClient
            .select({ value: sql<number>`cast(count(*) as int)` })
            .from(competitor)
            .where(eq(competitor.userId, userId));
         return result[0]?.value ?? 0;
      }
      if (organizationId) {
         const result = await dbClient
            .select({ value: sql<number>`cast(count(*) as int)` })
            .from(competitor)
            .where(eq(competitor.organizationId, organizationId));
         return result[0]?.value ?? 0;
      }
      return 0;
   } catch (err) {
      throw AppError.database(
         `Failed to get total competitors: ${(err as Error).message}`,
      );
   }
}

export async function searchCompetitors(
   dbClient: DatabaseInstance,
   {
      query,
      userId,
      organizationId,
      page = 1,
      limit = 20,
   }: {
      query: string;
      userId?: string;
      organizationId?: string;
      page?: number;
      limit?: number;
   },
): Promise<CompetitorWithFeatures[]> {
   try {
      const offset = (page - 1) * limit;

      function buildSearchWhereCondition(
         query: string,
         userId?: string,
         organizationId?: string,
      ) {
         const searchPattern = `%${query.toLowerCase()}%`;

         // Base condition: search name or websiteUrl (case-insensitive) - grouped to avoid precedence issues
         const baseCondition = sql`(${competitor.name}::text ILIKE ${searchPattern} OR ${competitor.websiteUrl}::text ILIKE ${searchPattern})`;

         if (userId && organizationId) {
            return and(
               baseCondition,
               or(
                  eq(competitor.userId, userId),
                  eq(competitor.organizationId, organizationId),
               ),
            );
         }

         if (userId) return and(baseCondition, eq(competitor.userId, userId));

         if (organizationId)
            return and(
               baseCondition,
               eq(competitor.organizationId, organizationId),
            );

         return baseCondition;
      }
      const whereCondition = buildSearchWhereCondition(
         query,
         userId,
         organizationId,
      );

      return await dbClient.query.competitor.findMany({
         where: whereCondition,
         limit,
         offset,
         orderBy: (competitor, { desc }) => [desc(competitor.createdAt)],
         with: {
            features: {
               limit: 3,
               orderBy: (competitorFeature, { desc }) => [
                  desc(competitorFeature.extractedAt),
               ],
            },
         },
      });
   } catch (err) {
      throw AppError.database(
         `Failed to search competitors: ${(err as Error).message}`,
      );
   }
}

export async function getRandomFindingsFromCompetitors(
   dbClient: DatabaseInstance,
   organizationId: string,
   limit: number = 3,
): Promise<{ insights: string[]; priorities: string[] }> {
   try {
      const competitorsWithFindings = await dbClient.query.competitor.findMany({
         where: and(
            eq(competitor.organizationId, organizationId),
            sql`${competitor.findings} IS NOT NULL AND ${competitor.findings} != '{}'`,
         ),
         columns: {
            findings: true,
         },
      });

      if (competitorsWithFindings.length === 0) {
         return { insights: [], priorities: [] };
      }

      const allInsights: string[] = [];
      const allPriorities: string[] = [];

      for (const comp of competitorsWithFindings) {
         if (comp.findings?.insights) {
            allInsights.push(
               ...comp.findings.insights.filter(
                  (insight): insight is string =>
                     insight != null && insight !== undefined,
               ),
            );
         }
         if (comp.findings?.priorities) {
            allPriorities.push(
               ...comp.findings.priorities.filter(
                  (priority): priority is string =>
                     priority != null && priority !== undefined,
               ),
            );
         }
      }

      const shuffle = <T>(array: T[]): T[] => {
         const shuffled = [...array];

         for (let i = shuffled.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = shuffled[i];
            const randomValue = shuffled[randomIndex];
            if (temp !== undefined && randomValue !== undefined) {
               shuffled[i] = randomValue;
               shuffled[randomIndex] = temp;
            }
         }

         return shuffled;
      };

      return {
         insights: shuffle(allInsights).slice(0, limit),
         priorities: shuffle(allPriorities).slice(0, limit),
      };
   } catch (err) {
      throw AppError.database(
         `Failed to get random findings: ${(err as Error).message}`,
      );
   }
}
