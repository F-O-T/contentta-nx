import { initTRPC, TRPCError } from "@trpc/server";
import type { Polar } from "@polar-sh/sdk";
import SuperJSON from "superjson";
import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { PgVectorDatabaseInstance } from "@packages/rag/client";
import {
   findMemberByUserId,
   isOrganizationOwner,
} from "@packages/database/repositories/auth-repository";
import { getCustomerState } from "@packages/payment/ingestion";
import type { SupportedLng } from "@packages/localization";
import { createContentaSdk } from "@packages/contenta-sdk";
export const createTRPCContext = async ({
   auth,
   polarClient,
   db,
   headers,
   minioClient,
   minioBucket,
   ragClient,
}: {
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   minioBucket: string;
   headers: Headers;
   ragClient: PgVectorDatabaseInstance;
   polarClient: Polar;
}): Promise<{
   polarClient: Polar;
   minioBucket: string;
   db: DatabaseInstance;
   minioClient: MinioClient;
   ragClient: PgVectorDatabaseInstance;
   auth: AuthInstance;
   headers: Headers;
   session: AuthInstance["$Infer"]["Session"] | null;
   contentaSdk: ReturnType<typeof createContentaSdk>;
   language: SupportedLng;
}> => {
   const session = await auth.api.getSession({
      headers,
   });

   const language = headers.get("x-locale") as SupportedLng;
   const contentaSdk = createContentaSdk(language || "en");
   return {
      polarClient,
      minioBucket,
      minioClient,
      db,
      ragClient,
      session,
      auth,
      contentaSdk,
      headers,
      language,
   };
};

export const t = initTRPC
   .context<ReturnType<typeof createTRPCContext>>()
   .create({
      transformer: SuperJSON,
   });

export const router = t.router;

const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
   console.log(`Request: ${type} ${path}`);
   const start = Date.now();
   const result = await next();
   const durationMs = Date.now() - start;
   console.log(`Response: ${type} ${path} - ${durationMs}ms`);
   return result;
});

const isAuthed = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;
   const apikey = resolvedCtx.headers.get("sdk-api-key");

   if (apikey) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "This endpoint does not accept API Key authentication.",
      });
   }
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }
   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});

const sdkAuth = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;
   // 1. Get the Authorization header from the incoming request.
   const authHeader = resolvedCtx.headers.get("sdk-api-key");
   if (!authHeader) {
      throw new TRPCError({
         code: "UNAUTHORIZED",
         message: "Missing API Key.",
      });
   }

   const apiKeyData = await resolvedCtx.auth.api.verifyApiKey({
      headers: resolvedCtx.headers,
      body: { key: authHeader },
   });

   if (!apiKeyData.valid) {
      throw new TRPCError({
         code: "UNAUTHORIZED",
         message: "Invalid API Key.",
      });
   }
   const session = await resolvedCtx.auth.api.getSession({
      headers: new Headers({
         "sdk-api-key": authHeader,
      }),
   });
   return next({
      ctx: {
         session: {
            ...session,
         },
      },
   });
});

const timingMiddleware = t.middleware(async ({ next, path }) => {
   const start = Date.now();
   const result = await next();
   const end = Date.now();

   console.info(`[TRPC] ${path} took ${end - start}ms to execute`);

   return result;
});

const hasOrganizationAccess = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   // First ensure user is authenticated
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }

   const userId = resolvedCtx.session.user.id;

   // Check if user is part of an organization
   const memberWithOrg = await findMemberByUserId(resolvedCtx.db, userId);

   if (memberWithOrg) {
      // Find the organization owner
      const ownerMember = await resolvedCtx.db.query.member.findFirst({
         where: (member, { eq, and }) =>
            and(
               eq(member.organizationId, memberWithOrg.organizationId),
               eq(member.role, "owner"),
            ),
      });

      if (!ownerMember) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Organization has no owner",
         });
      }

      const ownerState = await getCustomerState(
         resolvedCtx.polarClient,
         ownerMember.userId,
      );

      if (!ownerState.activeSubscriptions) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Organization owner must have an active subscription",
         });
      }

      return next({
         ctx: {
            session: { ...resolvedCtx.session },
         },
      });
   }

   // User is not part of any organization - check their own subscription
   const customerState = await resolvedCtx.auth.api.state({
      headers: resolvedCtx.headers,
   });

   if (!customerState.activeSubscriptions) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "Active subscription required",
      });
   }

   return next({
      ctx: {
         session: { ...resolvedCtx.session },
         customerState,
      },
   });
});

const hasOrganizationOwnerAccess = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }

   const userId = resolvedCtx.session.user.id;

   const memberWithOrg = await findMemberByUserId(resolvedCtx.db, userId);

   if (!memberWithOrg) {
      const customerState = await resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });

      if (!customerState.activeSubscriptions) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message: "Active subscription required",
         });
      }

      return next({
         ctx: {
            session: { ...resolvedCtx.session },
         },
      });
   }

   // Check if user is the owner of the organization
   const isOwner = await isOrganizationOwner(
      resolvedCtx.db,
      userId,
      memberWithOrg.organizationId,
   );

   if (!isOwner) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "User is not the owner of the organization",
      });
   }

   const customerState = await resolvedCtx.auth.api.state({
      headers: resolvedCtx.headers,
   });

   if (!customerState.activeSubscriptions) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "Active subscription required",
      });
   }

   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});

export const hasGenerationCredits = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;

   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }

   const userId = resolvedCtx.session.user.id;

   const memberWithOrg = await findMemberByUserId(resolvedCtx.db, userId);

   if (!memberWithOrg) {
      const customerState = await resolvedCtx.auth.api.state({
         headers: resolvedCtx.headers,
      });

      const hasBalance = customerState.activeMeters?.some(
         (meter) => meter.creditedUnits > 0 && meter.balance > 0,
      );

      if (!hasBalance) {
         throw new TRPCError({
            code: "FORBIDDEN",
            message:
               "Insufficient generation credits. Please upgrade your plan or purchase more credits.",
         });
      }

      return next({
         ctx: {
            session: { ...resolvedCtx.session },
            customerState,
         },
      });
   }

   const ownerMember = await resolvedCtx.db.query.member.findFirst({
      where: (member, { eq, and }) =>
         and(
            eq(member.organizationId, memberWithOrg.organizationId),
            eq(member.role, "owner"),
         ),
   });

   if (!ownerMember) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message: "Organization has no owner",
      });
   }

   const customerStateToCheck = await getCustomerState(
      resolvedCtx.polarClient,
      ownerMember.userId,
   );

   const hasBalance = customerStateToCheck.activeMeters?.some(
      (meter) => meter.creditedUnits > 0 && meter.balance > 0,
   );

   if (!hasBalance) {
      throw new TRPCError({
         code: "FORBIDDEN",
         message:
            "Insufficient generation credits. Please upgrade your plan or purchase more credits.",
      });
   }

   return next({
      ctx: {
         session: { ...resolvedCtx.session },
         customerState: customerStateToCheck,
      },
   });
});

export const publicProcedure = t.procedure
   .use(loggerMiddleware)
   .use(timingMiddleware);
export const protectedProcedure = publicProcedure.use(isAuthed);
export const sdkProcedure = publicProcedure.use(sdkAuth);

// Organization-specific procedures
export const organizationProcedure = protectedProcedure.use(
   hasOrganizationAccess,
);
export const organizationOwnerProcedure = protectedProcedure.use(
   hasOrganizationOwnerAccess,
);

// Generation credits procedure
export const generationProcedure = protectedProcedure.use(hasGenerationCredits);
