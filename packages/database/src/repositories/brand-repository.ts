import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { brand, type BrandInsert } from "../schemas/brand";

export async function createBrand(
	dbClient: DatabaseInstance,
	data: BrandInsert,
) {
	try {
		const result = await dbClient.insert(brand).values(data).returning();
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(`Failed to create brand: ${(err as Error).message}`);
	}
}

export async function getBrandById(
	dbClient: DatabaseInstance,
	brandId: string,
) {
	try {
		const result = await dbClient.query.brand.findFirst({
			where: (brand, { eq }) => eq(brand.id, brandId),
		});
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(`Failed to get brand: ${(err as Error).message}`);
	}
}

export async function getBrandByOrgId(
	dbClient: DatabaseInstance,
	organizationId: string,
) {
	try {
		const result = await dbClient.query.brand.findFirst({
			where: (brand, { eq }) => eq(brand.organizationId, organizationId),
		});
		if (!result) {
			throw AppError.notFound("Brand not found");
		}
		return result;
	} catch (err) {
		propagateError(err);
		throw AppError.database(`Failed to get brand by organization: ${(err as Error).message}`);
	}
}

export async function updateBrand(
	dbClient: DatabaseInstance,
	brandId: string,
	data: Partial<BrandInsert>,
) {
	try {
		const result = await dbClient
			.update(brand)
			.set(data)
			.where(eq(brand.id, brandId))
			.returning();

		if (!result.length) {
			throw AppError.database("Brand not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(`Failed to update brand: ${(err as Error).message}`);
	}
}

export async function deleteBrand(
	dbClient: DatabaseInstance,
	brandId: string,
) {
	try {
		const result = await dbClient
			.delete(brand)
			.where(eq(brand.id, brandId))
			.returning();

		if (!result.length) {
			throw AppError.database("Brand not found");
		}
		return result[0];
	} catch (err) {
		propagateError(err);
		throw AppError.database(`Failed to delete brand: ${(err as Error).message}`);
	}
}
