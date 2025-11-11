import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import type {
   BrandFeatureInsert,
   BrandFeatureSelect,
} from "../schemas/brand-features";
import { brandFeature } from "../schemas/brand-features";

const buildOwnerExists = (organizationId?: string) => {
   if (!organizationId) return sql`TRUE`;

   return sql`
    EXISTS (
      SELECT 1 FROM brand b
      WHERE b.id = ${brandFeature.brandId}
      AND b.organization_id = ${organizationId}
    )
  `;
};

// Combines a cutoff date condition with the owner existence condition

export async function createBrandFeature(
   dbClient: DatabaseInstance,
   data: Omit<BrandFeatureInsert, "id" | "extractedAt">,
): Promise<BrandFeatureSelect> {
   try {
      const result = await dbClient
         .insert(brandFeature)
         .values(data)
         .returning();
      const created = result?.[0];
      if (!created) throw AppError.database("Brand feature not created");
      return created;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create brand feature: ${(err as Error).message}`,
      );
   }
}

export async function getBrandFeatureById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<BrandFeatureSelect> {
   try {
      const result = await dbClient.query.brandFeature.findFirst({
         where: eq(brandFeature.id, id),
         with: {
            brand: true,
         },
      });
      if (!result) throw AppError.database("Brand feature not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get brand feature: ${(err as Error).message}`,
      );
   }
}

