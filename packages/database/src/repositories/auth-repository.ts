import { AppError, propagateError } from "@packages/utils/errors";
import { createSlug, generateRandomSuffix } from "@packages/utils/text";
import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { member, organization } from "../schemas/auth";

export async function findMemberByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.member.findFirst({
         where: (member, { eq }) => eq(member.userId, userId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find user by id: ${(err as Error).message}`,
      );
   }
}

export async function findMemberByUserIdAndOrganizationId(
   dbClient: DatabaseInstance,
   userId: string,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.member.findFirst({
         where: (member, { eq, and }) =>
            and(
               eq(member.userId, userId),
               eq(member.organizationId, organizationId),
            ),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find member: ${(err as Error).message}`,
      );
   }
}

export async function findOrganizationById(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.organization.findFirst({
         where: (org, { eq }) => eq(org.id, organizationId),
      });
      if (!result) throw AppError.database("Organization not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find organization by id: ${(err as Error).message}`,
      );
   }
}

export async function isOrganizationOwner(
   dbClient: DatabaseInstance,
   userId: string,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.member.findFirst({
         where: (member, { eq, and }) =>
            and(
               eq(member.userId, userId),
               eq(member.organizationId, organizationId),
               eq(member.role, "owner"),
            ),
      });
      return !!result;
   } catch (err) {
      throw AppError.database(
         `Failed to check organization ownership: ${(err as Error).message}`,
      );
   }
}

export async function getOrganizationMembers(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.member.findMany({
         where: (member, { eq }) => eq(member.organizationId, organizationId),
         with: {
            user: true,
         },
      });
      return result;
   } catch (err) {
      throw AppError.database(
         `Failed to get organization members: ${(err as Error).message}`,
      );
   }
}

export async function createDefaultOrganization(
   dbClient: DatabaseInstance,
   userId: string,
   userName: string,
) {
   try {
      const suffix = generateRandomSuffix();
      const safeUserName = (userName ?? "Workspace").trim();
      const safeSuffix = String(suffix).trim();
      const orgName = `${safeUserName}${safeSuffix}`;
      const orgSlug = createSlug(orgName);
      const now = new Date();

      const [createdOrganization] = await dbClient
         .insert(organization)
         .values({
            context: "personal",
            createdAt: now,
            description: orgName,
            name: orgName,
            onboardingCompleted: false,
            slug: orgSlug,
         })
         .returning();

      if (!createdOrganization) {
         throw AppError.database("Failed to create organization");
      }

      await dbClient.insert(member).values({
         createdAt: now,
         organizationId: createdOrganization.id,
         role: "owner",
         userId,
      });

      console.log(
         `Created organization "${orgName}" (${createdOrganization.id}) for user ${userId}`,
      );

      return createdOrganization;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create default organization: ${(err as Error).message}`,
      );
   }
}

export async function updateOrganization(
   dbClient: DatabaseInstance,
   organizationId: string,
   data: { logo?: string },
) {
   try {
      const result = await dbClient
         .update(organization)
         .set(data)
         .where(eq(organization.id, organizationId))
         .returning();

      if (!result.length) {
         throw AppError.database("Organization not found");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update organization: ${(err as Error).message}`,
      );
   }
}

export async function getOrganizationMembership(
   dbClient: DatabaseInstance,
   userId: string,
   organizationSlug: string,
) {
   try {
      const org = await dbClient.query.organization.findFirst({
         where: (organization, { eq }) =>
            eq(organization.slug, organizationSlug),
      });

      if (!org) {
         return { membership: null, organization: null };
      }

      const membership = await dbClient.query.member.findFirst({
         where: (member, { eq, and }) =>
            and(eq(member.organizationId, org.id), eq(member.userId, userId)),
      });

      return { membership, organization: org };
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get organization membership: ${(err as Error).message}`,
      );
   }
}
