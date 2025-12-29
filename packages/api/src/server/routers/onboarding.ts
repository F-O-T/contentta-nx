import { getTotalAgents } from "@packages/database/repositories/agent-repository";
import { findOrganizationById } from "@packages/database/repositories/auth-repository";
import { getBrandByOrgId } from "@packages/database/repositories/brand-repository";
import { APIError } from "@packages/utils/errors";
import { protectedProcedure, router } from "../trpc";

export const onboardingRouter = router({
   completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;

      if (!organizationId) {
         throw APIError.unauthorized("Unauthorized");
      }

      await resolvedCtx.auth.api.updateOrganization({
         body: {
            data: {
               onboardingCompleted: true,
            },
            organizationId,
         },
         headers: resolvedCtx.headers,
      });

      return { success: true };
   }),

   getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.organizationId;
      const userId = resolvedCtx.session?.user?.id;

      if (!organizationId) {
         throw APIError.unauthorized("Unauthorized");
      }

      const organization = await findOrganizationById(
         resolvedCtx.db,
         organizationId,
      );

      if (!organization) {
         throw APIError.notFound("Organization not found");
      }

      const [agentsCount, brand] = await Promise.all([
         getTotalAgents(resolvedCtx.db, { organizationId, userId }),
         (async () => {
            try {
               return await getBrandByOrgId(resolvedCtx.db, organizationId);
            } catch {
               return null;
            }
         })(),
      ]);

      const hasAgents = agentsCount > 0;
      const hasBrand = !!brand;

      return {
         hasAgents,
         hasBrand,
         needsOnboarding: !organization.onboardingCompleted || !hasAgents,
         organizationSlug: organization.slug,
         organizationContext: organization.context,
      };
   }),
});