export async function updateBrandFeature(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<BrandFeatureInsert>,
): Promise<BrandFeatureSelect> {
   try {
      const result = await dbClient
         .update(brandFeature)
         .set(data)
         .where(eq(brandFeature.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw AppError.database("Brand feature not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update brand feature: ${(err as Error).message}`,
      );
   }
}

export async function deleteBrandFeature(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(brandFeature)
         .where(eq(brandFeature.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw AppError.database("Brand feature not found");
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete brand feature: ${(err as Error).message}`,
      );
   }
}

export async function getFeaturesByBrandId(
   dbClient: DatabaseInstance,
   brandId: string,
   {
      page = 1,
      limit = 50,
      sortBy = "extractedAt",
      sortOrder = "desc",
   }: {
      page?: number;
      limit?: number;
      sortBy?: "extractedAt" | "featureName";
      sortOrder?: "asc" | "desc";
   } = {},
): Promise<BrandFeatureSelect[]> {
   try {
      const offset = (page - 1) * limit;
      const orderByField =
         sortBy === "featureName"
            ? brandFeature.featureName
            : brandFeature.extractedAt;
      const orderByDirection = sortOrder === "asc" ? "asc" : "desc";

      return await dbClient.query.brandFeature.findMany({
         limit,
         offset,
         orderBy: [
            orderByDirection === "asc" ? orderByField : desc(orderByField),
         ],
         where: eq(brandFeature.brandId, brandId),
         with: {
            brand: {
               columns: {
                  id: true,
                  websiteUrl: true,
               },
            },
         },
      });
   } catch (err) {
      throw AppError.database(
         `Failed to get features by brand ID: ${(err as Error).message}`,
      );
   }
}

export async function getTotalFeaturesByBrandId(
   dbClient: DatabaseInstance,
   brandId: string,
): Promise<number> {
   try {
      const result = await dbClient
         .select({ value: sql<number>`cast(count(*) as int)` })
         .from(brandFeature)
         .where(eq(brandFeature.brandId, brandId));
      return result[0]?.value ?? 0;
   } catch (err) {
      throw AppError.database(
         `Failed to get total features by brand ID: ${(err as Error).message}`,
      );
   }
}

export async function searchFeatures(
   dbClient: DatabaseInstance,
   {
      query,
      brandId,
      page = 1,
      limit = 20,
   }: {
      query: string;
      brandId?: string;
      page?: number;
      limit?: number;
   },
): Promise<BrandFeatureSelect[]> {
   try {
      const offset = (page - 1) * limit;
      const searchPattern = `%${query.toLowerCase()}%`;

      const buildWhereCondition = () => {
         const base = sql`${brandFeature.featureName}::text ILIKE ${searchPattern} OR ${brandFeature.summary}::text ILIKE ${searchPattern}`;
         if (!brandId) return base;
         return and(base, eq(brandFeature.brandId, brandId));
      };

      const whereCondition = buildWhereCondition();

      return await dbClient.query.brandFeature.findMany({
         limit,
         offset,
         orderBy: [desc(brandFeature.extractedAt)],
         where: whereCondition,
         with: {
            brand: {
               columns: {
                  id: true,
                  websiteUrl: true,
               },
            },
         },
      });
   } catch (err) {
      throw AppError.database(
         `Failed to search brand features: ${(err as Error).message}`,
      );
   }
}

export async function getRecentFeatures(
   dbClient: DatabaseInstance,
   {
      organizationId,
      days = 30,
      limit = 50,
   }: {
      organizationId?: string;
      days?: number;
      limit?: number;
   },
): Promise<BrandFeatureSelect[]> {
   try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const buildDateAndOwnerWhere = (
         cutoffDate: Date,
         organizationId?: string,
      ) => {
         const dateCondition = sql`${brandFeature.extractedAt} >= ${cutoffDate}`;
         const ownerExists = buildOwnerExists(organizationId);
         return and(dateCondition, ownerExists);
      };
      const whereCondition = buildDateAndOwnerWhere(cutoffDate, organizationId);

      return await dbClient.query.brandFeature.findMany({
         limit,
         orderBy: [desc(brandFeature.extractedAt)],
         where: whereCondition,
         with: {
            brand: {
               columns: {
                  id: true,
                  websiteUrl: true,
               },
            },
         },
      });
   } catch (err) {
      throw AppError.database(
         `Failed to get recent brand features: ${(err as Error).message}`,
      );
   }
}

export async function bulkCreateFeatures(
   dbClient: DatabaseInstance,
   features: Omit<BrandFeatureInsert, "id" | "extractedAt">[],
): Promise<BrandFeatureSelect[]> {
   try {
      if (!features || features.length === 0) {
         return [];
      }

      const result = await dbClient
         .insert(brandFeature)
         .values(features)
         .returning();
      return result;
   } catch (err) {
      throw AppError.database(
         `Failed to bulk create brand features: ${(err as Error).message}`,
      );
   }
}

export async function bulkDeleteFeatures(
   dbClient: DatabaseInstance,
   ids: string[],
): Promise<{ deletedCount: number }> {
   try {
      if (!ids || ids.length === 0) {
         return { deletedCount: 0 };
      }

      const result = await dbClient
         .delete(brandFeature)
         .where(inArray(brandFeature.id, ids))
         .returning();

      return { deletedCount: result.length };
   } catch (err) {
      throw AppError.database(
         `Failed to bulk delete brand features: ${(err as Error).message}`,
      );
   }
}

export async function deleteFeaturesByBrandId(
   dbClient: DatabaseInstance,
   brandId: string,
): Promise<{ deletedCount: number }> {
   try {
      const result = await dbClient
         .delete(brandFeature)
         .where(eq(brandFeature.brandId, brandId))
         .returning();

      return { deletedCount: result.length };
   } catch (err) {
      throw AppError.database(
         `Failed to delete brand features by brand ID: ${(err as Error).message}`,
      );
   }
}

export async function getFeaturesStats(
   dbClient: DatabaseInstance,
   {
      organizationId,
      days = 30,
   }: {
      organizationId?: string;
      days?: number;
   },
): Promise<{
   totalFeatures: number;
   totalBrands: number;
   avgFeaturesPerBrand: number;
}> {
   try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const ownerExists = buildOwnerExists(organizationId);

      const featuresResult = await dbClient
         .select({ value: sql<number>`cast(count(*) as int)` })
         .from(brandFeature)
         .where(
            and(sql`${brandFeature.extractedAt} >= ${cutoffDate}`, ownerExists),
         );

      const brandsResult = await dbClient
         .select({
            value: sql<number>`cast(count(DISTINCT ${brandFeature.brandId}) as int)`,
         })
         .from(brandFeature)
         .where(
            and(sql`${brandFeature.extractedAt} >= ${cutoffDate}`, ownerExists),
         );

      const totalFeatures = featuresResult[0]?.value ?? 0;
      const totalBrands = brandsResult[0]?.value ?? 0;
      const avgFeaturesPerBrand =
         totalBrands > 0 ? totalFeatures / totalBrands : 0;

      return {
         avgFeaturesPerBrand,
         totalBrands,
         totalFeatures,
      };
   } catch (err) {
      throw AppError.database(
         `Failed to get brand features stats: ${(err as Error).message}`,
      );
   }
}
