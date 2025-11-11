import { AppError, propagateError } from "@packages/utils/errors";
import { eq, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import type { BrandInsert, BrandSelect } from "../schemas/brand";
import { brand } from "../schemas/brand";

export async function createBrand(
   dbClient: DatabaseInstance,
   data: Omit<BrandInsert, "id" | "createdAt" | "updatedAt">,
): Promise<BrandSelect> {
   try {
      const result = await dbClient.insert(brand).values(data).returning();
      const created = result?.[0];
      if (!created) throw AppError.database("Brand not created");
      return created;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create brand: ${(err as Error).message}`,
      );
   }
}

export async function getBrandById(dbClient: DatabaseInstance, id: string) {
   try {
      const result = await dbClient.query.brand.findFirst({
         where: eq(brand.id, id),
         with: {
            features: true,
         },
      });
      if (!result) throw AppError.database("Brand not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(`Failed to get brand: ${(err as Error).message}`);
   }
}

export async function updateBrand(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<BrandInsert>,
): Promise<BrandSelect> {
   try {
      const result = await dbClient
         .update(brand)
         .set(data)
         .where(eq(brand.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw AppError.database("Brand not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update brand: ${(err as Error).message}`,
      );
   }
}

export async function deleteBrand(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(brand)
         .where(eq(brand.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw AppError.database("Brand not found");
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete brand: ${(err as Error).message}`,
      );
   }
}

export async function getBrandByOrgId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.brand.findFirst({
         orderBy: (brand, { desc }) => [desc(brand.createdAt)],
         where: eq(brand.organizationId, organizationId),
         with: {
            features: {
               orderBy: (brandFeature, { desc }) => [
                  desc(brandFeature.extractedAt),
               ],
            },
         },
      });
      if (!result) throw AppError.database("Brand not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get brand by organization: ${(err as Error).message}`,
      );
   }
}

export async function getTotalBrands(
   dbClient: DatabaseInstance,
   { organizationId }: { organizationId?: string },
): Promise<number> {
   try {
      if (organizationId) {
         const result = await dbClient
            .select({ value: sql<number>`cast(count(*) as int)` })
            .from(brand)
            .where(eq(brand.organizationId, organizationId));
         return result[0]?.value ?? 0;
      }
      return 0;
   } catch (err) {
      throw AppError.database(
         `Failed to get total brands: ${(err as Error).message}`,
      );
   }
}
