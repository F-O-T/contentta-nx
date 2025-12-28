import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { getQueryClient, trpc } from "@/integrations/clients";

export const Route = createFileRoute("/share-target")({
   beforeLoad: async () => {
      const queryClient = getQueryClient();

      try {
         const organizations = await queryClient.fetchQuery(
            trpc.organization.getOrganizations.queryOptions(),
         );

         if (!organizations.length) {
            throw redirect({ to: "/auth/sign-in" });
         }
      } catch (error) {
         if (
            error instanceof Response ||
            (error as { isRedirect?: boolean })?.isRedirect
         ) {
            throw error;
         }
         throw redirect({ to: "/auth/sign-in" });
      }
   },
   component: ShareTargetComponent,
});

async function getShareDataFromCache(
   retries = 5,
   delay = 150,
): Promise<{
   content: string;
   filename: string;
} | null> {
   for (let i = 0; i < retries; i++) {
      try {
         const cache = await caches.open("share-target-temp");
         const response = await cache.match("pending-share");
         if (response) {
            const data = await response.json();
            await cache.delete("pending-share");
            return data;
         }
      } catch {
         // Cache not available or data invalid
      }
      if (i < retries - 1) {
         await new Promise((r) => setTimeout(r, delay));
      }
   }
   return null;
}

function ShareTargetComponent() {
   const navigate = useNavigate();

   useEffect(() => {
      async function handleShare() {
         const queryClient = getQueryClient();

         const organizations = await queryClient.fetchQuery(
            trpc.organization.getOrganizations.queryOptions(),
         );

         const lastSlug = localStorage.getItem("montte:last-organization-slug");
         const foundOrg = lastSlug
            ? organizations.find((o) => o.slug === lastSlug)
            : null;
         const org = foundOrg ?? organizations[0];

         if (!org) {
            navigate({ to: "/auth/sign-in" });
            return;
         }

         const orgSlug = org.slug;

         const cacheData = await getShareDataFromCache();

         const createPendingImport = (content: string, filename: string) => {
            const ext = filename.split(".").pop()?.toLowerCase();
            const fileType = ext === "csv" ? "csv" : "ofx";
            return {
               fileType,
               content,
               filename,
               timestamp: Date.now(),
               bankAccountId: null,
               parsedTransactions: [],
               selectedRowIndices: [],
               duplicates: [],
               duplicatesChecked: false,
               csvPreviewData: null,
               columnMapping: null,
            };
         };

         if (cacheData) {
            sessionStorage.setItem(
               "montte:pending-import",
               JSON.stringify(
                  createPendingImport(cacheData.content, cacheData.filename),
               ),
            );
         } else {
            const pendingShare = sessionStorage.getItem(
               "montte:pending-share-target",
            );

            if (pendingShare) {
               try {
                  const data = JSON.parse(pendingShare) as {
                     content: string;
                     filename: string;
                  };

                  sessionStorage.removeItem("montte:pending-share-target");
                  sessionStorage.setItem(
                     "montte:pending-import",
                     JSON.stringify(
                        createPendingImport(data.content, data.filename),
                     ),
                  );
               } catch {
                  // Invalid data, ignore
               }
            }
         }

         navigate({
            params: { slug: orgSlug },
            to: "/$slug/home",
         });
      }

      handleShare();
   }, [navigate]);

   return (
      <div className="flex h-screen items-center justify-center bg-background">
         <Loader2 className="size-8 animate-spin text-primary" />
      </div>
   );
}
